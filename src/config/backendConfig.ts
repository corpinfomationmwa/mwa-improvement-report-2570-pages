/**
 * Centralized Backend Configuration for Google Apps Script Web App
 * Real Email Sender: Google Account executing the Apps Script (corpinfomationmwa@gmail.com)
 */

export const GOOGLE_APPS_SCRIPT_URL =
  (typeof process !== 'undefined' && process.env?.GOOGLE_APPS_SCRIPT_URL) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GOOGLE_APPS_SCRIPT_URL) ||
  '';

export const BACKEND_CONFIG = {
  appsScriptUrl: GOOGLE_APPS_SCRIPT_URL
};
