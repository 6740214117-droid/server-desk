# Server Desk

แอปนี้ใช้ Node.js, Express และ MySQL โดย Apache กับ Nginx มีหน้าและตารางข้อมูลแยกกัน

## รันในเครื่อง

ต้องติดตั้ง Node.js 20 ขึ้นไป และมี MySQL โดยตั้ง `MYSQL_URL` หรือชุดตัวแปร `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`

```powershell
npm install
$env:MYSQL_URL = "mysql://USER:PASSWORD@HOST:PORT/DATABASE"
npm start
```

เปิด `http://localhost:3000/apache` สำหรับ Apache หรือ `http://localhost:3000/nginx` สำหรับ Nginx ตาราง `apache_users` และ `nginx_users` พร้อมข้อมูลตัวอย่างจะถูกสร้างให้อัตโนมัติเมื่อแต่ละตารางยังว่าง

## Deploy บน Railway

1. Push โฟลเดอร์โปรเจกต์นี้ขึ้น GitHub โดยไม่ใส่ไฟล์ `.env` หรือรหัสผ่านฐานข้อมูล
2. ใน Railway สร้างโปรเจกต์จาก GitHub repository นี้
3. เพิ่ม MySQL service ในโปรเจกต์เดียวกัน
4. ที่ Variables ของ service แอป เพิ่ม `MYSQL_URL` แล้วอ้างอิง connection URL จาก MySQL service (มักใช้ `${{MySQL.MYSQL_URL}}` โดย `MySQL` ต้องตรงกับชื่อ service)
5. Deploy แอป แล้วเปิด Settings/Networking เพื่อ Generate Domain

Railway จะใช้คำสั่ง `npm start` และกำหนด `PORT` ให้โดยอัตโนมัติ ส่วน connection URL ควรเก็บเป็น Railway variable เท่านั้น หลังเปลี่ยนฐานข้อมูล ให้นำ `DATABASE_URL` ที่อ้างถึง PostgreSQL ออกจาก service แอป

## ข้อมูลและความเป็นส่วนตัว

ข้อมูลใน PostgreSQL เดิมจะไม่ถูกย้ายเข้า MySQL โดยอัตโนมัติ และจะไม่ถูกลบจาก PostgreSQL ข้อมูลตัวอย่างจะถูกสร้างใน MySQL เฉพาะเมื่อตารางใหม่ยังว่าง

ตอนนี้ API เปิดให้อ่านรายการและเพิ่มข้อมูลได้โดยไม่ต้องเข้าสู่ระบบ หากเผยแพร่สาธารณะ ทุกคนที่เข้าถึง URL จะเห็นข้อมูลทั้งหมดและส่งรายการใหม่ได้ อย่าใส่ข้อมูลส่วนบุคคลจริงจนกว่าจะเพิ่มระบบยืนยันตัวตนและกำหนดสิทธิ์การเข้าถึง