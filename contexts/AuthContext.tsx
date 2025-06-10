"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  getAccessToken,
  setAccessToken,
  clearAuthTokens,
} from "@/lib/apiClient"; // Assuming apiClient handles token storage
import { clientLogger } from "@/lib/clientLogger";

// Define User type
interface User {
  id: string;
  email: string;
  name?: string;
  // Add other relevant user fields
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login: (accessToken: string, userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start as true to check initial auth status
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    // Helper function to decode JWT token safely
    const decodeJWT = (token: string) => {
      try {
        // Check if we're in a browser environment
        if (typeof window === "undefined" || typeof atob === "undefined") {
          // In Node.js environment (tests), use Buffer for base64 decoding
          const parts = token.split(".");
          if (parts.length !== 3) {
            throw new Error("Invalid JWT format");
          }

          const base64Url = parts[1];
          const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");

          // Use Buffer in Node.js environment
          const decoded = Buffer.from(base64, "base64").toString("utf-8");
          return JSON.parse(decoded);
        } else {
          // Browser environment - use atob
          const base64Url = token.split(".")[1];
          if (!base64Url) {
            throw new Error("Invalid JWT format");
          }

          const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split("")
              .map(function (c) {
                return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
              })
              .join(""),
          );

          return JSON.parse(jsonPayload);
        }
      } catch (error) {
        throw new Error(
          `JWT decode failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    };

    const initializeAuth = async () => {
      clientLogger.time("auth_initialization");
      clientLogger.debug("Starting authentication initialization");

      try {
        const token = getAccessToken(); // Synchronous in current mock, could be async
        if (token) {
          clientLogger.debug("Found existing access token");
          // Decode the JWT token to extract user data
          try {
            const decoded = decodeJWT(token);

            if (decoded.userId && decoded.email && isMounted) {
              const userData = {
                id: decoded.userId,
                email: decoded.email,
              };

              setUser(userData);
              setIsAuthenticated(true);
              clientLogger.setUserId(decoded.userId);

              clientLogger.logAuthEvent("login_success", {
                method: "existing_token",
                userId: decoded.userId,
                email:
                  decoded.email.substring(0, 3) +
                  "***@" +
                  decoded.email.split("@")[1],
              });
            }
          } catch (decodeError) {
            console.error("Failed to initialize auth:", decodeError);
            clientLogger.logError(decodeError, {
              context: "token_decode",
              operation: "auth_initialization",
            });
            // If token is invalid, clear it
            clearAuthTokens();
            clientLogger.logAuthEvent("login_failure", {
              method: "existing_token",
              reason: "invalid_token",
            });
          }
        } else {
          clientLogger.debug("No access token found, attempting refresh");
          // Only try to refresh in browser environment
          if (typeof window !== "undefined" && typeof fetch !== "undefined") {
            try {
              clientLogger.logRequest("POST", "/api/auth/refresh-token");
              const refreshStartTime = Date.now();

              const response = await fetch("/api/auth/refresh-token", {
                method: "POST",
                credentials: "include", // Include cookies for refresh token
              });

              const refreshDuration = Date.now() - refreshStartTime;
              clientLogger.logResponse(
                "POST",
                "/api/auth/refresh-token",
                response.status,
                refreshDuration,
              );

              if (response.ok) {
                const data = await response.json();
                if (data.accessToken) {
                  clientLogger.debug("Token refresh successful");
                  // Decode the new token and set user
                  try {
                    const decoded = decodeJWT(data.accessToken);

                    if (decoded.userId && decoded.email && isMounted) {
                      setAccessToken(data.accessToken); // Store the new token
                      const userData = {
                        id: decoded.userId,
                        email: decoded.email,
                      };

                      setUser(userData);
                      setIsAuthenticated(true);
                      clientLogger.setUserId(decoded.userId);

                      clientLogger.logAuthEvent("token_refresh", {
                        userId: decoded.userId,
                        email:
                          decoded.email.substring(0, 3) +
                          "***@" +
                          decoded.email.split("@")[1],
                        duration: refreshDuration,
                      });
                    }
                  } catch (decodeError) {
                    clientLogger.logError(decodeError, {
                      context: "refreshed_token_decode",
                      operation: "auth_initialization",
                    });
                  }
                }
              } else {
                clientLogger.logAuthEvent("login_failure", {
                  method: "token_refresh",
                  reason: "refresh_failed",
                  status: response.status,
                });
              }
            } catch (refreshError) {
              clientLogger.logError(refreshError, {
                context: "token_refresh",
                operation: "auth_initialization",
              });
              clientLogger.logAuthEvent("login_failure", {
                method: "token_refresh",
                reason: "network_error",
              });
            }
          } else {
            // In test environment, skip refresh attempt
            clientLogger.debug(
              "Skipping token refresh in non-browser environment",
            );
          }
        }
      } catch (error) {
        console.error("Failed to initialize auth:", error);
        clientLogger.logError(error, {
          context: "auth_initialization",
          operation: "auth_initialization",
        });
        // Remain unauthenticated if token check fails
      } finally {
        if (isMounted) {
          setIsLoading(false);
          clientLogger.timeEnd("auth_initialization");
          clientLogger.debug("Authentication initialization completed");
        }
      }
    };

    initializeAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = (newAccessToken: string, userData: User) => {
    clientLogger.debug("Manual login called", {
      userId: userData.id,
      email:
        userData.email.substring(0, 3) + "***@" + userData.email.split("@")[1],
    });

    setAccessToken(newAccessToken);
    setUser(userData);
    setIsAuthenticated(true);
    clientLogger.setUserId(userData.id);

    clientLogger.logAuthEvent("login_success", {
      method: "manual_login",
      userId: userData.id,
      email:
        userData.email.substring(0, 3) + "***@" + userData.email.split("@")[1],
    });
  };

  const logout = async () => {
    const logoutStartTime = Date.now();
    const currentUserId = user?.id;

    clientLogger.debug("Logout initiated", {
      userId: currentUserId,
    });

    // Only call logout API in browser environment
    if (typeof window !== "undefined" && typeof fetch !== "undefined") {
      try {
        // Call the logout API to clear server-side refresh token
        clientLogger.logRequest("POST", "/api/auth/logout");
        const response = await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include", // Include cookies
        });

        const logoutDuration = Date.now() - logoutStartTime;
        clientLogger.logResponse(
          "POST",
          "/api/auth/logout",
          response.status,
          logoutDuration,
        );
      } catch (error) {
        clientLogger.logError(error, {
          context: "logout_api_call",
          operation: "logout",
        });
        // Continue with client-side logout even if server call fails
      }
    }

    try {
      clearAuthTokens();
      clientLogger.debug("Auth tokens cleared successfully");
    } catch (error) {
      console.error("Failed to clear tokens during logout:", error);
      clientLogger.logError(error, {
        context: "clear_tokens",
        operation: "logout",
      });
      // Proceed with logout on client-side even if token clearing fails
    }

    setUser(null);
    setIsAuthenticated(false);
    clientLogger.clearUserId();

    clientLogger.logAuthEvent("logout", {
      userId: currentUserId,
      duration: Date.now() - logoutStartTime,
    });

    router.push("/login");
  };

  // This effect would listen for a global event or a state change indicating
  // that a token refresh has definitively failed.
  useEffect(() => {
    const handleAuthFailure = () => {
      clientLogger.warn("Unrecoverable authentication failure detected", {
        context: "auth_failure_handler",
      });
      logout();
    };

    // Placeholder: How to subscribe to such an event from apiClient?
    // One way is an event emitter, or apiClient could call a callback registered by AuthContext.
    // For now, this is conceptual. The `apiClient` currently throws an error on refresh failure,
    // which would need to be caught by a component that then calls `logout()`.
    // Or, components making API calls can catch the error and call logout.

    // Example: window.addEventListener('authFailure', handleAuthFailure);
    // return () => window.removeEventListener('authFailure', handleAuthFailure);
  }, [router]); // Added router to dependency array for logout

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, isLoading, user, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// To make this context effective, wrap your application's layout or root component:
// app/layout.tsx
// import { AuthProvider } from '@/contexts/AuthContext';
// ...
// <AuthProvider>
//   {children}
// </AuthProvider>
