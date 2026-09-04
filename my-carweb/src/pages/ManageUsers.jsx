import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);

  // พิมพ์ดูเลยว่าหลังบ้านส่งอะไรมาให้บ้าง!
  console.log("ข้อมูลสมาชิกจากหลังบ้าน: ", users);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/members');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      alert('ไม่สามารถดึงข้อมูลผู้ใช้งานได้');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleApprove = async (userId, userName) => {
    if (window.confirm(`คุณแน่ใจหรือไม่ที่จะอนุมัติให้ผู้ใช้ ${userName} เข้าสู่ระบบ?`)) {
      try {
        await axios.put(`http://localhost:5000/members/${userId}/approve`);
        alert(`อนุมัติผู้ใช้งาน ${userName} สำเร็จ`);
        fetchUsers(); 
      } catch (error) {
        console.error('Error approving user:', error);
        alert('เกิดข้อผิดพลาดในการอนุมัติผู้ใช้งาน');
      }
    }
  };

  const handleReject = async (userId, userName) => {
    if (window.confirm(`คุณแน่ใจหรือไม่ที่จะปฏิเสธและลบข้อมูลผู้ใช้ ${userName} ทิ้ง?`)) {
      try {
        await axios.delete(`http://localhost:5000/members/${userId}`);
        alert(`ลบข้อมูลผู้ใช้งาน ${userName} สำเร็จ`);
        fetchUsers(); 
      } catch (error) {
        console.error('Error rejecting user:', error);
        alert('เกิดข้อผิดพลาดในการลบผู้ใช้งาน');
      }
    }
  };

  // ✅ ฟังก์ชันโอนสิทธิ์ Admin (เพิ่มการอัปเดต localStorage และรีเฟรชหน้าจอ)
  const handleTransferAdmin = async (userId, userName) => {
    if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการโอนสิทธิ์ Admin ให้ "${userName}"?\n(สิทธิ์ Admin ของคุณจะถูกลดลงเป็น User ทันที)`)) {
      try {
        await axios.put(`http://localhost:5000/members/${userId}/transfer-admin`);
        alert(`โอนสิทธิ์ Admin ให้ ${userName} สำเร็จ!`);
        
        // 1. อัปเดตสิทธิ์ของตัวเองในเครื่องให้เป็น User ทันที
        localStorage.setItem('is_admin', '0');

        // 2. รีเฟรชหน้าจอเพื่อล้างหน้าจัดการและซ่อนเมนูแอดมินทันที
        window.location.reload(); 
      } catch (error) {
        console.error('Error transferring admin role:', error);
        alert('เกิดข้อผิดพลาดในการโอนสิทธิ์ผู้ดูแลระบบ');
      }
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>จัดการผู้ใช้งานในระบบ</h2>
      
      <div style={styles.card}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>ชื่อ-นามสกุล</th>
              <th style={styles.th}>อีเมล</th>
              <th style={styles.th}>สถานะบัญชี</th>
              <th style={styles.th}>การจัดการ</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              // ดักจับทั้งกรณีที่เซิร์ฟเวอร์ส่งมาเป็น 1/0 หรือ true/false
              const isApproved = user.is_approved == 1 || user.is_approved === true;
              const isAdmin = user.is_admin == 1 || user.is_admin === true;

              return (
                <tr key={user.User_id} style={styles.tr}>
                  <td style={styles.td}>{user.User_id}</td>
                  <td style={styles.td}>{user.Name}</td>
                  <td style={styles.td}>{user.Email}</td>
                  <td style={styles.td}>
                    {isApproved ? (
                      <span style={{ color: '#16A34A', fontWeight: 'bold' }}>อนุมัติแล้ว</span>
                    ) : (
                      <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>รอการอนุมัติ</span>
                    )}
                  </td>
                  <td style={styles.td}>
                    {!isApproved ? (
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                        <button onClick={() => handleApprove(user.User_id, user.Name)} style={styles.approveBtn}>
                          อนุมัติ
                        </button>
                        <button onClick={() => handleReject(user.User_id, user.Name)} style={styles.rejectBtn}>
                          ปฏิเสธ
                        </button>
                      </div>
                    ) : (
                      // ถ้าเป็น Admin แสดงป้ายกำกับ, ถ้าไม่ใช่ แสดงปุ่มโอนสิทธิ์และปุ่มลบ
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                        {isAdmin ? (
                          <span style={{ color: '#2563EB', fontWeight: 'bold', padding: '6px 12px', backgroundColor: '#EFF6FF', borderRadius: '5px' }}>
                            ผู้ดูแลระบบ (Admin)
                          </span>
                        ) : (
                          <>
                            <button onClick={() => handleTransferAdmin(user.User_id, user.Name)} style={styles.adminBtn}>
                              โอนสิทธิ์ Admin
                            </button>
                            <button onClick={() => handleReject(user.User_id, user.Name)} style={styles.deleteBtn}>
                              ลบผู้ใช้
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {users.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px', color: '#7f8c8d' }}>
            ไม่พบข้อมูลผู้ใช้งาน
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: { padding: '20px', maxWidth: '1000px', margin: '0 auto' },
  card: { backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'center' },
  th: { padding: '12px', backgroundColor: '#34495e', color: 'white', borderBottom: '2px solid #ddd', fontSize: '15px' },
  tr: { borderBottom: '1px solid #eee', transition: 'background-color 0.2s' },
  td: { padding: '12px', color: '#2c3e50', fontSize: '14px', verticalAlign: 'middle' },
  approveBtn: { padding: '8px 15px', backgroundColor: '#2ecc71', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
  rejectBtn: { padding: '8px 15px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
  deleteBtn: { padding: '6px 12px', backgroundColor: '#DC2626', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
  adminBtn: { padding: '6px 12px', backgroundColor: '#3B82F6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }
};

export default ManageUsers;