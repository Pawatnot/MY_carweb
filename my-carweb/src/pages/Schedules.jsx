import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Schedules = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // State สำหรับจัดการข้อมูล
  const [schedulesList, setSchedulesList] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // State สำหรับจัดการหน้าจอ
  const [activeTab, setActiveTab] = useState('pending'); // pending = รอดำเนินการ, completed = ดำเนินการแล้ว
  const [showAddModal, setShowAddModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  // Form สำหรับเพิ่มกำหนดการใหม่แบบ Manual
  const [scheduleForm, setScheduleForm] = useState({
    Vehicle_id: '',
    Item_Name: '',
    Expiry_Date: ''
  });

  // Form สำหรับบันทึกรายจ่ายเมื่อดำเนินการเสร็จ (Pro Flow)
  const [actionExpenseForm, setActionExpenseForm] = useState({
    Vehicle_id: '',
    expenses_type_id: '',
    Amount_of_money: '',
    Expense_Date: '',
    Detail: '',
    payment_status: 1 // ตั้งเป็นจ่ายแล้วอัตโนมัติ
  });
  
  // State สำหรับเก็บค่ารถที่ต้องการกรอง (ค่าว่าง '' หมายถึงแสดงทั้งหมด)
  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState('');

  useEffect(() => {
    const uId = localStorage.getItem('user_id');
    const adminStatus = localStorage.getItem('is_admin');
    
    if (uId) {
      setUserId(uId);
      setIsAdmin(adminStatus === '1');
      fetchSchedules(uId, adminStatus);
      fetchVehicles(uId, adminStatus);
      fetchCategories();
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const fetchSchedules = async (uId, adminStatus) => {
    try {
      const response = await axios.get('http://localhost:5000/schedules', {
        params: { user_id: uId, is_admin: adminStatus }
      });
      setSchedulesList(response.data);
    } catch (error) {
      console.error("Error fetching schedules:", error);
    }
  };

  const fetchVehicles = async (uId, adminStatus) => {
    try {
      const response = await axios.get('http://localhost:5000/vehicles', {
        params: { user_id: uId, is_admin: adminStatus }
      });
      setVehicles(response.data);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('http://localhost:5000/expense-categories');
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  // ดำเนินการเพิ่มกำหนดการใหม่แบบ Manual
  const handleAddSchedule = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/schedules', scheduleForm);
      alert("เพิ่มกำหนดการเรียบร้อยแล้ว");
      setShowAddModal(false);
      setScheduleForm({ Vehicle_id: '', Item_Name: '', Expiry_Date: '' });
      fetchSchedules(userId, isAdmin ? '1' : '0');
    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาดในการเพิ่มกำหนดการ");
    }
  };

  // เมื่อผู้ใช้กดปุ่ม "ดำเนินการแล้ว" -> เปิด Modal บันทึกรายจ่ายพร้อมกรอกข้อมูลรอไว้
  const handleOpenActionModal = (sch) => {
    setSelectedSchedule(sch);
    
    // ค้นหาหมวดหมู่รายจ่ายที่ตรงกับชื่อรายการโดยอัตโนมัติ
    const matchedCat = categories.find(c => c.expenses_type === sch.Item_Name);
    
    setActionExpenseForm({
      Vehicle_id: sch.Vehicle_id,
      expenses_type_id: matchedCat ? matchedCat.expenses_type_id : '',
      Amount_of_money: '',
      Expense_Date: new Date().toISOString().split('T')[0], // ตั้งเป็นวันปัจจุบันเริ่มต้น
      Detail: `ดำเนินการจากระบบกำหนดการ: ${sch.Item_Name}`,
      payment_status: 1
    });
    setShowActionModal(true);
  };

  // กดยืนยันบันทึกรายจ่ายและเปลี่ยนสถานะกำหนดการ (2 เด้งพร้อมกัน)
  const handleConfirmAction = async (e) => {
    e.preventDefault();
    try {
      // เด้งที่ 1: ยิง API บันทึกข้อมูลเข้าตารางรายจ่าย (Expenses)
      await axios.post('http://localhost:5000/expenses', actionExpenseForm);

      // เด้งที่ 2: ยิง API อัปเดตตารางกำหนดการเปลี่ยน is_completed เป็น 1
      await axios.put(`http://localhost:5000/schedules/${selectedSchedule.Schedule_id}/status`, {
        is_completed: 1
      });

      alert("บันทึกประวัติรายจ่ายและอัปเดตกำหนดการสำเร็จ");
      setShowActionModal(false);
      fetchSchedules(userId, isAdmin ? '1' : '0');
    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาดในการประมวลผลข้อมูล");
    }
  };

// ตัวกรองแบ่งตามแท็บ, กรองตามรถ และคำนวณวันคงเหลือ
  const filteredSchedules = schedulesList.filter(item => {
    // 1. กรองตามยานพาหนะ (ถ้าเลือก Dropdown ไว้ และ ID ไม่ตรงกัน ให้ตัดทิ้ง)
    if (selectedVehicleFilter !== '' && item.Vehicle_id.toString() !== selectedVehicleFilter) {
      return false;
    }

    // 2. กรองตามแท็บสถานะ (โค้ดเดิม)
    if (activeTab === 'pending') return item.is_completed === 0 || item.is_completed === null;
    if (activeTab === 'completed') return item.is_completed === 1;
    return true;
  }).map(item => {
    // ... (ส่วนคำนวณวันคงเหลือปล่อยไว้เหมือนเดิมได้เลยครับ)
    const today = new Date();
    today.setHours(0,0,0,0);
    const expDate = new Date(item.Expiry_Date);
    const diffTime = expDate - today;
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return { ...item, daysLeft };
  });

  // เรียงลำดับความเร่งด่วนสำหรับรายการที่ยังไม่ทำ
  if (activeTab === 'pending') {
    filteredSchedules.sort((a, b) => a.daysLeft - b.daysLeft);
  }

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div style={styles.container}>
      <div style={styles.topSection}>
        <h2 style={{ color: '#2C3E50', margin: 0 }}>ระบบกำหนดการ & แจ้งเตือน</h2>
        
        {/* จัดกลุ่ม Dropdown ตัวกรอง และปุ่มเพิ่ม ให้อยู่ฝั่งขวา */}
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          
          <select 
            style={styles.filterSelect}
            value={selectedVehicleFilter}
            onChange={(e) => setSelectedVehicleFilter(e.target.value)}
          >
            <option value="">-- ยานพาหนะทั้งหมด --</option>
            {vehicles.map(v => (
              <option key={v.Vehicle_id} value={v.Vehicle_id}>
                {v.vehicle_registration} ({v.Brand})
              </option>
            ))}
          </select>

          <button onClick={() => setShowAddModal(true)} style={styles.addBtn}>เพิ่มกำหนดการใหม่</button>
        </div>
      </div>

      {/* แถบสลับแท็บรอดำเนินการ / ดำเนินการแล้ว */}
      <div style={styles.tabContainer}>
        <button onClick={() => setActiveTab('pending')} style={activeTab === 'pending' ? styles.activeTabPending : styles.inactiveTab}>
          รายการที่ต้องทำ ({schedulesList.filter(s => s.is_completed === 0 || s.is_completed === null).length})
        </button>
        <button onClick={() => setActiveTab('completed')} style={activeTab === 'completed' ? styles.activeTabCompleted : styles.inactiveTab}>
          ประวัติการดำเนินการแล้ว ({schedulesList.filter(s => s.is_completed === 1).length})
        </button>
      </div>

      {/* ส่วนแสดงรายการการแจ้งเตือน */}
      {filteredSchedules.length === 0 ? (
        <div style={styles.emptyContainer}>ไม่มีรายการในหมวดหมู่นี้</div>
      ) : (
        <div style={styles.grid}>
          {filteredSchedules.map(sch => {
            const isOverdue = sch.daysLeft < 0;
            let statusColor = '#16A34A';
            let cardBorder = '5px solid #16A34A';
            
            if (activeTab === 'pending') {
              if (isOverdue) {
                statusColor = '#DC2626';
                cardBorder = '5px solid #DC2626';
              } else if (sch.daysLeft <= 7) {
                statusColor = '#D97706';
                cardBorder = '5px solid #D97706';
              }
            } else {
              statusColor = '#94A3B8';
              cardBorder = '5px solid #94A3B8';
            }

            return (
              <div key={sch.Schedule_id} style={{ ...styles.card, borderLeft: cardBorder }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={styles.vehicleTag}>{sch.Brand} - {sch.Model}</span>
                    <h3 style={{ margin: '10px 0 5px 0', color: '#2C3E50' }}>{sch.vehicle_registration}</h3>
                    <p style={{ margin: '0 0 10px 0', color: '#4A4036', fontWeight: 'bold' }}>รายการ: {sch.Item_Name}</p>
                  </div>
                  
                  {activeTab === 'pending' && (
                    <span style={{ ...styles.statusBadge, color: 'white', backgroundColor: statusColor }}>
                      {isOverdue ? `เลยกำหนด ${Math.abs(sch.daysLeft)} วัน` : `เหลืออีก ${sch.daysLeft} วัน`}
                    </span>
                  )}
                </div>

                <p style={{ margin: '5px 0', fontSize: '14px', color: '#64748B' }}>
                  วันที่ครบกำหนด: {formatDate(sch.Expiry_Date)}
                </p>

                {activeTab === 'pending' && (
                  <>
                    <hr style={{ borderTop: '1px dashed #E2E8F0', margin: '15px 0 10px 0' }} />
                    <button onClick={() => handleOpenActionModal(sch)} style={styles.actionBtn}>
                      ดำเนินการแล้ว
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal 1: เพิ่มกำหนดการใหม่ (Manual) */}
      {showAddModal && (
        <div style={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, borderBottom: '2px solid #2C3E50', paddingBottom: '10px' }}>เพิ่มกำหนดการแจ้งเตือน</h3>
            <form onSubmit={handleAddSchedule} style={styles.form}>
              <div>
                <label style={styles.label}>1. เลือกยานพาหนะ</label>
                <select required style={styles.input} onChange={e => setScheduleForm({...scheduleForm, Vehicle_id: e.target.value})}>
                  <option value="">-- กรุณาเลือกรถ --</option>
                  {vehicles.map(v => <option key={v.Vehicle_id} value={v.Vehicle_id}>{v.Brand} {v.Model} ({v.vehicle_registration})</option>)}
                </select>
              </div>
              <div>
                <label style={styles.label}>2. ประเภทรายการ</label>
                <select required style={styles.input} onChange={e => setScheduleForm({...scheduleForm, Item_Name: e.target.value})}>
                  <option value="">-- กรุณาเลือกประเภท --</option>
                  {categories.map(c => <option key={c.expenses_type_id} value={c.expenses_type}>{c.expenses_type}</option>)}
                </select>
              </div>
              <div>
                <label style={styles.label}>3. วันที่ครบกำหนด</label>
                <input type="date" required style={styles.input} onChange={e => setScheduleForm({...scheduleForm, Expiry_Date: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" style={{ ...styles.submitBtn, backgroundColor: '#2C3E50' }}>บันทึก</button>
                <button type="button" onClick={() => setShowAddModal(false)} style={styles.cancelBtn}>ยกเลิก</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: บันทึกรายจ่ายเมื่อกดยืนยันการทำรายการ (Pro Flow Popup) */}
      {showActionModal && (
        <div style={styles.modalOverlay} onClick={() => setShowActionModal(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, borderBottom: '2px solid #16A34A', paddingBottom: '10px', color: '#16A34A' }}>บันทึกค่าใช้จ่ายการดำเนินการ</h3>
            <form onSubmit={handleConfirmAction} style={styles.form}>
              <div style={{ backgroundColor: '#F0FDF4', padding: '12px', borderRadius: '8px', fontSize: '14px', color: '#166534' }}>
                ระบบจะทำการย้ายรายการนี้ไปยังหน้า <strong>"ประวัติการดำเนินการแล้ว"</strong> และเพิ่มข้อมูลลงในตารางรายจ่ายให้ทันที
              </div>
              <div>
                <label style={styles.label}>ประเภทรายจ่าย</label>
                <select 
                  required 
                  style={styles.input} 
                  value={actionExpenseForm.expenses_type_id}
                  onChange={e => setActionExpenseForm({...actionExpenseForm, expenses_type_id: e.target.value})}
                >
                  <option value="">-- กรุณาเลือกประเภทรายจ่าย --</option>
                  {categories.map(c => <option key={c.expenses_type_id} value={c.expenses_type_id}>{c.expenses_type}</option>)}
                </select>
              </div>
              <div>
                <label style={styles.label}>จำนวนเงินที่จ่ายไป (บาท)</label>
                <input type="number" required min="0" placeholder="กรอกจำนวนเงินจริง" style={styles.input} value={actionExpenseForm.Amount_of_money} onChange={e => setActionExpenseForm({...actionExpenseForm, Amount_of_money: e.target.value})} />
              </div>
              <div>
                <label style={styles.label}>วันที่ทำรายการชำระเงิน</label>
                <input type="date" required style={styles.input} value={actionExpenseForm.Expense_Date} onChange={e => setActionExpenseForm({...actionExpenseForm, Expense_Date: e.target.value})} />
              </div>
              <div>
                <label style={styles.label}>รายละเอียดเพิ่มเติม</label>
                <input type="text" style={styles.input} value={actionExpenseForm.Detail} onChange={e => setActionExpenseForm({...actionExpenseForm, Detail: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" style={{ ...styles.submitBtn, backgroundColor: '#16A34A' }}>บันทึกและปิดงาน</button>
                <button type="button" onClick={() => setShowActionModal(false)} style={styles.cancelBtn}>ยกเลิก</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { padding: '30px', backgroundColor: '#F9F8F4', minHeight: '100vh', boxSizing: 'border-box' },
  topSection: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' },
  addBtn: { backgroundColor: '#2C3E50', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  
  tabContainer: { display: 'flex', gap: '10px', marginBottom: '25px', borderBottom: '1px solid #E2E8F0', paddingBottom: '10px' },
  activeTabPending: { padding: '10px 20px', backgroundColor: '#2C3E50', color: 'white', border: 'none', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' },
  activeTabCompleted: { padding: '10px 20px', backgroundColor: '#94A3B8', color: 'white', border: 'none', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' },
  inactiveTab: { padding: '10px 20px', backgroundColor: '#FFFFFF', color: '#64748B', border: '1px solid #CBD5E1', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' },
  
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' },
  card: { backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.03)', border: '1px solid #F0EAE1' },
  vehicleTag: { backgroundColor: '#F1F5F9', color: '#475569', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' },
  statusBadge: { padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' },
  actionBtn: { width: '100%', backgroundColor: '#16A34A', color: 'white', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: '0.2s' },
  emptyContainer: { backgroundColor: 'white', padding: '40px', textAlign: 'center', borderRadius: '12px', color: '#94A3B8', border: '1px dashed #CBD5E1' },
  
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '460px', boxShadow: '0 5px 15px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' },
  label: { fontWeight: 'bold', color: '#34495e', fontSize: '14px', marginBottom: '5px', display: 'block' },
  input: { width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #bdc3c7', fontSize: '16px', boxSizing: 'border-box' },
  submitBtn: { flex: 1, padding: '12px', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' },
  cancelBtn: { flex: 1, padding: '12px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }, // <-- เติมลูกน้ำตรงนี้ครับ
  filterSelect: {
    padding: '10px 15px',
    borderRadius: '8px',
    border: '1px solid #CBD5E1',
    backgroundColor: '#FFFFFF',
    color: '#475569',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    outline: 'none',
    minWidth: '200px'
  }
};


export default Schedules;