const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const multer = require('multer'); 
const path = require('path');     
const fs = require('fs'); // 💡 ย้าย fs มารวมไว้ด้านบนให้เป็นระเบียบ
const expenseTypesFilePath = './expenseTypes.json';
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
        console.error('เชื่อมต่อฐานข้อมูลล้มเหลว:', err);
        return;
    }
    console.log('เชื่อมต่อ MySQL สำเร็จแล้ว!');
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
// ระบบจัดการไฟล์ Master Data (brands.json)
// ==========================================
const brandsFilePath = path.join(__dirname, 'brands.json');

// ฟังก์ชันอ่านไฟล์ JSON (โครงสร้างใหม่ เก็บยี่ห้อ + รุ่น)
const readBrandsFile = () => {
    if (!fs.existsSync(brandsFilePath)) {
        const initialData = {
            "Toyota": ["Vios", "Yaris", "Hilux Revo"],
            "Honda": ["Civic", "City", "HR-V"],
            "Isuzu": ["D-Max", "MU-X"],
            "BYD": ["Dolphin", "Atto 3", "Seal"],
            "Ford": ["Ranger", "Everest"]
        };
        fs.writeFileSync(brandsFilePath, JSON.stringify(initialData, null, 2));
    }
    const data = fs.readFileSync(brandsFilePath);
    return JSON.parse(data);
};

// ==========================================
// API หมวด: Master Data (ยี่ห้อและรุ่นรถจากไฟล์ .json)
// ==========================================
// 1. ดึงข้อมูลยี่ห้อและรุ่นรถทั้งหมด
app.get('/api/brands', (req, res) => {
    try {
        const data = readBrandsFile();
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
    }
});

// 2. แอดมินเพิ่มยี่ห้อ หรือ เพิ่มรุ่น
app.post('/api/brands', (req, res) => {
    const { brand, model } = req.body;
    
    if (!brand) return res.status(400).json({ message: "กรุณาระบุยี่ห้อรถ" });

    try {
        const data = readBrandsFile();
        
        // ถ้าส่งมาแค่ยี่ห้อใหม่ ให้สร้างโครงสร้างยี่ห้อเปล่าๆ
        if (!data[brand]) {
            data[brand] = [];
        }

        // ถ้ามีชื่อรุ่นส่งมาด้วย ให้เอาไปต่อท้ายใน Array ของยี่ห้อนั้น
        if (model && model.trim() !== '') {
            if (!data[brand].includes(model.trim())) {
                data[brand].push(model.trim());
            } else {
                return res.status(400).json({ message: "มีรุ่นรถนี้ในระบบแล้ว" });
            }
        }

        fs.writeFileSync(brandsFilePath, JSON.stringify(data, null, 2));
        res.json({ status: 'success', message: "บันทึกข้อมูลสำเร็จ", data });
    } catch (err) {
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการบันทึก" });
    }
});

// 3. แอดมินแก้ไขชื่อยี่ห้อ
app.put('/api/brands/:oldBrand', (req, res) => {
    const oldBrand = req.params.oldBrand;
    const { newBrand } = req.body;
    try {
        const data = readBrandsFile();
        if (!data[oldBrand]) return res.status(404).json({ message: "ไม่พบยี่ห้อนี้" });
        if (data[newBrand]) return res.status(400).json({ message: "มียี่ห้อนี้ซ้ำในระบบแล้ว" });

        // ย้ายข้อมูลรุ่นรถไปที่ key ใหม่ แล้วลบ key เก่าทิ้ง
        data[newBrand] = data[oldBrand];
        delete data[oldBrand];

        fs.writeFileSync(brandsFilePath, JSON.stringify(data, null, 2));
        res.json({ message: "อัปเดตยี่ห้อสำเร็จ" });
    } catch (err) {
        res.status(500).json({ message: "เกิดข้อผิดพลาด" });
    }
});

// 4. แอดมินลบยี่ห้อ
app.delete('/api/brands/:brand', (req, res) => {
    const brand = req.params.brand;
    try {
        const data = readBrandsFile();
        if (!data[brand]) return res.status(404).json({ message: "ไม่พบยี่ห้อนี้" });

        delete data[brand];
        fs.writeFileSync(brandsFilePath, JSON.stringify(data, null, 2));
        res.json({ message: "ลบยี่ห้อสำเร็จ" });
    } catch (err) {
        res.status(500).json({ message: "เกิดข้อผิดพลาด" });
    }
});

