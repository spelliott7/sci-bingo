import { SignJWT, jwtVerify } from "jose";

// Edge-safe (no bcrypt here) so this module can be imported from proxy.ts.

export const SESSION_COOKIE = "sci_session";
export const GATE_COOKIE = "sci_gate";

export type SessionPayload = {
  sub: string; // userId
  username: string;
  role: "PLAYER" | "ADMIN";
};

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "SESSION_SECRET is missing or too short. Set a long random string in your .env file.",
    );
  }
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecretKey());
}

export async function verifySessionToken(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (
      typeof payload.sub === "string" &&
      typeof payload.username === "string" &&
      (payload.role === "PLAYER" || payload.role === "ADMIN")
    ) {
      return { sub: payload.sub, username: payload.username, role: payload.role };
    }
    return null;
  } catch {
    return null;
  }
}

export async function signGateToken(): Promise<string> {
  return new SignJWT({ gate: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("180d")
    .sign(getSecretKey());
}

export async function verifyGateToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload.gate === true;
  } catch {
    return false;
  }
}
