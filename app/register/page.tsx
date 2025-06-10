"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Eye,
  EyeOff,
  UserPlus,
  LogIn,
  ArrowRight,
  Sparkles,
  Shield,
  Check,
} from "lucide-react";

const passwordValidation = new RegExp(
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]).{8,}$/,
);

const registerFormSchema = z
  .object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters long" })
      .regex(passwordValidation, {
        message:
          "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      }),
    confirmPassword: z
      .string()
      .min(1, { message: "Please confirm your password" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerFormSchema>;

// Import the token clearing function
import { clearAuthTokens } from "@/lib/apiClient";
import { useAuth } from "@/contexts/AuthContext";

export default function RegisterPage() {
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  // Redirect if user is already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.push("/dashboard");
      return;
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    // Clear any existing tokens when the register page loads (only if user is not logged in)
    if (!authLoading && !user) {
      clearAuthTokens();
    }
  }, [authLoading, user]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
  });

  const password = watch("password", "");

  // Password strength indicators
  const passwordRequirements = [
    { label: "At least 8 characters", test: (pw: string) => pw.length >= 8 },
    {
      label: "Contains uppercase letter",
      test: (pw: string) => /[A-Z]/.test(pw),
    },
    {
      label: "Contains lowercase letter",
      test: (pw: string) => /[a-z]/.test(pw),
    },
    { label: "Contains number", test: (pw: string) => /\d/.test(pw) },
    {
      label: "Contains special character",
      test: (pw: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(pw),
    },
  ];

  const onSubmit: SubmitHandler<RegisterFormValues> = async (data) => {
    setApiError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: data.email, password: data.password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Build detailed error message from validation errors
        let errorMessage =
          errorData.error || "Registration failed. Please try again.";
        if (errorData.details) {
          // Create a more user-friendly message
          if (errorData.details.email) {
            errorMessage += ` Email: ${errorData.details.email.join(", ")}.`;
          }
          if (errorData.details.password) {
            errorMessage += ` Password: ${errorData.details.password.join(
              ", ",
            )}.`;
          }
        }
        setApiError(errorMessage);
      } else {
        router.push("/login?message=registration-success");
      }
    } catch (error) {
      console.error("Registration request failed:", error);
      setApiError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute -bottom-1/2 -left-1/2 w-96 h-96 bg-primary/3 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/2 rounded-full blur-3xl animate-bounce-subtle"></div>
        </div>

        <div className="relative z-10">
          <Card className="bg-card/80 backdrop-blur-sm border shadow-xl animate-scale-in">
            <CardContent className="p-8 text-center space-y-4">
              <div className="loading-shimmer w-16 h-16 rounded-full mx-auto"></div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-slate-200">
                  Checking Authentication
                </h2>
                <p className="text-muted-foreground">Please wait...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // If user is logged in, don't render the register form (redirect will happen)
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-1/2 -left-1/2 w-96 h-96 bg-primary/3 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/2 rounded-full blur-3xl animate-bounce-subtle"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <Card className="bg-card/80 backdrop-blur-sm border shadow-xl animate-scale-in">
          <CardHeader className="space-y-6 text-center pb-8">
            <div className="flex justify-center items-center">
              <div className="relative animate-float">
                <svg
                  width="64"
                  height="64"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-primary drop-shadow-lg"
                >
                  <path
                    d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z"
                    fill="currentColor"
                  />
                  <path
                    d="M12.5 7H11V13L16.25 16.15L17 14.92L12.5 12.25V7Z"
                    fill="currentColor"
                  />
                  <path
                    d="M8.5 10.5C8.5 9.67 9.17 9 10 9C10.83 9 11.5 9.67 11.5 10.5C11.5 11.33 10.83 12 10 12C9.17 12 8.5 11.33 8.5 10.5Z"
                    fill="currentColor"
                  />
                </svg>
                <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-yellow-400 animate-pulse" />
              </div>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold text-foreground tracking-tight">
                Join Noteworthy
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Create your account and start your knowledge journey
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {apiError && (
              <div
                className="p-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-lg text-sm animate-slide-in-bottom"
                data-testid="error-message"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-destructive rounded-full"></div>
                  <span>{apiError}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div
                className="space-y-2 animate-slide-in-left"
                style={{ animationDelay: "100ms" }}
              >
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-foreground"
                >
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  data-testid="email-input"
                  {...register("email")}
                  className={`smooth-hover ${
                    errors.email
                      ? "border-destructive focus:ring-destructive"
                      : ""
                  }`}
                  placeholder="you@example.com"
                />
                {errors.email && (
                  <p
                    className="text-xs text-destructive mt-1 animate-slide-in-bottom"
                    data-testid="email-error"
                  >
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div
                className="space-y-2 animate-slide-in-right"
                style={{ animationDelay: "200ms" }}
              >
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-foreground"
                >
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    data-testid="password-input"
                    {...register("password")}
                    className={`smooth-hover pr-10 ${
                      errors.password
                        ? "border-destructive focus:ring-destructive"
                        : ""
                    }`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p
                    className="text-xs text-destructive mt-1 animate-slide-in-bottom"
                    data-testid="password-error"
                  >
                    {errors.password.message}
                  </p>
                )}

                {/* Password strength indicator */}
                {password && (
                  <div className="mt-3 space-y-2 animate-fade-in-scale">
                    <div className="text-xs text-muted-foreground font-medium flex items-center space-x-2">
                      <Shield className="w-3 h-3" />
                      <span>Password Requirements</span>
                    </div>
                    <div className="space-y-1">
                      {passwordRequirements.map((req, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-2 text-xs"
                        >
                          <div
                            className={`w-3 h-3 rounded-full flex items-center justify-center ${
                              req.test(password)
                                ? "bg-green-500/20 border border-green-500/30"
                                : "bg-slate-600/20 border border-slate-600/30"
                            }`}
                          >
                            {req.test(password) && (
                              <Check className="w-2 h-2 text-green-400" />
                            )}
                          </div>
                          <span
                            className={
                              req.test(password)
                                ? "text-green-400"
                                : "text-slate-500"
                            }
                          >
                            {req.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div
                className="space-y-2 animate-slide-in-left"
                style={{ animationDelay: "300ms" }}
              >
                <Label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium text-foreground"
                >
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    data-testid="confirm-password-input"
                    {...register("confirmPassword")}
                    className={`smooth-hover pr-10 ${
                      errors.confirmPassword
                        ? "border-destructive focus:ring-destructive"
                        : ""
                    }`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p
                    className="text-xs text-destructive mt-1 animate-slide-in-bottom"
                    data-testid="confirm-password-error"
                  >
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <div
                className="pt-2 animate-fade-in-scale"
                style={{ animationDelay: "400ms" }}
              >
                <Button
                  type="submit"
                  disabled={loading}
                  data-testid="register-button"
                  className="w-full group"
                  variant="default"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                      Create Account
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </div>
            </form>

            <div
              className="relative animate-slide-in-bottom"
              style={{ animationDelay: "500ms" }}
            >
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-600" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-800 px-2 text-muted-foreground">
                  Already have an account?
                </span>
              </div>
            </div>

            <div
              className="animate-slide-in-bottom"
              style={{ animationDelay: "600ms" }}
            >
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full group smooth-hover"
              >
                <a
                  href="/login"
                  data-testid="login-link"
                  className="flex items-center justify-center"
                >
                  <LogIn className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />
                  Sign In Instead
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Additional security info */}
        <div
          className="mt-8 text-center animate-slide-in-bottom"
          style={{ animationDelay: "700ms" }}
        >
          <p className="text-sm text-muted-foreground">
            Your data is encrypted and stored securely
          </p>
        </div>
      </div>
    </div>
  );
}
