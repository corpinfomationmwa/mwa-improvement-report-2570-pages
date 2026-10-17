import { Ctx, json, getSupabase } from '../_lib/shared';

export const onRequestGet = async ({ env }: Ctx): Promise<Response> => {
  const supabase = getSupabase(env);
  if (!supabase) return json({ ok: false, supabase: false, error: 'Missing SUPABASE_SECRET_KEY or VITE_SUPABASE_URL' }, 500);
  const { error } = await supabase.from('reports').select('id').limit(1);
  if (error) return json({ ok: false, supabase: false, error: error.message }, 500);
  return json({ ok: true, supabase: true });
};