// 5. แอดมินแก้ไขชื่อรุ่น
app.put('/api/brands/:brand/models/:oldModel', (req, res) => {
    const { brand, oldModel } = req.params;
    const { newModel } = req.body;
    try {
        const data = readBrandsFile();
        if (!data[brand]) return res.status(404).json({ message: "ไม่พบยี่ห้อนี้" });

        const modelIndex = data[brand].indexOf(oldModel);
        if (modelIndex === -1) return res.status(404).json({ message: "ไม่พบรุ่นนี้" });
        if (data[brand].includes(newModel)) return res.status(400).json({ message: "มีรุ่นนี้ซ้ำในระบบแล้ว" });

        data[brand][modelIndex] = newModel;
        fs.writeFileSync(brandsFilePath, JSON.stringify(data, null, 2));
        res.json({ message: "อัปเดตรุ่นสำเร็จ" });
    } catch (err) {
        res.status(500).json({ message: "เกิดข้อผิดพลาด" });
    }
});

// 6. แอดมินลบรุ่น
app.delete('/api/brands/:brand/models/:model', (req, res) => {
    const { brand, model } = req.params;
    try {
        const data = readBrandsFile();
        if (!data[brand]) return res.status(404).json({ message: "ไม่พบยี่ห้อนี้" });

        data[brand] = data[brand].filter(m => m !== model);
        fs.writeFileSync(brandsFilePath, JSON.stringify(data, null, 2));
        res.json({ message: "ลบรุ่นสำเร็จ" });
    } catch (err) {
        res.status(500).json({ message: "เกิดข้อผิดพลาด" });
    }
});


// ==========================================
// API หมวด: สมาชิก (Members & Auth)
// ==========================================
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
    
    const sql = "SELECT User_id, Name, Email, is_admin, is_approved FROM members WHERE Email = ? AND Password = ?";
    db.query(sql, [Email, Password], (err, results) => {
        if (err) return res.status(500).json({ message: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" });
        
        if (results.length > 0) {
            const user = results[0];
            
            if (user.is_approved === 0) {
                return res.status(403).json({ message: "บัญชีของคุณยังไม่ได้รับการอนุมัติ กรุณารอแอดมินตรวจสอบ" });
            }

            res.json({ status: 'success', user_id: user.User_id, name: user.Name, is_admin: user.is_admin });
        } else {
            res.status(401).json({ message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
        }
    });
});

app.get('/members', (req, res) => {
    const sql = "SELECT User_id, Name, Email, PhoneNum, is_admin, is_approved FROM members ORDER BY User_id DESC";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลสมาชิก" });
        res.json(results);
    });
});

app.put('/members/:id/approve', (req, res) => {
    const userId = req.params.id;
    const sql = "UPDATE members SET is_approved = 1 WHERE User_id = ?";
    db.query(sql, [userId], (err, result) => {
        if (err) return res.status(500).json({ message: "เกิดข้อผิดพลาดในการอนุมัติผู้ใช้งาน" });
        res.json({ status: 'success', message: "อนุมัติผู้ใช้งานเรียบร้อยแล้ว" });
    });
});

app.delete('/members/:id', (req, res) => {
    const userId = req.params.id;
    const sql = "DELETE FROM members WHERE User_id = ?";
    db.query(sql, [userId], (err, result) => {
        if (err) return res.status(500).json({ message: "เกิดข้อผิดพลาดในการลบข้อมูลผู้ใช้งาน" });
        res.json({ status: 'success', message: "ปฏิเสธและลบข้อมูลผู้ใช้งานเรียบร้อยแล้ว" });
    });
});

app.put('/users/:id/password', (req, res) => {
    const userId = req.params.id;
    const { currentPassword, newPassword } = req.body;

    const checkSql = "SELECT * FROM members WHERE User_id = ? AND Password = ?";
    db.query(checkSql, [userId, currentPassword], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (results.length === 0) {
            return res.status(400).json({ message: "รหัสผ่านเดิมไม่ถูกต้อง" });
        }

        const updateSql = "UPDATE members SET Password = ? WHERE User_id = ?";
        db.query(updateSql, [newPassword, userId], (err, updateResult) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "เปลี่ยนรหัสผ่านสำเร็จ" });
        });
    });
});

