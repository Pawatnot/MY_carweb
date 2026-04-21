import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Schedules = () => {
  const [schedules, setSchedules] = useState([]);
  const [myVehicles, setMyVehicles] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const [userId, setUserId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // ฟอร์มสำหรับเพิ่มกำหนดการ Manual
  const [scheduleForm, setScheduleForm] = useState({
    Vehicle_id: '',
    Item_Name: '',
    Expiry_Date: ''
  });

  useEffect(() => {
    const adminStatus = localStorage.getItem('is_admin');
    const uId = localStorage.getItem('user_id');
    setUserId(uId);
    setIsAdmin(adminStatus === '1');

    if (uId) {
      fetchVehicles(uId, adminStatus);
      fetchSchedules(uId, adminStatus);
    }
  }, []);

  // 📌 1. ดึงข้อมูลรถ (เพื่อเอามาใส่ใน Dropdown ตอนเพิ่มกำหนดการ)
  const fetchVehicles = async (uId, adminStatus) => {
    try {
      const response = await axios.get('http://localhost:5000/vehicles', { params: { user_id: uId, is_admin: adminStatus }});
      setMyVehicles(response.data);
    } catch (error) { console.error(error); }
  };

  // 📌 2. ดึงข้อมูลกำหนดการจาก Database
  const fetchSchedules = async (uId, adminStatus) => {
    try {
      const response = await axios.get('http://localhost:5000/schedules', { params: { user_id: uId, is_admin: adminStatus }});
      
      // ✅ คำนวณวันคงเหลือ และจัดกลุ่มสถานะอัตโนมัติ
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const processedData = response.data.map(item => {
        const expDate = new Date(item.Expiry_Date);
        const diffTime = expDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let status = 'upcoming'; // ล่วงหน้า > 7 วัน
        if (diffDays < 0) status = 'overdue'; // เลยกำหนด
        else if (diffDays >= 0 && diffDays <= 7) status = 'urgent'; // ด่วนภายใน 7 วัน

        return { ...item, daysLeft: diffDays, status: status, formattedDate: expDate.toLocaleDateString('th-TH') };
      });

      setSchedules(processedData);
    } catch (error) { console.error(error); }
  };

  // 📌 3. ส่งข้อมูลบันทึกลง Database
  const handleAddSchedule = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/schedules', scheduleForm);
      alert('✅ เพิ่มกำหนดการเรียบร้อย');
      setShowModal(false);
      setScheduleForm({ Vehicle_id: '', Item_Name: '', Expiry_Date: '' });
      fetchSchedules(userId, isAdmin ? '1' : '0'); // รีเฟรชข้อมูลใหม่
    } catch (error) {
      console.error(error);
      alert('❌ เกิดข้อผิดพลาดในการบันทึก');
    }
  };

  const getStatusStyle = (status) => {
    switch(status) {
      case 'overdue': return { bg: '#FEF2F2', border: '#FECACA', text: '#DC2626', tagBg: '#DC2626', label: 'เลยกำหนด' };
      case 'urgent': return { bg: '#FFFBEB', border: '#FDE68A', text: '#D97706', tagBg: '#F59E0B', label: 'ด่วน (ใกล้ถึง)' };
      case 'upcoming': return { bg: '#F0FDF4', border: '#BBF7D0', text: '#16A34A', tagBg: '#10B981', label: 'ล่วงหน้า' };
      default: return { bg: '#FFFFFF', border: '#F0EAE1', text: '#4A4036', tagBg: '#94A3B8', label: 'ปกติ' };
    }
  };

  // คำนวณสรุปยอดกล่องด้านบน
  const overdueCount = schedules.filter(s => s.status === 'overdue').length;
  const urgentCount = schedules.filter(s => s.status === 'urgent').length;
  const upcomingCount = schedules.filter(s => s.status === 'upcoming').length;

  return (
    <div style={{ padding: '30px', backgroundColor: '#F9F8F4', minHeight: '100vh', boxSizing: 'border-box' }}>
      
      <div style={styles.headerContainer}>
        <h2 style={{ color: '#2C3E50', margin: 0 }}>⏰ กำหนดการ & บำรุงรักษา</h2>
        <button onClick={() => setShowModal(true)} style={styles.addBtn}>➕ เพิ่มกำหนดการ (Manual)</button>
      </div>

      <div style={styles.summaryGrid}>
        <div style={{...styles.summaryCard, borderLeft: '5px solid #DC2626'}}>
          <div style={styles.summaryTitle}>🔴 เลยกำหนดแล้ว</div>
          <div style={{...styles.summaryNumber, color: '#DC2626'}}>{overdueCount} <span style={styles.unit}>รายการ</span></div>
        </div>
        <div style={{...styles.summaryCard, borderLeft: '5px solid #F59E0B'}}>
          <div style={styles.summaryTitle}>🟡 ใกล้ถึง (ภายใน 7 วัน)</div>
          <div style={{...styles.summaryNumber, color: '#D97706'}}>{urgentCount} <span style={styles.unit}>รายการ</span></div>
        </div>
        <div style={{...styles.summaryCard, borderLeft: '5px solid #10B981'}}>
          <div style={styles.summaryTitle}>🟢 กำหนดการล่วงหน้า</div>
          <div style={{...styles.summaryNumber, color: '#16A34A'}}>{upcomingCount} <span style={styles.unit}>รายการ</span></div>
        </div>
      </div>

      <hr style={{ borderTop: '2px dashed #E2E8F0', margin: '30px 0' }}/>

      <div style={styles.listContainer}>
        {schedules.length === 0 ? (
           <p style={{ textAlign: 'center', color: '#94A3B8', marginTop: '20px' }}>ยังไม่มีกำหนดการ...</p>
        ) : (
          schedules.map(item => {
            const styleInfo = getStatusStyle(item.status);
            return (
              <div key={item.Schedule_id} style={{...styles.scheduleCard, backgroundColor: styleInfo.bg, borderColor: styleInfo.border}}>
                
                <div style={styles.cardLeft}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: styleInfo.text }}>
                    {item.vehicle_registration} <span style={{fontSize: '14px', color: '#64748b', fontWeight: 'normal'}}>({item.Brand} {item.Model})</span>
                  </div>
                  <div style={{ color: '#4A4036', fontSize: '15px', marginTop: '5px' }}>🔧 {item.Item_Name}</div>
                  <div style={{ color: '#8A7D72', fontSize: '13px', marginTop: '5px' }}>📅 วันครบกำหนด: {item.formattedDate}</div>
                </div>

                <div style={styles.cardRight}>
                  <div style={{...styles.statusTag, backgroundColor: styleInfo.tagBg}}>
                    {item.daysLeft < 0 ? `เลยมา ${Math.abs(item.daysLeft)} วัน` : `เหลือ ${item.daysLeft} วัน`}
                  </div>
                  <button style={styles.actionBtn}>✅ ดำเนินการแล้ว</button>
                </div>

              </div>
            )
          })
        )}
      </div>

      {showModal && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, borderBottom: '2px solid #2C3E50', paddingBottom: '10px', color: '#2C3E50' }}>เพิ่มกำหนดการใหม่</h3>
            <form onSubmit={handleAddSchedule} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
              <div>
                <label style={styles.label}>1. เลือกยานพาหนะ</label>
                <select style={styles.input} required value={scheduleForm.Vehicle_id} onChange={e => setScheduleForm({...scheduleForm, Vehicle_id: e.target.value})}>
                  <option value="">-- เลือกรถ --</option>
                  {myVehicles.map(v => (
                    <option key={v.Vehicle_id} value={v.Vehicle_id}>{v.vehicle_registration} ({v.Brand})</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={styles.label}>2. ชื่อรายการแจ้งเตือน</label>
                <input type="text" placeholder="เช่น ต่อภาษี, เปลี่ยนยาง" style={styles.input} required value={scheduleForm.Item_Name} onChange={e => setScheduleForm({...scheduleForm, Item_Name: e.target.value})}/>
              </div>
              <div>
                <label style={styles.label}>3. วันที่ครบกำหนด</label>
                <input type="date" style={styles.input} required value={scheduleForm.Expiry_Date} onChange={e => setScheduleForm({...scheduleForm, Expiry_Date: e.target.value})}/>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" style={{...styles.submitBtn, backgroundColor: '#2C3E50'}}>บันทึก</button>
                <button type="button" onClick={() => setShowModal(false)} style={styles.cancelBtn}>ยกเลิก</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

// 🎨 Styles โครงสร้างเดิม
const styles = {
  headerContainer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '10px' },
  addBtn: { backgroundColor: '#2C3E50', color: 'white', border: 'none', padding: '12px 25px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' },
  summaryCard: { backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.03)', border: '1px solid #F0EAE1' },
  summaryTitle: { fontSize: '14px', fontWeight: 'bold', color: '#8A7D72', marginBottom: '5px' },
  summaryNumber: { fontSize: '32px', fontWeight: 'bold' },
  unit: { fontSize: '16px', fontWeight: 'normal', color: '#94A3B8' },
  listContainer: { display: 'flex', flexDirection: 'column', gap: '15px' },
  scheduleCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderRadius: '12px', border: '1px solid', boxShadow: '0 2px 5px rgba(0,0,0,0.02)', flexWrap: 'wrap', gap: '15px' },
  cardLeft: { flex: 1, minWidth: '200px' },
  cardRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px', minWidth: '150px' },
  statusTag: { color: 'white', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' },
  actionBtn: { backgroundColor: '#FFFFFF', border: '2px solid #CBD5E1', color: '#475569', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', transition: '0.2s' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '400px', boxShadow: '0 5px 15px rgba(0,0,0,0.2)' },
  label: { fontWeight: 'bold', color: '#4A4036', fontSize: '14px', marginBottom: '5px', display: 'block' },
  input: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '16px', boxSizing: 'border-box' },
  submitBtn: { flex: 1, padding: '12px', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' },
  cancelBtn: { flex: 1, padding: '12px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }
};

export default Schedules;