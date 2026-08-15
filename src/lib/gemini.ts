import "server-only";
import { GoogleGenAI, Type } from "@google/genai";
import type { ExtractedDayMenu } from "@/lib/types";

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const SUPPORTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);

function buildPrompt(year: number, month: number) {
  return `첨부된 파일은 어린이집(유치원)의 ${year}년 ${month}월 월간 식단표입니다.
이 표를 분석해서 날짜별로 점심(lunch), 오전간식(morning_snack), 오후간식(afternoon_snack) 메뉴를 추출해줘.

규칙:
- 표에 있는 각 날짜(일자)에 대해 하나의 객체를 만들어줘. "day" 필드에는 ${month}월의 일(day) 숫자만 넣어 (연/월 계산은 하지 마).
- 휴무일, 주말, 공휴일 등 식단이 없는 날은 결과에서 제외해줘.
- 메뉴 항목이 여러 개면 쉼표(, )로 구분한 하나의 문자열로 합쳐줘.
- 특정 항목(예: 오전간식)이 표에 없으면 해당 필드는 null로 해줘.
- 표에 없는 날짜를 추측해서 만들어내지 마.`;
}

const RESPONSE_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      day: { type: Type.INTEGER },
      lunch: { type: Type.STRING, nullable: true },
      morning_snack: { type: Type.STRING, nullable: true },
      afternoon_snack: { type: Type.STRING, nullable: true },
    },
    required: ["day", "lunch", "morning_snack", "afternoon_snack"],
  },
};

function validateDayMenus(data: unknown, daysInMonth: number): ExtractedDayMenu[] {
  if (!Array.isArray(data)) {
    throw new Error("Gemini 응답 형식이 올바르지 않습니다 (배열이 아님).");
  }
  const result: ExtractedDayMenu[] = [];
  for (const item of data) {
    if (typeof item !== "object" || item === null) continue;
    const day = (item as Record<string, unknown>).day;
    if (typeof day !== "number" || !Number.isInteger(day) || day < 1 || day > daysInMonth) {
      continue;
    }
    const toNullableString = (v: unknown): string | null =>
      typeof v === "string" && v.trim().length > 0 ? v.trim() : null;
    result.push({
      day,
      lunch: toNullableString((item as Record<string, unknown>).lunch),
      morning_snack: toNullableString((item as Record<string, unknown>).morning_snack),
      afternoon_snack: toNullableString((item as Record<string, unknown>).afternoon_snack),
    });
  }
  if (result.length === 0) {
    throw new Error("추출된 식단 데이터가 없습니다. 이미지를 확인해주세요.");
  }
  return result;
}

export async function extractMenuFromFile(params: {
  fileBuffer: Buffer;
  mimeType: string;
  year: number;
  month: number;
}): Promise<ExtractedDayMenu[]> {
  const { fileBuffer, mimeType, year, month } = params;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY 환경변수가 설정되어 있지 않습니다.");
  }
  const client = new GoogleGenAI({ apiKey });

  const base64Data = fileBuffer.toString("base64");
  const isPdf = mimeType === "application/pdf";
  const isSupportedImage = SUPPORTED_IMAGE_TYPES.has(mimeType);

  if (!isPdf && !isSupportedImage) {
    throw new Error(`지원하지 않는 파일 형식입니다: ${mimeType}`);
  }

  const daysInMonth = new Date(year, month, 0).getDate();

  const response = await client.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: buildPrompt(year, month) },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Gemini 응답에서 텍스트를 찾을 수 없습니다.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Gemini 응답을 JSON으로 파싱하지 못했습니다.");
  }

  return validateDayMenus(parsed, daysInMonth);
}
