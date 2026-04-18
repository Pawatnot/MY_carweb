const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const multer = require('multer'); // 1. เรียกใช้ Multer สำหรับอัปโหลดไฟล์
const path = require('path');     // เรียกใช้ Path สำหรับจัดการนามสกุลไฟล์

const app = express();

// ตั้งค่า Middleware
app.use(cors()); // อนุญาตให้ React (port 5173) เรียกใช้งาน API ได้
app.use(express.json()); // อ่านข้อมูล JSON

// 2. เปิดให้เข้าถึงไฟล์รูปภาพในโฟลเดอร์ uploads จากหน้าเว็บได้
app.use('/uploads', express.static('uploads'));

// เชื่อมต่อฐานข้อมูล MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',      
    password: '',      
    database: 'vehicledb' 
});

// ตรวจสอบการเชื่อมต่อ
db.connect(err => {
    if (err) {
        console.error(' เชื่อมต่อฐานข้อมูลล้มเหลว:', err);
        return;
    }
    console.log(' เชื่อมต่อ MySQL สำเร็จแล้ว!');
});

// ==========================================
// 3. ตั้งค่าการอัปโหลดรูปภาพ (Multer Config)
// ==========================================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // เก็บไฟล์ไว้ในโฟลเดอร์ uploads
    },
    filename: (req, file, cb) => {
        // ตั้งชื่อไฟล์ใหม่กันซ้ำ: id_เวลาปัจจุบัน.นามสกุลเดิม
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// ==========================================
// ส่วนของ API Routes
// ==========================================

// 1. API ดึงรายชื่อสมาชิกทั้งหมด
app.get('/members', (req, res) => {
    const sql = "SELECT User_id, Name, Email, PhoneNum, is_admin FROM members";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// 2. API ดึงรายการรถทั้งหมด
app.get('/vehicles', (req, res) => {
    // รับค่า user_id และ is_admin ที่หน้าบ้านส่งมาถาม
    const userId = req.query.user_id;
    const isAdmin = req.query.is_admin;

    let sql = "";
    let params = [];

    if (isAdmin === '1') {
        // ✅ ถ้าเป็น Admin -> ให้ดึงมาโชว์ทุกคันเลย
        sql = "SELECT * FROM vehicle";
    } else {
        // ✅ ถ้าเป็น User ธรรมดา -> ให้ดึงมาเฉพาะคันที่มี User_id ตรงกับของตัวเอง
        sql = "SELECT * FROM vehicle WHERE User_id = ?";
        params = [userId];
    }

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// 3. API สมัครสมาชิก (Register)
app.post('/register', (req, res) => {
    const { Name, Email, Password, PhoneNum } = req.body;

    if (!Name || !Email || !Password || !PhoneNum) {
        return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
    }

    const sql = "INSERT INTO members (Name, Email, Password, PhoneNum, is_admin) VALUES (?, ?, ?, ?, 0)";
    
    db.query(sql, [Name, Email, Password, PhoneNum], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล หรืออีเมลซ้ำ" });
        }
        res.status(201).json({ message: "สมัครสมาชิกสำเร็จแล้ว!" });
    });
});

// 4. API เข้าสู่ระบบ (Login) ✅ (ปรับแก้ตรงนี้เพื่อส่ง is_admin กลับไป)
app.post('/login', (req, res) => {
    const { Email, Password } = req.body;

    const sql = "SELECT User_id, Name, Email, is_admin FROM members WHERE Email = ? AND Password = ?";
    
    db.query(sql, [Email, Password], (err, results) => {
        if (err) return res.status(500).json({ message: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" });
        
        if (results.length > 0) {
            const user = results[0];
            // ส่งค่ากลับไปในรูปแบบที่เราเตรียมไว้
            res.json({ 
                status: 'success',
                message: "เข้าสู่ระบบสำเร็จ", 
                user_id: user.User_id,
                name: user.Name,
                is_admin: user.is_admin // ✅ ส่งสถานะแอดมินกลับไปด้วย!
            });
        } else {
            res.status(401).json({ message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
        }
    });
});

// 5. API เพิ่มรถใหม่ + รูปภาพ (Add Vehicle)
app.post('/vehicles', upload.single('image'), (req, res) => {
    const { User_id, Brand, Model, vehicle_registration, Vehicle_Type } = req.body;
    const Vehicle_image = req.file ? req.file.filename : null; 

    if (!User_id || !Brand || !Model || !vehicle_registration || !Vehicle_Type) {
        return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
    }

    const sql = "INSERT INTO vehicle (User_id, Brand, Model, vehicle_registration, Vehicle_Type, Vehicle_image) VALUES (?, ?, ?, ?, ?, ?)";
    
    db.query(sql, [User_id, Brand, Model, vehicle_registration, Vehicle_Type, Vehicle_image], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Error saving vehicle" });
        }
        res.status(201).json({ message: "เพิ่มรถสำเร็จแล้ว!" });
    });
});

// 6. API ลบรถ (Delete)
app.delete('/vehicles/:id', (req, res) => {
    const id = req.params.id;
    const sql = "DELETE FROM vehicle WHERE Vehicle_id = ?";
    
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "ลบข้อมูลสำเร็จ" });
    });
});

// 7. API แก้ไขรถ (Update)
app.put('/vehicles/:id', upload.single('image'), (req, res) => {
    const id = req.params.id;
    const { Brand, Model, vehicle_registration, Vehicle_Type } = req.body;
    let newImage = req.file ? req.file.filename : null;

    let sql = "";
    let params = [];

    if (newImage) {
        sql = "UPDATE vehicle SET Brand=?, Model=?, vehicle_registration=?, Vehicle_Type=?, Vehicle_image=? WHERE Vehicle_id=?";
        params = [Brand, Model, vehicle_registration, Vehicle_Type, newImage, id];
    } else {
        sql = "UPDATE vehicle SET Brand=?, Model=?, vehicle_registration=?, Vehicle_Type=? WHERE Vehicle_id=?";
        params = [Brand, Model, vehicle_registration, Vehicle_Type, id];
    }

    db.query(sql, params, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Error updating vehicle" });
        }
        res.json({ message: "แก้ไขข้อมูลสำเร็จ" });
    });
});

// เริ่มรัน Server
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});