# MWA Improvement Report 2570 — Cloudflare Pages Frontend

ชุดนี้เตรียมจาก ZIP ที่ผู้ใช้ส่งมา โดยแยกเฉพาะหน้าเว็บ React/Vite สำหรับ Cloudflare Pages
**ยังไม่ได้ Deploy และยังไม่ได้เชื่อม URL backend จริง** เพื่อป้องกันการส่งข้อมูลไปผิดระบบ

## ตั้งค่า GitHub repository ใหม่
1. สร้าง repository ใหม่ชื่อ `mwa-improvement-report-2570-pages`
2. ตั้งเป็น Private (แนะนำ เพราะเป็นระบบภายใน)
3. แตก ZIP นี้ แล้วอัปโหลดไฟล์และโฟลเดอร์ทั้งหมดที่อยู่ในราก ZIP เข้า root ของ repository
4. ห้ามอัปโหลด `.env` ที่มี secret หรือ key จริง

## Cloudflare Pages build settings
- Framework preset: `Vite`
- Production branch: `main`
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: เว้นว่าง

## Environment variable ที่ต้องกำหนดก่อนใช้งาน
ตั้งค่า `VITE_API_BASE_URL` ใน Cloudflare Pages เป็น **origin ของ backend เดิมที่มี API `/api/reports` และ `/api/evidence/upload`**
เช่น `https://<existing-backend-host>` โดยไม่ใส่ slash ท้าย URL

อย่าใช้ URL ของหน้าเว็บ `*.pages.dev` เป็นค่า backend และอย่าเดา URL เอง
ต้องยืนยัน URL backend เดิมก่อน deploy/test จริง

## ข้อจำกัดสำคัญ
- Cloudflare Pages ให้บริการ frontend แบบ static เท่านั้น ไม่รัน `server.ts` ของ Express
- Backend, Supabase, Google Apps Script, Google Drive, Google Sheets และอีเมลยังคงต้องทำงานบนระบบเดิม
- Backend เดิมต้องอนุญาต CORS จากโดเมน `*.pages.dev` ใหม่ ไม่เช่นนั้น browser จะบล็อก API request
- ยังไม่ควรปิดหรือลบ Cloud Run เดิม
- ต้องทดสอบโหลดข้อมูล, ส่งรายงาน, อัปโหลดไฟล์, PDF และอีเมล ก่อนเปลี่ยน URL ให้ผู้ใช้จริง

## สิ่งที่เปลี่ยนในชุดเตรียมนี้
- เพิ่ม `_redirects` สำหรับ SPA routing
- เพิ่ม `VITE_API_BASE_URL` ให้ API calls ใน `src/services/mwaService.ts` เรียก backend เดิมข้าม origin ได้
- ไม่รวม `server.ts`, Google Apps Script files, credentials หรือฐานข้อมูลใน repo frontend นี้
