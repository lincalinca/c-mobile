import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

const FUNCTIONS_URL = SUPABASE_URL
  ? `${SUPABASE_URL.replace(/\/+$/, '')}/functions/v1`
  : '';

// Debug: Log config on module load
console.log('[supabase] Config loaded:', {
  hasUrl: !!SUPABASE_URL,
  hasKey: !!SUPABASE_ANON_KEY,
  functionsUrl: FUNCTIONS_URL || '(not configured)',
});

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    '[supabase] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. Edge function calls will fail.'
  );
}

export const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
      },
    })
  : null;

export async function callSupabaseFunction<TResponse = any>(
  name: string,
  body: unknown
): Promise<TResponse> {
  if (!FUNCTIONS_URL) {
    throw new Error('Supabase URL is not configured.');
  }

  const url = `${FUNCTIONS_URL}/${name}`;
  console.log('[supabase] Calling function:', url);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(
      `Supabase function ${name} failed with ${res.status}: ${text || res.statusText}`
    );
  }

  return (await res.json()) as TResponse;
}
