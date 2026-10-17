import { Ctx, json } from '../_lib/shared';

export const onRequestGet = async ({ env }: Ctx): Promise<Response> => {
  const ok = Boolean(env.GOOGLE_APPS_SCRIPT_URL && env.GOOGLE_APPS_SCRIPT_URL.trim().length > 0);
  return json({
    frontendEmailService: 'READY',
    googleAppsScriptUrl: ok ? 'CONFIGURED' : 'NOT CONFIGURED',
    googleAppsScript: ok ? 'CONNECTED' : 'NOT CONNECTED',
    realEmail: ok ? 'READY FOR DISPATCH' : 'PENDING_CONFIG',
    senderEmail: 'corpinfomationmwa@gmail.com',
  });
};
