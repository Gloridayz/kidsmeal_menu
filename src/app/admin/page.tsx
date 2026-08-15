import Link from "next/link";
import AdminUploadForm from "./AdminUploadForm";
import LogoutButton from "./LogoutButton";

export default function AdminPage() {
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            식단표 업로드
          </h1>
          <Link href="/" className="text-sm text-zinc-500 hover:underline dark:text-zinc-400">
            ← 식단표 보기로 이동
          </Link>
        </div>
        <LogoutButton />
      </div>

      <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-900">
        <AdminUploadForm />
      </div>
    </div>
  );
}
