import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import logo from '../assets/logo.png';

const Sidebar = () => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  const [isAdmin, setIsAdmin] = useState(false);

  // ✅ ให้ Sidebar ยิง API ไปเช็คสิทธิ์ล่าสุดจาก Backend สดๆ ทุกครั้งที่เปลี่ยนหน้า
  useEffect(() => {
    const checkUserRole = async () => {
      const userId = localStorage.getItem('user_id');
      if (!userId) return;

      try {
        // ดึงข้อมูลโปรไฟล์ล่าสุดจาก Backend ของผู้ใช้นี้
        const response = await axios.get(`http://localhost:5000/users/${userId}`);
        const currentIsAdmin = response.data.is_admin == 1;

        setIsAdmin(currentIsAdmin);

        // อัปเดตค่าใน localStorage ให้ตรงกับความเป็นจริงปัจจุบันด้วย
        localStorage.setItem('is_admin', currentIsAdmin ? '1' : '0');
      } catch (error) {
        console.error("Error checking role:", error);
      }
    };

    checkUserRole();
  }, [location]); // ทำงานทุกครั้งที่มีการเปลี่ยนหน้า

  return (
    <div style={styles.sidebar}>
      <div style={styles.logoContainer}>
        <img src={logo} alt="Logo" style={styles.logoImage} />
      </div>

      <ul style={styles.menuList}>
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
        
        {/* เมนูเฉพาะ Admin จะอัปเดตอัตโนมัติทันทีโดยไม่ต้องล็อกอินใหม่ */}
        {isAdmin && (
          <>
            <hr style={{ borderColor: '#334155', margin: '20px 0' }} />
            <li>
              <Link to="/ManageUsers" style={isActive('/ManageUsers') ? styles.activeLink : styles.link}>
                จัดการผู้ใช้งาน
              </Link>
            </li>
            <li>
              <Link to="/admin-settings" style={isActive('/admin-settings') ? styles.activeLink : styles.link}>
                ตั้งค่าระบบ
              </Link>
            </li>
          </>
        )}
      </ul>
    </div>
  );
};

// สไตล์เดิมของคุณ
const styles = {
  sidebar: { 
    width: '250px', height: '100vh', backgroundColor: '#FDFBF7', color: '#4A4036', 
    position: 'fixed', left: 0, top: 0, display: 'flex', flexDirection: 'column', boxShadow: '2px 0 15px rgba(0,0,0,0.03)' 
  },
  logoContainer: { 
    padding: '20px', backgroundColor: '#FFFFFF', textAlign: 'center', display: 'flex', 
    justifyContent: 'center', alignItems: 'center', minHeight: '80px', borderBottom: '1px solid #F0EAE1' 
  },
  logoImage: { maxWidth: '100%', height: 'auto', maxHeight: '100px', objectFit: 'contain' },
  menuList: { listStyle: 'none', padding: '0', margin: '20px 0', width: '100%' },
  link: { display: 'block', padding: '15px 20px', color: '#8A7D72', textDecoration: 'none', fontSize: '16px', transition: '0.3s' },
  activeLink: { 
    display: 'block', padding: '15px 20px', color: '#B91C1C', backgroundColor: '#F5EFE6', 
    textDecoration: 'none', fontSize: '16px', fontWeight: 'bold', borderLeft: '4px solid #DC2626' 
  }
};

export default Sidebar;