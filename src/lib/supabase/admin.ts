import "server-only";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// 서버 전용 클라이언트. service role 키로 RLS를 우회해 쓰기 작업을 수행합니다.
// 절대 클라이언트(브라우저) 번들에 노출되면 안 됩니다.
export function createSupabaseAdminClient() {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
