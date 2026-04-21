import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import bellIcon from '../assets/bell.png'; // ✅ 1. Import รูปกระดิ่ง

const Navbar = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/login'; 
  };

  return (
    <nav style={styles.nav}>
      {/* ฝั่งซ้ายว่างไว้ */}
      <div style={{fontWeight: 'bold', color: '#555'}}></div>

      {/* ฝั่งขวา: Notification + User Profile */}
      <div style={styles.rightSection}>
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            
            {/* 🔔 ปุ่มแจ้งเตือน (รูปกระดิ่ง) */}
            <Link to="/notification" style={styles.iconBtn}>
              <img src={bellIcon} alt="Notification" style={{ width: '24px', height: '24px' }} />
              {/* จุดแดงแจ้งเตือน (สมมติว่ามี) */}
              {/* <span style={styles.badge}>3</span> */}
            </Link>

            {/* 👤 User Profile Icon (คลิกไปหน้า Profile) */}
            <Link to="/profile" style={styles.profileLink}>
              <div style={styles.avatar}>
                {/* เอาตัวอักษรแรกของชื่อมาทำเป็นรูป Profile */}
                {user.Name.charAt(0).toUpperCase()}
              </div>
              <span style={styles.userName}>{user.Name}</span>
            </Link>

            <button onClick={handleLogout} style={styles.logoutBtn}>ออกจากระบบ</button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to="/login" style={styles.loginBtn}>เข้าสู่ระบบ</Link>
            <Link to="/register" style={styles.registerBtn}>สมัครสมาชิก</Link>
          </div>
        )}
      </div>
    </nav>
  );
};

const styles = {
  nav: {
    height: '60px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 30px',
    backgroundColor: '#FDFBF7',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  rightSection: { display: 'flex', alignItems: 'center' },
  
  // Styles สำหรับกระดิ่ง
  iconBtn: { position: 'relative', display: 'flex', alignItems: 'center', textDecoration: 'none', cursor: 'pointer' },
  badge: {
    position: 'absolute', top: '-5px', right: '-5px',
    backgroundColor: '#e74c3c', color: 'white',
    fontSize: '10px', fontWeight: 'bold',
    borderRadius: '50%', width: '16px', height: '16px',
    display: 'flex', justifyContent: 'center', alignItems: 'center'
  },

  // Styles สำหรับ User Profile
  profileLink: { display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', cursor: 'pointer' },
  avatar: {
    width: '35px', height: '35px',
    backgroundColor: '#3498db', color: 'white',
    borderRadius: '50%',
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    fontWeight: 'bold', fontSize: '18px'
  },
  userName: { color: '#333', fontWeight: 'bold', marginRight: '10px' },

  logoutBtn: { backgroundColor: '#e74c3c', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' },
  loginBtn: { color: '#3498db', textDecoration: 'none', fontWeight: 'bold', padding: '6px 12px' },
  registerBtn: { backgroundColor: '#3498db', color: 'white', textDecoration: 'none', padding: '6px 12px', borderRadius: '4px' }
};

export default Navbar;