import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, ADMIN_SESSION_MAX_AGE, createAdminSessionToken } from "@/lib/auth";
import { verifyAdminPin } from "@/lib/adminPin";

export async function POST(request: NextRequest) {
  let pin: string | undefined;
  try {
    const body = await request.json();
    pin = body?.pin;
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  if (!pin || typeof pin !== "string") {
    return NextResponse.json({ error: "PIN을 입력해주세요." }, { status: 400 });
  }

  let ok = false;
  try {
    ok = verifyAdminPin(pin);
  } catch {
    return NextResponse.json({ error: "서버 설정 오류입니다. 관리자에게 문의하세요." }, { status: 500 });
  }

  if (!ok) {
    return NextResponse.json({ error: "PIN이 올바르지 않습니다." }, { status: 401 });
  }

  const token = await createAdminSessionToken();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE,
  });
  return response;
}
