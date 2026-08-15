"use client";

import { useRef, useState, FormEvent } from "react";

type UploadResult = {
  ok: true;
  savedCount: number;
  dates: string[];
};

const MONTH_NAMES = Array.from({ length: 12 }, (_, i) => i + 1);

export default function AdminUploadForm() {
  const now = new Date();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("식단표 파일(이미지 또는 PDF)을 선택해주세요.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("year", String(year));
      formData.append("month", String(month));

      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "업로드에 실패했습니다.");
        return;
      }
      setResult(data);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">연도</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="mt-1.5 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">월</label>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="mt-1.5 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          >
            {MONTH_NAMES.map((m) => (
              <option key={m} value={m}>
                {m}월
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          식단표 파일 (이미지 또는 PDF)
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="mt-1.5 block w-full text-sm text-zinc-700 file:mr-4 file:rounded-lg file:border-0 file:bg-zinc-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-zinc-700 dark:text-zinc-300 dark:file:bg-zinc-50 dark:file:text-zinc-900"
        />
        <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          업로드 즉시 Claude가 날짜별 메뉴를 인식해 저장합니다. 확인 절차 없이 바로 반영되니
          파일을 다시 한번 확인해주세요. (최대 15MB)
        </p>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {result && (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          <p className="font-medium">{result.savedCount}일의 식단이 저장되었습니다.</p>
          <p className="mt-1 text-xs opacity-80">{result.dates.join(", ")}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {loading ? "인식 및 저장 중..." : "업로드하고 자동 저장"}
      </button>
    </form>
  );
}
