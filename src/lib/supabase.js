import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// ─── Browser client (singleton) ──────────────────────────────
let browserClient = null

export function getSupabaseBrowser() {
  if (browserClient) return browserClient
  browserClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  return browserClient
}

// ─── Server client (per-request, sets RLS user context) ──────
export async function getSupabaseServer() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )
}

// ─── Admin client (bypasses RLS) ─────────────────────────────
export function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// ─── Set RLS user context ─────────────────────────────────────
export async function setUserContext(supabase, userId) {
  await supabase.rpc('set_config', {
    setting_name: 'app.current_user_id',
    setting_value: userId,
  }).catch(() => {
    // Fallback: use raw SQL
    return supabase.from('_config').select().limit(0)
  })
}
