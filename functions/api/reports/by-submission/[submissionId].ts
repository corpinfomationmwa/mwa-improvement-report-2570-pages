import { Ctx, json, getSupabase, DB_NOT_READY, loadSingleReportResponse } from '../../../_lib/shared';

export const onRequestGet = async ({ env, params }: Ctx): Promise<Response> => {
  const submissionId = params.submissionId;
  if (!submissionId) return json({ success: false, message: 'Missing submissionId' }, 400);
  const supabase = getSupabase(env);
  if (!supabase) return json(DB_NOT_READY, 500);
  return loadSingleReportResponse(supabase, 'submission_id', String(submissionId));
};
