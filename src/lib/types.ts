export interface Menu {
  id: string;
  date: string; // YYYY-MM-DD
  lunch: string | null;
  morning_snack: string | null;
  afternoon_snack: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExtractedDayMenu {
  day: number;
  lunch: string | null;
  morning_snack: string | null;
  afternoon_snack: string | null;
}
