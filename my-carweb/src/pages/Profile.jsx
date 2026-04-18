import React, { useState, useEffect } from 'react';

const Profile = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  if (!user) return <div style={{textAlign:'center', marginTop: '50px'}}>กรุณาเข้าสู่ระบบ</div>;

  return (
    <div style={styles.container}>
      <h2 style={{color: '#2c3e50', textAlign: 'center'}}>👤 ข้อมูลส่วนตัว</h2>
      
      <div style={styles.card}>
        <div style={styles.avatarLarge}>
          {user.Name.charAt(0).toUpperCase()}
        </div>
        
        <div style={styles.infoRow}>
            <strong>ชื่อ-นามสกุล:</strong> <span>{user.Name}</span>
        </div>
        <div style={styles.infoRow}>
            <strong>อีเมล:</strong> <span>{user.Email}</span>
        </div>
        {/* ถ้ามีข้อมูลอื่นๆ เช่น เบอร์โทร ก็เพิ่มตรงนี้ได้ */}
        <div style={styles.infoRow}>
            <strong>สถานะ:</strong> <span>{user.is_admin ? 'ผู้ดูแลระบบ (Admin)' : 'สมาชิกทั่วไป'}</span>
        </div>
        <div style={styles.infoRow}>
            <strong>User ID:</strong> <span>{user.User_id}</span>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { maxWidth: '500px', margin: '40px auto', padding: '20px' },
  card: { backgroundColor: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  avatarLarge: {
    width: '100px', height: '100px', backgroundColor: '#3498db', color: 'white',
    borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center',
    fontSize: '40px', fontWeight: 'bold', marginBottom: '20px'
  },
  infoRow: { width: '100%', display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #eee', fontSize: '16px', color: '#555' }
};

export default Profile;