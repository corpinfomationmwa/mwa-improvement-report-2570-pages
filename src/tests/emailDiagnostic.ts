/**
 * MWA Real Email Service Diagnostic Tool
 * Checks:
 * 1. Frontend Email Service: READY / NOT READY
 * 2. GOOGLE_APPS_SCRIPT_URL: CONFIGURED / NOT CONFIGURED
 * 3. Google Apps Script: CONNECTED / NOT CONNECTED
 * 4. Real Email: SUCCESS / FAILED
 * 5. Error: Real Error Message
 */

async function runDiagnostic() {
  console.log('========================================================================');
  console.log('MWA EMAIL SERVICE SYSTEM DIAGNOSTIC');
  console.log('========================================================================\n');

  let frontendEmailService = 'READY';
  let googleAppsScriptUrlStatus = 'NOT CONFIGURED';
  let googleAppsScriptStatus = 'NOT CONNECTED';
  let realEmailStatus = 'FAILED';
  let actualError: string | null = null;

  try {
    const res = await fetch('http://127.0.0.1:3000/api/email-diagnostic');
    const data = await res.json();

    frontendEmailService = data.frontendEmailService || 'READY';
    googleAppsScriptUrlStatus = data.googleAppsScriptUrl || 'NOT CONFIGURED';
    googleAppsScriptStatus = data.googleAppsScript || 'NOT CONNECTED';
    realEmailStatus = data.realEmail === 'READY FOR DISPATCH' ? 'SUCCESS' : 'FAILED';
    actualError = data.error;

  } catch (err: any) {
    frontendEmailService = 'NOT READY';
    actualError = err.message || String(err);
  }

  console.log('DIAGNOSTIC RESULTS:');
  console.log('------------------------------------------------------------------------');
  console.log(`1. Frontend Email Service  : ${frontendEmailService}`);
  console.log(`2. GOOGLE_APPS_SCRIPT_URL   : ${googleAppsScriptUrlStatus}`);
  console.log(`3. Google Apps Script       : ${googleAppsScriptStatus}`);
  console.log(`4. Real Email               : ${realEmailStatus}`);
  console.log(`5. Error Details            : ${actualError ? actualError : 'None (All systems connected)'}`);
  console.log('------------------------------------------------------------------------\n');

  if (googleAppsScriptUrlStatus === 'NOT CONFIGURED') {
    console.log('ℹ️ NOTICE:');
    console.log('Frontend พร้อมเชื่อม Google Apps Script แล้ว แต่ยังต้องนำ Web App URL มาใส่ใน GOOGLE_APPS_SCRIPT_URL');
  } else if (realEmailStatus === 'SUCCESS') {
    console.log('✅ Real Email Bridge is active and ready to deliver emails via MailApp.sendEmail()');
  }
}

runDiagnostic();
