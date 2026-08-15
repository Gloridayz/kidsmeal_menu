import { SignJWT, jwtVerify } from "jose";

export const ADMIN_COOKIE_NAME = "admin_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 12; // 12시간

function getSecretKey() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET 환경변수가 설정되어 있지 않습니다.");
  }
  return new TextEncoder().encode(secret);
}

export async function createAdminSessionToken(): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifyAdminSessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export const ADMIN_SESSION_MAX_AGE = SESSION_DURATION_SECONDS;
