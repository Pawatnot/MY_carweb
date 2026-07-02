import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Profile = () => {
  const [user, setUser] = useState(null);
  
  // State สำหรับควบคุม Modal และฟอร์มเปลี่ยนรหัสผ่าน
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passForm, setPassForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // State สำหรับควบคุม Modal และฟอร์มแก้ไขข้อมูลส่วนตัว
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    Name: '',
    Email: '',
    PhoneNum: ''
  });

  // ดึงข้อมูลใหม่ล่าสุดจาก Database ทันทีที่เปิดหน้านี้
  useEffect(() => {
    const storedUserId = localStorage.getItem('user_id');
    if (storedUserId) {
      fetchUserData(storedUserId);
    } else {
      // Fallback เผื่อโหลดไม่ทัน
      const storedUser = localStorage.getItem('user');
      if (storedUser) setUser(JSON.parse(storedUser));
    }
  }, []);

  // ฟังก์ชันดึงข้อมูลผู้ใช้จาก API
  const fetchUserData = async (id) => {
    try {
      const res = await axios.get(`http://localhost:5000/users/${id}`);
      setUser(res.data);
      // นำข้อมูลที่ได้มาใส่ในฟอร์มแก้ไขรอไว้เลย
      setEditForm({
        Name: res.data.Name || '',
        Email: res.data.Email || '',
        PhoneNum: res.data.PhoneNum || ''
      });
      // อัปเดต LocalStorage เผื่อเอาไปใช้แสดงชื่อที่แถบเมนูด้านบน
      localStorage.setItem('user', JSON.stringify(res.data));
    } catch (error) {
      console.error("Error fetching user data", error);
    }
  };

  // ฟังก์ชันส่งข้อมูลแก้ไขส่วนตัว
  const handleEditProfile = async (e) => {
    e.preventDefault();
    try {
      const currentUserId = localStorage.getItem('user_id');
      const response = await axios.put(`http://localhost:5000/users/${currentUserId}`, editForm);
      
      alert(response.data.message);
      setShowEditModal(false);
      // โหลดข้อมูลที่อัปเดตแล้วมาแสดงใหม่ทันที
      fetchUserData(currentUserId);
    } catch (error) {
      const errorMsg = error.response?.data?.message || "ไม่สามารถติดต่อเซิร์ฟเวอร์ได้";
      alert(`เกิดข้อผิดพลาด: ${errorMsg}`);
    }
  };

  // ฟังก์ชันส่งข้อมูลไปเปลี่ยนรหัสผ่าน
  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passForm.newPassword !== passForm.confirmPassword) {
      alert("รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน!");
      return;
    }

    try {
      const currentUserId = localStorage.getItem('user_id'); 

      const response = await axios.put(`http://localhost:5000/users/${currentUserId}/password`, {
        currentPassword: passForm.currentPassword,
        newPassword: passForm.newPassword
      });
      
      alert(response.data.message); 
      setShowPasswordModal(false);  
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); 
    } catch (error) {
      if (error.response && error.response.data) {
        const errorMsg = error.response.data.message || error.response.data.error || JSON.stringify(error.response.data);
        alert(`สาเหตุ: ${errorMsg}`);
      } else {
        alert("ไม่สามารถติดต่อเซิร์ฟเวอร์ได้");
      }
    }
  };

  if (!user) return <div style={{textAlign:'center', marginTop: '50px'}}>กรุณาเข้าสู่ระบบ</div>;

  return (
    <div style={styles.container}>
      <h2 style={{color: '#2c3e50', textAlign: 'center'}}>ข้อมูลส่วนตัว</h2>
      
      <div style={styles.card}>
        <div style={styles.avatarLarge}>
          {user.Name ? user.Name.charAt(0).toUpperCase() : '?'}
        </div>
        
        <div style={styles.infoRow}>
            <strong>ชื่อ-นามสกุล:</strong> 
            <span>{user.Name || '-'}</span>
        </div>
        <div style={styles.infoRow}>
            <strong>อีเมล:</strong> 
            <span style={{ color: user.Email ? '#555' : '#94A3B8', fontStyle: user.Email ? 'normal' : 'italic' }}>
              {user.Email || 'ไม่ได้ระบุ'}
            </span>
        </div>
        <div style={styles.infoRow}>
            <strong>เบอร์โทรศัพท์:</strong> 
            <span>{user.PhoneNum || '-'}</span>
        </div>
        <div style={styles.infoRow}>
            <strong>สถานะ:</strong> 
            <span style={{ fontWeight: 'bold', color: user.is_admin ? '#16A34A' : '#3498db' }}>
              {user.is_admin ? 'ผู้ดูแลระบบ (Admin)' : 'สมาชิกทั่วไป'}
            </span>
        </div>

        <div style={styles.actionContainer}>
          <button style={styles.editBtn} onClick={() => setShowEditModal(true)}>
            แก้ไขข้อมูล
          </button>
          <button style={styles.passwordBtn} onClick={() => setShowPasswordModal(true)}>
            เปลี่ยนรหัสผ่าน
          </button>
        </div>
      </div>

      {/* ================= Modal สำหรับแก้ไขข้อมูลส่วนตัว ================= */}
      {showEditModal && (
        <div style={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, borderBottom: '2px solid #3498db', paddingBottom: '10px', color: '#2c3e50' }}>แก้ไขข้อมูลส่วนตัว</h3>
            <form onSubmit={handleEditProfile} style={{ marginTop: '20px' }}>
              <div>
                <label style={styles.label}>ชื่อ-นามสกุล</label>
                <input 
                  type="text" required style={styles.input} 
                  value={editForm.Name} 
                  onChange={e => setEditForm({...editForm, Name: e.target.value})}
                />
              </div>
              <div>
                <label style={styles.label}>อีเมล</label>
                <input 
                  type="email" required style={styles.input} 
                  value={editForm.Email} 
                  onChange={e => setEditForm({...editForm, Email: e.target.value})}
                />
              </div>
              <div>
                <label style={styles.label}>เบอร์โทรศัพท์</label>
                <input 
                  type="text" required maxLength="10" style={styles.input} 
                  value={editForm.PhoneNum} 
                  onChange={e => setEditForm({...editForm, PhoneNum: e.target.value})}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="submit" style={styles.saveEditBtn}>บันทึกข้อมูล</button>
                <button type="button" onClick={() => setShowEditModal(false)} style={styles.cancelBtn}>ยกเลิก</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= Modal สำหรับเปลี่ยนรหัสผ่าน ================= */}
      {showPasswordModal && (
        <div style={styles.modalOverlay} onClick={() => setShowPasswordModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, borderBottom: '2px solid #e74c3c', paddingBottom: '10px', color: '#2c3e50' }}>เปลี่ยนรหัสผ่าน</h3>
            <form onSubmit={handleChangePassword} style={{ marginTop: '20px' }}>
              <div>
                <label style={styles.label}>รหัสผ่านเดิม</label>
                <input 
                  type="password" required style={styles.input} 
                  value={passForm.currentPassword} 
                  onChange={e => setPassForm({...passForm, currentPassword: e.target.value})}
                />
              </div>
              <div>
                <label style={styles.label}>รหัสผ่านใหม่</label>
                <input 
                  type="password" required minLength="6" style={styles.input} 
                  value={passForm.newPassword} 
                  onChange={e => setPassForm({...passForm, newPassword: e.target.value})}
                />
              </div>
              <div>
                <label style={styles.label}>ยืนยันรหัสผ่านใหม่</label>
                <input 
                  type="password" required minLength="6" style={styles.input} 
                  value={passForm.confirmPassword} 
                  onChange={e => setPassForm({...passForm, confirmPassword: e.target.value})}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="submit" style={styles.submitBtn}>บันทึกรหัสผ่าน</button>
                <button type="button" onClick={() => setShowPasswordModal(false)} style={styles.cancelBtn}>ยกเลิก</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { maxWidth: '500px', margin: '40px auto', padding: '20px' },
  card: { 
    backgroundColor: 'white', padding: '40px 30px', borderRadius: '16px', 
    boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #F0EAE1',
    display: 'flex', flexDirection: 'column', alignItems: 'center' 
  },
  avatarLarge: {
    width: '100px', height: '100px', backgroundColor: '#3498db', color: 'white',
    borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center',
    fontSize: '40px', fontWeight: 'bold', marginBottom: '30px', boxShadow: '0 4px 10px rgba(52, 152, 219, 0.3)'
  },
  infoRow: { width: '100%', display: 'flex', justifyContent: 'space-between', padding: '15px 0', borderBottom: '1px solid #F1F5F9', fontSize: '16px', color: '#475569' },
  actionContainer: { display: 'flex', gap: '15px', width: '100%', marginTop: '30px' },
  editBtn: { flex: 1, padding: '12px', backgroundColor: '#F8FAFC', color: '#334155', border: '1px solid #CBD5E1', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', transition: '0.2s' },
  passwordBtn: { flex: 1, padding: '12px', backgroundColor: '#FFFFFF', color: '#e74c3c', border: '1px solid #e74c3c', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', transition: '0.2s' },
  
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '400px', boxShadow: '0 5px 15px rgba(0,0,0,0.2)' },
  label: { fontWeight: 'bold', color: '#34495e', fontSize: '14px', marginBottom: '5px', display: 'block' },
  input: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #bdc3c7', fontSize: '16px', boxSizing: 'border-box', marginBottom: '15px' },
  submitBtn: { flex: 1, padding: '12px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' },
  saveEditBtn: { flex: 1, padding: '12px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' },
  cancelBtn: { flex: 1, padding: '12px', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }
};

export default Profile;