import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { ExtractedDayMenu } from "@/lib/types";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

const SUPPORTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function buildPrompt(year: number, month: number) {
  return `첨부된 파일은 어린이집(유치원)의 ${year}년 ${month}월 월간 식단표입니다.
이 표를 분석해서 날짜별로 점심(lunch), 오전간식(morning_snack), 오후간식(afternoon_snack) 메뉴를 추출해줘.

규칙:
- 표에 있는 각 날짜(일자)에 대해 하나의 객체를 만들어줘. "day" 필드에는 ${month}월의 일(day) 숫자만 넣어 (연/월 계산은 하지 마).
- 휴무일, 주말, 공휴일 등 식단이 없는 날은 결과에서 제외해줘.
- 메뉴 항목이 여러 개면 쉼표(, )로 구분한 하나의 문자열로 합쳐줘.
- 특정 항목(예: 오전간식)이 표에 없으면 해당 필드는 null로 해줘.
- 표에 없는 날짜를 추측해서 만들어내지 마.
- 오직 아래 JSON 스키마의 배열만 출력해. 설명, 마크다운 코드블록, 다른 텍스트를 절대 포함하지 마.

[
  { "day": 1, "lunch": "...", "morning_snack": "...", "afternoon_snack": "..." },
  ...
]`;
}

function extractJsonArray(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fenced ? fenced[1] : trimmed;
  const start = candidate.indexOf("[");
  const end = candidate.lastIndexOf("]");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("Claude 응답에서 JSON 배열을 찾을 수 없습니다.");
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

function validateDayMenus(data: unknown, daysInMonth: number): ExtractedDayMenu[] {
  if (!Array.isArray(data)) {
    throw new Error("Claude 응답 형식이 올바르지 않습니다 (배열이 아님).");
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

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY 환경변수가 설정되어 있지 않습니다.");
  }
  const client = new Anthropic({ apiKey });

  const base64Data = fileBuffer.toString("base64");
  const isPdf = mimeType === "application/pdf";
  const isSupportedImage = SUPPORTED_IMAGE_TYPES.has(mimeType);

  if (!isPdf && !isSupportedImage) {
    throw new Error(`지원하지 않는 파일 형식입니다: ${mimeType}`);
  }

  const daysInMonth = new Date(year, month, 0).getDate();

  const fileBlock = isPdf
    ? ({
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: base64Data },
      } as const)
    : ({
        type: "image",
        source: {
          type: "base64",
          media_type: mimeType as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
          data: base64Data,
        },
      } as const);

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: [fileBlock, { type: "text", text: buildPrompt(year, month) }],
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude 응답에서 텍스트를 찾을 수 없습니다.");
  }

  const parsed = extractJsonArray(textBlock.text);
  return validateDayMenus(parsed, daysInMonth);
}
