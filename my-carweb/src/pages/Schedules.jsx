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
  const [showAddModal, setShowAddModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  // Form สำหรับเพิ่มกำหนดการใหม่แบบ Manual
  const [scheduleForm, setScheduleForm] = useState({
    Vehicle_id: '',
    Item_Name: '',
    Expiry_Date: ''
  });

  // Form สำหรับแก้ไขกำหนดการ
  const [editForm, setEditForm] = useState({
    Schedule_id: '',
    Vehicle_id: '',
    Item_Name: '',
    Expiry_Date: ''
  });

  // Form สำหรับบันทึกรายจ่ายเมื่อดำเนินการเสร็จ
  const [actionExpenseForm, setActionExpenseForm] = useState({
    Vehicle_id: '',
    expenses_type_id: '',
    Amount_of_money: '',
    Expense_Date: '',
    Detail: '',
    payment_status: 1 
  });
  
  // State สำหรับเก็บไฟล์ใบเสร็จ และตั้งเตือนรอบใหม่
  const [actionReceiptFile, setActionReceiptFile] = useState(null);
  const [isAutoSchedule, setIsAutoSchedule] = useState(false); 
  const [nextExpiryDate, setNextExpiryDate] = useState('');    
  
  // State สำหรับตัวกรองข้อมูล
  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');

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

  const handleOpenEdit = (sch) => {
    const dateObj = new Date(sch.Expiry_Date);
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const formattedDate = `${yyyy}-${mm}-${dd}`;

    setEditForm({
      Schedule_id: sch.Schedule_id,
      Vehicle_id: sch.Vehicle_id ? sch.Vehicle_id.toString() : '',
      Item_Name: sch.Item_Name || '',
      Expiry_Date: formattedDate
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:5000/schedules/${editForm.Schedule_id}`, editForm);
      alert("แก้ไขข้อมูลกำหนดการสำเร็จ!");
      setShowEditModal(false);
      fetchSchedules(userId, isAdmin ? '1' : '0');
    } catch (error) {
      console.error("Error editing schedule:", error);
      alert("เกิดข้อผิดพลาดในการแก้ไขข้อมูล");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้? (ข้อมูลจะถูกลบถาวร)")) {
      try {
        await axios.delete(`http://localhost:5000/schedules/${id}`);
        fetchSchedules(userId, isAdmin ? '1' : '0');
      } catch (error) {
        console.error("Error deleting schedule:", error);
        alert("เกิดข้อผิดพลาดในการลบข้อมูล");
      }
    }
  };

  const handleOpenActionModal = (sch) => {
    setSelectedSchedule(sch);
    const matchedCat = categories.find(c => c.expenses_type === sch.Item_Name);
    
    setActionExpenseForm({
      Vehicle_id: sch.Vehicle_id,
      expenses_type_id: matchedCat ? matchedCat.expenses_type_id : '',
      Amount_of_money: '',
      Expense_Date: new Date().toISOString().split('T')[0], 
      Detail: `ดำเนินการจากระบบกำหนดการ: ${sch.Item_Name}`,
      payment_status: 1
    });
    setActionReceiptFile(null); 
    setIsAutoSchedule(false); 
    setNextExpiryDate('');    
    setShowActionModal(true);
  };

  const handleConfirmAction = async (e) => {
    e.preventDefault();
    if (!actionReceiptFile) return alert("กรุณาแนบภาพใบเสร็จเพื่อเป็นหลักฐาน");

    try {
      const formData = new FormData();
      formData.append('Vehicle_id', actionExpenseForm.Vehicle_id);
      formData.append('expenses_type_id', actionExpenseForm.expenses_type_id);
      formData.append('Amount_of_money', actionExpenseForm.Amount_of_money);
      formData.append('Expense_Date', actionExpenseForm.Expense_Date);
      formData.append('Detail', actionExpenseForm.Detail);
      formData.append('payment_status', 1); 
      formData.append('receipt_image', actionReceiptFile);

      // 1. ยิง API บันทึกรายจ่ายพร้อมใบเสร็จ
      await axios.post('http://localhost:5000/expenses', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // 2. ยิง API อัปเดตสถานะกำหนดการเป็น "ดำเนินการแล้ว"
      await axios.put(`http://localhost:5000/schedules/${selectedSchedule.Schedule_id}/status`, { is_completed: 1 });

      // 3. ถ้าผู้ใช้เลือกตั้งเตือนรอบถัดไป ให้สร้างกำหนดการใหม่
      if (isAutoSchedule && nextExpiryDate) {
        await axios.post('http://localhost:5000/schedules', {
          Vehicle_id: actionExpenseForm.Vehicle_id,
          Item_Name: selectedSchedule.Item_Name, 
          Expiry_Date: nextExpiryDate
        });
      }

      alert("บันทึกประวัติรายจ่ายและอัปเดตกำหนดการสำเร็จ!\n(รายการนี้ถูกย้ายไปแสดงที่หน้ารายจ่ายแล้ว)");
      setShowActionModal(false);
      fetchSchedules(userId, isAdmin ? '1' : '0');
    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาดในการประมวลผลข้อมูล");
    }
  };

  // กรองแสดงเฉพาะรายการที่ "ยังไม่เสร็จ" พร้อมตัวกรองรถและประเภท
  const pendingSchedules = schedulesList.filter(item => {
    if (selectedVehicleFilter !== '' && item.Vehicle_id.toString() !== selectedVehicleFilter) return false;
    if (selectedCategoryFilter !== '' && item.Item_Name !== selectedCategoryFilter) return false; 
    return item.is_completed === 0 || item.is_completed === null;
  }).map(item => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const expDate = new Date(item.Expiry_Date);
    const diffTime = expDate - today;
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return { ...item, daysLeft };
  }).sort((a, b) => a.daysLeft - b.daysLeft); 

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div style={styles.container}>
      <div style={styles.topSection}>
        <div>
          <h2 style={{ color: '#2C3E50', margin: 0 }}>ระบบกำหนดการ & แจ้งเตือน</h2>
        </div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
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

          <select 
            style={styles.filterSelect}
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
          >
            <option value="">-- ประเภทรายการทั้งหมด --</option>
            {categories.map(c => (
              <option key={c.expenses_type_id} value={c.expenses_type}>
                {c.expenses_type}
              </option>
            ))}
          </select>

          <button onClick={() => setShowAddModal(true)} style={styles.addBtn}>เพิ่มกำหนดการใหม่</button>
        </div>
      </div>

      {pendingSchedules.length === 0 ? (
        <div style={styles.emptyContainer}>เยี่ยมมาก! ไม่มีรายการแจ้งเตือนค้างอยู่เลย</div>
      ) : (
        <div style={styles.grid}>
          {pendingSchedules.map(sch => {
            const isOverdue = sch.daysLeft < 0;
            let statusColor = '#16A34A';
            let cardBorder = '5px solid #16A34A';
            
            if (isOverdue) {
              statusColor = '#DC2626';
              cardBorder = '5px solid #DC2626';
            } else if (sch.daysLeft <= 7) {
              statusColor = '#D97706';
              cardBorder = '5px solid #D97706';
            }

            return (
              <div key={sch.Schedule_id} style={{ ...styles.card, borderLeft: cardBorder }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={styles.vehicleTag}>{sch.Brand} - {sch.Model}</span>
                    <h3 style={{ margin: '10px 0 5px 0', color: '#2C3E50' }}>{sch.vehicle_registration}</h3>
                    <p style={{ margin: '0 0 10px 0', color: '#4A4036', fontWeight: 'bold' }}>รายการ: {sch.Item_Name}</p>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                    <span style={{ ...styles.statusBadge, color: 'white', backgroundColor: statusColor }}>
                      {isOverdue ? `เลยกำหนด ${Math.abs(sch.daysLeft)} วัน` : `เหลืออีก ${sch.daysLeft} วัน`}
                    </span>
                    
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button onClick={() => handleOpenEdit(sch)} style={{...styles.iconBtn, color: '#f39c12'}} title="แก้ไข">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => handleDelete(sch.Schedule_id)} style={{...styles.iconBtn, color: '#e74c3c'}} title="ลบ">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                <p style={{ margin: '5px 0', fontSize: '14px', color: '#64748B' }}>
                  วันที่ครบกำหนด: {formatDate(sch.Expiry_Date)}
                </p>

                <hr style={{ borderTop: '1px dashed #E2E8F0', margin: '15px 0 10px 0' }} />
                <button onClick={() => handleOpenActionModal(sch)} style={styles.actionBtn}>
                  ดำเนินการแล้ว
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal 1: เพิ่มกำหนดการใหม่ */}
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

      {/* Modal 1.5: แก้ไขกำหนดการ */}
      {showEditModal && (
        <div style={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, borderBottom: '2px solid #f39c12', paddingBottom: '10px', color: '#2C3E50' }}>แก้ไขกำหนดการ</h3>
            <form onSubmit={handleSaveEdit} style={styles.form}>
              <div>
                <label style={styles.label}>1. เลือกยานพาหนะ</label>
                <select required style={styles.input} value={editForm.Vehicle_id} onChange={e => setEditForm({...editForm, Vehicle_id: e.target.value})}>
                  <option value="">-- กรุณาเลือกรถ --</option>
                  {vehicles.map(v => <option key={v.Vehicle_id} value={v.Vehicle_id.toString()}>{v.Brand} {v.Model} ({v.vehicle_registration})</option>)}
                </select>
              </div>
              <div>
                <label style={styles.label}>2. ประเภทรายการ</label>
                <select required style={styles.input} value={editForm.Item_Name} onChange={e => setEditForm({...editForm, Item_Name: e.target.value})}>
                  <option value="">-- กรุณาเลือกประเภท --</option>
                  {categories.map(c => <option key={c.expenses_type_id} value={c.expenses_type}>{c.expenses_type}</option>)}
                </select>
              </div>
              <div>
                <label style={styles.label}>3. วันที่ครบกำหนด</label>
                <input type="date" required style={styles.input} value={editForm.Expiry_Date} onChange={e => setEditForm({...editForm, Expiry_Date: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" style={{ ...styles.submitBtn, backgroundColor: '#f39c12' }}>บันทึกการแก้ไข</button>
                <button type="button" onClick={() => setShowEditModal(false)} style={styles.cancelBtn}>ยกเลิก</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: บันทึกรายจ่ายเมื่อกดยืนยันการทำรายการ */}
      {showActionModal && (
        <div style={styles.modalOverlay} onClick={() => setShowActionModal(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, borderBottom: '2px solid #16A34A', paddingBottom: '10px', color: '#16A34A' }}>บันทึกค่าใช้จ่ายการดำเนินการ</h3>
            <form onSubmit={handleConfirmAction} style={styles.form}>
              <div style={{ backgroundColor: '#F0FDF4', padding: '12px', borderRadius: '8px', fontSize: '14px', color: '#166534' }}>
                รายการนี้จะถูกย้ายไปเป็น <strong>"ประวัติรายจ่าย"</strong> โดยอัตโนมัติเมื่อบันทึกสำเร็จ
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
                <label style={styles.label}>ภาพใบเสร็จรับเงิน <span style={{color: 'red'}}>*</span></label>
                <input type="file" required accept="image/*" style={styles.input} onChange={e => setActionReceiptFile(e.target.files[0])} />
              </div>

              <div>
                <label style={styles.label}>วันที่ทำรายการชำระเงิน</label>
                <input type="date" required style={styles.input} value={actionExpenseForm.Expense_Date} onChange={e => setActionExpenseForm({...actionExpenseForm, Expense_Date: e.target.value})} />
              </div>
              <div>
                <label style={styles.label}>รายละเอียดเพิ่มเติม</label>
                <input type="text" style={styles.input} value={actionExpenseForm.Detail} onChange={e => setActionExpenseForm({...actionExpenseForm, Detail: e.target.value})} />
              </div>

              <div style={{ padding: '12px', backgroundColor: '#F0FDF4', borderRadius: '8px', border: '1px solid #BBF7D0', marginTop: '5px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={isAutoSchedule} onChange={e => setIsAutoSchedule(e.target.checked)} style={{ transform: 'scale(1.2)' }} />
                  <span style={{fontWeight: 'bold', color: '#16A34A', fontSize: '14px'}}>ตั้งเตือนรายการนี้ในรอบถัดไป (เช่น ปีหน้า)</span>
                </label>
                {isAutoSchedule && (
                  <div style={{ marginTop: '10px' }}>
                    <label style={{...styles.label, fontSize: '13px', color: '#166534'}}>วันที่ครบกำหนดรอบใหม่ <span style={{color: 'red'}}>*</span></label>
                    <input type="date" required style={styles.input} value={nextExpiryDate} onChange={e => setNextExpiryDate(e.target.value)}/>
                  </div>
                )}
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
  topSection: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' },
  addBtn: { backgroundColor: '#2C3E50', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' },
  card: { backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.03)', border: '1px solid #F0EAE1' },
  vehicleTag: { backgroundColor: '#F1F5F9', color: '#475569', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' },
  statusBadge: { padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' },
  actionBtn: { width: '100%', backgroundColor: '#16A34A', color: 'white', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: '0.2s' },
  emptyContainer: { backgroundColor: 'white', padding: '40px', textAlign: 'center', borderRadius: '12px', color: '#94A3B8', border: '1px dashed #CBD5E1' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '5px', borderRadius: '5px', display: 'flex', alignItems: 'center' },

  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '460px', boxShadow: '0 5px 15px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' },
  label: { fontWeight: 'bold', color: '#34495e', fontSize: '14px', marginBottom: '5px', display: 'block' },
  input: { width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #bdc3c7', fontSize: '16px', boxSizing: 'border-box' },
  submitBtn: { flex: 1, padding: '12px', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' },
  cancelBtn: { flex: 1, padding: '12px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' },
  filterSelect: { padding: '10px 15px', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', color: '#475569', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', outline: 'none', minWidth: '200px' }
};

export default Schedules;