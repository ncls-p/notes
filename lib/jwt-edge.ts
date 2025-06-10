// JWT verification utility for Edge Runtime using Web Crypto API
interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export async function verifyJWT(
  token: string,
  secret: string,
): Promise<JWTPayload> {
  try {
    // Convert the secret to a Uint8Array
    const secretKey = new TextEncoder().encode(secret);

    // Create a crypto key for HMAC
    const key = await crypto.subtle.importKey(
      "raw",
      secretKey,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );

    // Parse the JWT manually since jose expects different format
    const [_header, payloadB64, signatureB64] = token.split(".");
    if (payloadB64 === undefined || signatureB64 === undefined) {
      throw new Error("Invalid JWT format");
    }

    const payload = JSON.parse(
      atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/")),
    );

    // Verify signature
    const data = new TextEncoder().encode(`${_header}.${payloadB64}`);
    const signature = Uint8Array.from(
      atob(signatureB64.replace(/-/g, "+").replace(/_/g, "/")),
      (c) => c.charCodeAt(0),
    );

    const isValid = await crypto.subtle.verify("HMAC", key, signature, data);

    if (!isValid) {
      throw new Error("Invalid JWT signature");
    }

    // Check expiration
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      throw new Error("JWT expired");
    }

    return payload as JWTPayload;
  } catch (error) {
    throw new Error(
      `JWT verification failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }
}
