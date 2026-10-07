# Server Desk

แอปนี้ใช้ Node.js, Express และ PostgreSQL ข้อมูลผู้ใช้จะถูกอ่านและบันทึกผ่าน API ฝั่งเซิร์ฟเวอร์

## รันในเครื่อง

ต้องติดตั้ง Node.js 20 ขึ้นไป และมี PostgreSQL พร้อม connection URL ใน `DATABASE_URL`

```powershell
npm install
$env:DATABASE_URL = "postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
npm start
```

เปิด `http://localhost:3000` ในเบราว์เซอร์ ตาราง `users` และข้อมูลตัวอย่างจะถูกสร้างให้อัตโนมัติเมื่อฐานข้อมูลยังว่าง

## Deploy บน Railway

1. Push โฟลเดอร์โปรเจกต์นี้ขึ้น GitHub โดยไม่ใส่ไฟล์ `.env` หรือรหัสผ่านฐานข้อมูล
2. ใน Railway สร้างโปรเจกต์จาก GitHub repository นี้
3. เพิ่ม PostgreSQL service ในโปรเจกต์เดียวกัน
4. ที่ Variables ของ service แอป เพิ่ม `DATABASE_URL` แล้วอ้างอิงตัวแปร `DATABASE_URL` จาก PostgreSQL service
5. Deploy แอป แล้วเปิด Settings/Networking เพื่อ Generate Domain

Railway จะใช้คำสั่ง `npm start` และกำหนด `PORT` ให้โดยอัตโนมัติ ส่วน connection URL ควรเก็บเป็น Railway variable เท่านั้น

## ข้อมูลและความเป็นส่วนตัว

ข้อมูลที่เคยบันทึกใน `localStorage` ของเบราว์เซอร์จะไม่ถูกย้ายเข้า PostgreSQL โดยอัตโนมัติ ข้อมูลตัวอย่างจะถูกสร้างเฉพาะเมื่อฐานข้อมูลว่าง

ตอนนี้ API เปิดให้อ่านรายการและเพิ่มข้อมูลได้โดยไม่ต้องเข้าสู่ระบบ หากเผยแพร่สาธารณะ ทุกคนที่เข้าถึง URL จะเห็นข้อมูลทั้งหมดและส่งรายการใหม่ได้ อย่าใส่ข้อมูลส่วนบุคคลจริงจนกว่าจะเพิ่มระบบยืนยันตัวตนและกำหนดสิทธิ์การเข้าถึง