// API: ดึงข้อมูลส่วนตัวผู้ใช้ 1 คน (เพื่อเอามาโชว์ในหน้าโปรไฟล์)
app.get('/users/:id', (req, res) => {
    const userId = req.params.id;
    const sql = "SELECT User_id, Name, Email, PhoneNum, is_admin FROM members WHERE User_id = ?";
    
    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error("Error fetching user:", err);
            return res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
        }
        if (results.length === 0) return res.status(404).json({ message: "ไม่พบผู้ใช้งาน" });
        res.json(results[0]);
    });
});

// API: อัปเดตข้อมูลส่วนตัวผู้ใช้ (Name, Email, PhoneNum)
app.put('/users/:id', (req, res) => {
    const userId = req.params.id;
    const { Name, Email, PhoneNum } = req.body;

    if (!Name || !Email || !PhoneNum) {
        return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
    }

    const sql = "UPDATE members SET Name = ?, Email = ?, PhoneNum = ? WHERE User_id = ?";
    db.query(sql, [Name, Email, PhoneNum, userId], (err, result) => {
        if (err) {
            console.error("Error updating user info:", err);
            return res.status(500).json({ message: "เกิดข้อผิดพลาดในการอัปเดตข้อมูล" });
        }
        res.json({ message: "อัปเดตข้อมูลส่วนตัวสำเร็จ" });
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
        sql = "SELECT * FROM vehicle"; 
    } else {
        sql = "SELECT * FROM vehicle WHERE User_id = ?"; 
        params = [userId];
    }

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.get('/vehicles/:id', (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM vehicle WHERE Vehicle_id = ?";
    
    db.query(sql, [id], (err, results) => {
        if (err) return res.status(500).json(err);
        if (results.length === 0) return res.status(404).json({ message: "ไม่พบข้อมูลรถ" });
        res.json(results[0]);
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

// API ชุดเก่า (ดึงข้อมูลตรงจากตาราง) เผื่อมีบางหน้ายังใช้อยู่ เจมเก็บไว้ให้เพื่อป้องกัน Error ครับ
app.get('/vehicle-brands', (req, res) => {
    const sql = "SELECT DISTINCT Brand FROM vehicle WHERE Brand IS NOT NULL AND Brand != '' ORDER BY Brand ASC";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results.map(row => row.Brand));
    });
});

app.get('/vehicle-models', (req, res) => {
    const brand = req.query.brand;
    const sql = "SELECT DISTINCT Model FROM vehicle WHERE Brand = ? AND Model IS NOT NULL AND Model != '' ORDER BY Model ASC";
    db.query(sql, [brand], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results.map(row => row.Model));
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
    const finalDate = Expense_Date ? Expense_Date : null;
    
    const sql = "INSERT INTO vehicle_expenses (Vehicle_id, Amount_of_money, expenses_type_id, Expense_Date, payment_status, Detail) VALUES (?, ?, ?, ?, ?, ?)";
    db.query(sql, [Vehicle_id, Amount_of_money, expenses_type_id, finalDate, payment_status, Detail], (err, result) => {
        if (err) {
            console.error("Error POST expenses:", err);
            return res.status(500).json({ message: "เกิดข้อผิดพลาดในการบันทึก" });
        }
        res.status(201).json({ message: "บันทึกรายจ่ายสำเร็จ!", insertId: result.insertId });
    });
});

app.put('/expenses/:id/status', (req, res) => {
    const id = req.params.id;
    const { payment_status, Expense_Date } = req.body;
    const finalDate = (payment_status === 1 && Expense_Date) ? Expense_Date : null;

    const sql = "UPDATE vehicle_expenses SET payment_status = ?, Expense_Date = ? WHERE Expenses_id = ?";
    db.query(sql, [payment_status, finalDate, id], (err, result) => {
        if (err) {
            console.error("Error updating status:", err);
            return res.status(500).json({ message: "เกิดข้อผิดพลาดในการอัปเดต" });
        }
        res.json({ message: "อัปเดตสถานะสำเร็จ!" });
    });
});

// ==========================================
// ระบบกำหนดการ (Vehicle_Schedules)
// ==========================================
app.get('/schedules', (req, res) => {
  const userId = req.query.user_id;
  const isAdmin = req.query.is_admin;

  let sql = `
    SELECT s.*, v.vehicle_registration, v.Brand, v.Model 
    FROM Vehicle_Schedules s
    JOIN Vehicle v ON s.Vehicle_id = v.Vehicle_id
  `;
  let params = [];

  if (isAdmin !== '1') {
    sql += ` WHERE v.User_id = ?`;
    params.push(userId);
  }
  
  sql += ` ORDER BY s.Expiry_Date ASC`;

  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

app.post('/schedules', (req, res) => {
  const { Vehicle_id, expenses_id, Item_Name, Expiry_Date } = req.body;
  const sql = "INSERT INTO Vehicle_Schedules (Vehicle_id, expenses_id, Item_Name, Expiry_Date) VALUES (?, ?, ?, ?)";
  
  db.query(sql, [Vehicle_id, expenses_id || null, Item_Name, Expiry_Date], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "เพิ่มกำหนดการสำเร็จ", id: result.insertId });
  });
});

app.put('/schedules/:id/status', (req, res) => {
  const scheduleId = req.params.id;
  const { is_completed } = req.body;

  const sql = 'UPDATE vehicle_schedules SET is_completed = ? WHERE Schedule_id = ?';
  db.query(sql, [is_completed, scheduleId], (err, result) => {
    if (err) {
      console.error("Error updating schedule status:", err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ message: 'อัปเดตสถานะเรียบร้อยแล้ว', result });
  });
});

// ==========================================
// API หมวด: การแจ้งเตือน (Notifications)
// ==========================================
// ประกาศตำแหน่งไฟล์สำหรับเก็บข้อมูลแจ้งเตือน
const requestsFilePath = path.join(__dirname, 'requests.json');

app.post('/notifications', (req, res) => {
    const { Message } = req.body;
    
    if (!Message) {
        return res.status(400).json({ message: "ข้อมูลไม่ครบถ้วน" });
    }

    try {
        let requestsData = [];
        if (fs.existsSync(requestsFilePath)) {
            const fileData = fs.readFileSync(requestsFilePath);
            requestsData = JSON.parse(fileData);
        }

        const newRequest = {
            id: Date.now(),
            message: Message,
            status: "รอตรวจสอบ",
            date: new Date().toLocaleString('th-TH')
        };
        
        requestsData.push(newRequest);
        fs.writeFileSync(requestsFilePath, JSON.stringify(requestsData, null, 2));
        
        res.status(201).json({ message: "ส่งคำขอสำเร็จ แอดมินจะตรวจสอบเร็วๆ นี้" });
    } catch (err) {
        console.error("Error saving request:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการส่งคำขอ" });
    }
});

// API: แอดมินดึงข้อมูลแจ้งเตือนทั้งหมดมาดู (GET)
app.get('/notifications', (req, res) => {
    try {
        if (fs.existsSync(requestsFilePath)) {
            const fileData = fs.readFileSync(requestsFilePath);
            res.json(JSON.parse(fileData));
        } else {
            res.json([]); // ถ้ายังไม่มีไฟล์ ให้ส่ง Array ว่างกลับไป
        }
    } catch (err) {
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการอ่านแจ้งเตือน" });
    }
});

// API: แอดมินลบการแจ้งเตือนเมื่อจัดการเสร็จแล้ว (DELETE)
app.delete('/notifications/:id', (req, res) => {
    const id = parseInt(req.params.id);
    try {
        if (fs.existsSync(requestsFilePath)) {
            let requestsData = JSON.parse(fs.readFileSync(requestsFilePath));
            // กรองเอาเฉพาะอันที่ ID ไม่ตรงกับที่ส่งมา (เป็นการลบตัวที่เลือกทิ้ง)
            requestsData = requestsData.filter(req => req.id !== id);
            fs.writeFileSync(requestsFilePath, JSON.stringify(requestsData, null, 2));
        }
        res.json({ message: "ลบการแจ้งเตือนสำเร็จ" });
    } catch (err) {
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการลบแจ้งเตือน" });
    }
});

// ดึงข้อมูลหมวดหมู่ทั้งหมด
app.get('/expense-categories', (req, res) => {
    db.query("SELECT * FROM expenses_type", (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// เพิ่มหมวดหมู่ใหม่
app.post('/expense-categories', (req, res) => {
    const { is_document, expenses_type } = req.body;
    db.query("INSERT INTO expenses_type (is_document, expenses_type, is_active) VALUES (?, ?, 1)", 
    [is_document, expenses_type], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json({ insertId: results.insertId });
    });
});

// เปิด/ปิด สถานะหมวดหมู่
app.put('/expense-categories/:id/toggle', (req, res) => {
    const { is_active } = req.body;
    db.query("UPDATE expenses_type SET is_active = ? WHERE expenses_type_id = ?", 
    [is_active, req.params.id], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "อัปเดตสถานะสำเร็จ" });
    });
});

// ============================================
// เปิด Server
// ============================================
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});