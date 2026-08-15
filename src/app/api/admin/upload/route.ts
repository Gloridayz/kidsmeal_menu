import { NextRequest, NextResponse } from "next/server";
import { extractMenuFromFile } from "@/lib/gemini";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB (Vercel 서버리스 함수 요청 본문 제한 참고)

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

export async function POST(request: NextRequest) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const file = formData.get("file");
  const yearRaw = formData.get("year");
  const monthRaw = formData.get("month");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "파일을 첨부해주세요." }, { status: 400 });
  }
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    return NextResponse.json({ error: "연도가 올바르지 않습니다." }, { status: 400 });
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: "월이 올바르지 않습니다." }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({ error: "파일 크기가 너무 큽니다 (최대 15MB)." }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const fileBuffer = Buffer.from(arrayBuffer);
  const mimeType = file.type || "application/octet-stream";

  let extracted;
  try {
    extracted = await extractMenuFromFile({ fileBuffer, mimeType, year, month });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "식단 인식에 실패했습니다.";
    return NextResponse.json({ error: msg }, { status: 422 });
  }

  const rows = extracted.map((item) => ({
    date: `${year}-${pad2(month)}-${pad2(item.day)}`,
    lunch: item.lunch,
    morning_snack: item.morning_snack,
    afternoon_snack: item.afternoon_snack,
  }));

  const supabaseAdmin = createSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from("menus")
    .upsert(rows, { onConflict: "date" })
    .select("date");

  if (error) {
    return NextResponse.json({ error: `저장 중 오류가 발생했습니다: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    savedCount: data?.length ?? rows.length,
    dates: rows.map((r) => r.date).sort(),
  });
}
