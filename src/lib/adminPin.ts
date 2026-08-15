import "server-only";
import { timingSafeEqual } from "crypto";

// Node.js 런타임(관리자 로그인 API)에서만 사용합니다. Edge 미들웨어에서는 import하지 마세요.
export function verifyAdminPin(pin: string): boolean {
  const expected = process.env.ADMIN_PIN;
  if (!expected) {
    throw new Error("ADMIN_PIN 환경변수가 설정되어 있지 않습니다.");
  }
  const a = Buffer.from(pin);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
