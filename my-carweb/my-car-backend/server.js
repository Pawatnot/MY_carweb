const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const multer = require('multer'); 
const path = require('path');     

const app = express();

app.use(cors()); 
app.use(express.json()); 
app.use('/uploads', express.static('uploads'));

// เชื่อมต่อฐานข้อมูล MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',      
    password: '',      
    database: 'vehicledb' 
});

db.connect(err => {
    if (err) {
        console.error(' เชื่อมต่อฐานข้อมูลล้มเหลว:', err);
        return;
    }
    console.log(' เชื่อมต่อ MySQL สำเร็จแล้ว!');
});

// ตั้งค่า Multer (อัปโหลดรูปภาพ)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); 
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// ==========================================
// API หมวด: สมาชิก (Members & Auth)
// ==========================================
app.get('/members', (req, res) => {
    const sql = "SELECT User_id, Name, Email, PhoneNum, is_admin FROM members";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.post('/register', (req, res) => {
    const { Name, Email, Password, PhoneNum } = req.body;
    if (!Name || !Email || !Password || !PhoneNum) return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบ" });

    const sql = "INSERT INTO members (Name, Email, Password, PhoneNum, is_admin) VALUES (?, ?, ?, ?, 0)";
    db.query(sql, [Name, Email, Password, PhoneNum], (err, result) => {
        if (err) return res.status(500).json({ message: "เกิดข้อผิดพลาด หรืออีเมลซ้ำ" });
        res.status(201).json({ message: "สมัครสมาชิกสำเร็จ!" });
    });
});

app.post('/login', (req, res) => {
    const { Email, Password } = req.body;
    const sql = "SELECT User_id, Name, Email, is_admin FROM members WHERE Email = ? AND Password = ?";
    
    db.query(sql, [Email, Password], (err, results) => {
        if (err) return res.status(500).json({ message: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" });
        if (results.length > 0) {
            const user = results[0];
            res.json({ status: 'success', user_id: user.User_id, name: user.Name, is_admin: user.is_admin });
        } else {
            res.status(401).json({ message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
        }
    });
});

// ==========================================
// API หมวด: ยานพาหนะ (Vehicles)
// ==========================================
app.get('/vehicles', (req, res) => {
    const userId = req.query.user_id;
    const isAdmin = req.query.is_admin;

    let sql = "";
    let params = [];

    if (isAdmin === '1') {
        sql = "SELECT * FROM vehicle"; // แอดมินเห็นทุกคัน
    } else {
        sql = "SELECT * FROM vehicle WHERE User_id = ?"; // ยูสเซอร์เห็นแค่รถตัวเอง
        params = [userId];
    }

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.post('/vehicles', upload.single('image'), (req, res) => {
    const { User_id, Brand, Model, vehicle_registration, Vehicle_Type } = req.body;
    const Vehicle_image = req.file ? req.file.filename : null; 
    const sql = "INSERT INTO vehicle (User_id, Brand, Model, vehicle_registration, Vehicle_Type, Vehicle_image) VALUES (?, ?, ?, ?, ?, ?)";
    
    db.query(sql, [User_id, Brand, Model, vehicle_registration, Vehicle_Type, Vehicle_image], (err, result) => {
        if (err) return res.status(500).json({ message: "Error saving vehicle" });
        res.status(201).json({ message: "เพิ่มรถสำเร็จ!" });
    });
});

app.delete('/vehicles/:id', (req, res) => {
    const id = req.params.id;
    const sql = "DELETE FROM vehicle WHERE Vehicle_id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "ลบสำเร็จ" });
    });
});

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
        if (err) return res.status(500).json({ message: "Error updating vehicle" });
        res.json({ message: "แก้ไขสำเร็จ" });
    });
});

// ==========================================
// API หมวด: ประเภทรายจ่าย (Expense Categories)
// ==========================================
app.get('/expense-categories', (req, res) => {
    const sql = "SELECT expenses_type_id, is_document, expenses_type FROM expenses_type";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.post('/expense-categories', (req, res) => {
    const { is_document, expenses_type } = req.body;
    const sql = "INSERT INTO expenses_type (is_document, expenses_type, recording_date) VALUES (?, ?, CURDATE())";
    db.query(sql, [is_document, expenses_type], (err, result) => {
        if (err) return res.status(500).json({ message: "เกิดข้อผิดพลาด" });
        res.status(201).json({ message: "เพิ่มประเภทรายจ่ายสำเร็จ!" });
    });
});

// ==========================================
// API หมวด: บันทึกรายจ่าย (Vehicle Expenses)
// ==========================================
app.get('/expenses', (req, res) => {
    const userId = req.query.user_id;
    const isAdmin = req.query.is_admin;

    let sql = `
        SELECT 
            ve.Expenses_id, 
            ve.Amount_of_money, 
            ve.Expense_Date, 
            ve.payment_status,
            ve.Detail,
            v.Brand, 
            v.Model, 
            v.vehicle_registration,
            et.expenses_type
        FROM vehicle_expenses ve
        JOIN vehicle v ON ve.Vehicle_id = v.Vehicle_id
        JOIN expenses_type et ON ve.expenses_type_id = et.expenses_type_id
    `;
    let params = [];

    // ถ้าไม่ใช่ Admin ให้ดึงแค่บิลรถของตัวเอง
    if (isAdmin !== '1') {
        sql += " WHERE v.User_id = ?";
        params.push(userId);
    }
    sql += " ORDER BY ve.Expense_Date DESC";

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.post('/expenses', (req, res) => {
    const { Vehicle_id, Amount_of_money, expenses_type_id, Expense_Date, payment_status, Detail } = req.body;
    const sql = "INSERT INTO vehicle_expenses (Vehicle_id, Amount_of_money, expenses_type_id, Expense_Date, payment_status, Detail) VALUES (?, ?, ?, ?, ?, ?)";
    
    db.query(sql, [Vehicle_id, Amount_of_money, expenses_type_id, Expense_Date, payment_status, Detail], (err, result) => {
        if (err) return res.status(500).json({ message: "เกิดข้อผิดพลาดในการบันทึก" });
        res.status(201).json({ message: "บันทึกรายจ่ายสำเร็จ!" });
    });
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});