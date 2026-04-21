import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../assets/logo.png';

const Sidebar = () => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  // ✅ 1. ดึงค่าสิทธิ์แอดมินออกมาจาก localStorage
  // ถ้าล็อคอินด้วยไอดีที่เป็นแอดมิน (is_admin = 1) ตัวแปรนี้จะเป็น true
  const isAdmin = localStorage.getItem('is_admin') === '1';

  return (
    <div style={styles.sidebar}>
      <div style={styles.logoContainer}>
        <img 
          src={logo} 
          alt="Logo" 
          style={styles.logoImage} 
        />
      </div>

      <ul style={styles.menuList}>
        {/* ==========================================
            เมนูส่วนนี้ "ทุกคน" (User ปกติ และ Admin) จะเห็นหมด
            ========================================== */}
        <li>
          <Link to="/" style={isActive('/') ? styles.activeLink : styles.link}>
            Dashboard
          </Link>
        </li>
        <li>
          <Link to="/vehicles" style={isActive('/vehicles') ? styles.activeLink : styles.link}>
            ยานพาหนะ
          </Link>
        </li>
        <li>
          <Link to="/Expenses" style={isActive('/Expenses') ? styles.activeLink : styles.link}>
            รายจ่าย
          </Link>
        </li>
         <li>
          <Link to="/Schedules" style={isActive('/Schedules') ? styles.activeLink : styles.link}>
            กำหนดการ
          </Link>
        </li>
        
        {/* ==========================================
            ✅ 2. เมนูส่วนนี้จะโชว์ "เฉพาะ Admin" เท่านั้น!
            ========================================== */}
        {isAdmin && (
          <>
            {/* เปลี่ยนสีเส้นคั่นให้เข้ากับโทนใหม่ */}
            <hr style={{ borderColor: '#334155', margin: '20px 0' }} />
            <li>
              <Link to="/manage-users" style={isActive('/manage-users') ? styles.activeLink : styles.link}>
                 จัดการผู้ใช้งาน
              </Link>
            </li>
            {/* ถ้าน๊อตมีหน้าอื่นที่อยากให้เฉพาะแอดมินเห็น ก็เอามาใส่ในปีกกานี้ได้เลยครับ */}
          </>
        )}

      </ul>
    </div>
  );
};

// 🎨 ปรับปรุงรหัสสีใหม่ทั้งหมดตรงนี้ครับ
// 🎨 โทนสีใหม่: ครีมละมุน (Soft Cream & Warm Beige) อบอุ่น สบายตา มินิมอล
const styles = {
  sidebar: { 
    width: '250px', 
    height: '100vh', 
    backgroundColor: '#FDFBF7', // 🔹 สีพื้นหลังหลัก สีครีมอ่อนๆ (Off-White) ดูอบอุ่น สบายตา
    color: '#4A4036', // เปลี่ยนสีตัวอักษรเป็นสีเทาอมน้ำตาลเข้ม ให้อ่านง่าย
    position: 'fixed', 
    left: 0, 
    top: 0, 
    display: 'flex', 
    flexDirection: 'column', 
    boxShadow: '2px 0 15px rgba(0,0,0,0.03)' // เงาบางๆ ให้แถบเมนูดูลอยแยกจากเนื้อหา
  },
  
  logoContainer: { 
    padding: '20px', 
    backgroundColor: '#FFFFFF', // 🔹 พื้นหลังโลโก้สีขาวล้วน จะช่วยตีกรอบให้โลโก้สีแดงดูสะอาดและเด่นที่สุด
    textAlign: 'center',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '80px',
    borderBottom: '1px solid #F0EAE1' // เส้นคั่นสีครีมเข้ม
  },
  
  logoImage: {
    maxWidth: '100%',  
    height: 'auto',    
    maxHeight: '100px',  
    objectFit: 'contain'
  },

  menuList: { listStyle: 'none', padding: '0', margin: '20px 0', width: '100%' },
  
  link: { 
    display: 'block', 
    padding: '15px 20px', 
    color: '#8A7D72', // 🔹 เมนูที่ไม่ได้เลือก เป็นสีน้ำตาลอมเทาละมุนๆ
    textDecoration: 'none', 
    fontSize: '16px', 
    transition: '0.3s' 
  },
  
  activeLink: { 
    display: 'block', 
    padding: '15px 20px', 
    color: '#B91C1C', // 🔹 ตัวอักษรตอนเลือกเมนูเป็น "สีแดง" (เชื่อมโยงกับโลโก้)
    backgroundColor: '#F5EFE6', // 🔹 พื้นหลังตอนเลือกเป็นสีครีมที่เข้มขึ้นมานิดนึง (Warm Beige)
    textDecoration: 'none', 
    fontSize: '16px', 
    fontWeight: 'bold', 
    borderLeft: '4px solid #DC2626' // 🔹 แถบซ้ายสีแดงสดใส
  }
};

export default Sidebar;