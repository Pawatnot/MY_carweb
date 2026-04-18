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
            <hr style={{ borderColor: '#34495e', margin: '20px 0' }} />
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

const styles = {
  sidebar: { width: '250px', height: '100vh', backgroundColor: '#2c3e50', color: 'white', position: 'fixed', left: 0, top: 0, display: 'flex', flexDirection: 'column', boxShadow: '2px 0 5px rgba(0,0,0,0.1)' },
  
  logoContainer: { 
    padding: '20px', 
    backgroundColor: '#1a252f', 
    textAlign: 'center',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '80px' 
  },
  
  logoImage: {
    maxWidth: '100%',  
    height: 'auto',    
    maxHeight: '100px',  
    objectFit: 'contain'
  },

  menuList: { listStyle: 'none', padding: '0', margin: '20px 0', width: '100%' },
  link: { display: 'block', padding: '15px 20px', color: '#bdc3c7', textDecoration: 'none', fontSize: '16px', transition: '0.3s' },
  activeLink: { display: 'block', padding: '15px 20px', color: 'white', backgroundColor: '#34495e', textDecoration: 'none', fontSize: '16px', fontWeight: 'bold', borderLeft: '4px solid #3498db' }
};

export default Sidebar;