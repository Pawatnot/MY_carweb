import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Expenses = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState(null);
  
  const [showCategoryModal, setShowCategoryModal] = useState(false); 
  const [showExpenseModal, setShowExpenseModal] = useState(false);   
  
  const [showDateModal, setShowDateModal] = useState(false);
  const [payingExpenseId, setPayingExpenseId] = useState(null);
  const [payingDate, setPayingDate] = useState('');

  const [categories, setCategories] = useState([]);
  const [myVehicles, setMyVehicles] = useState([]); 
  const [expensesList, setExpensesList] = useState([]); 
  
  const [expenseType, setExpenseType] = useState('ชิ้นส่วน'); 
  const [expenseName, setExpenseName] = useState('');         

  const [expenseForm, setExpenseForm] = useState({
    Vehicle_id: '', 
    expenses_type_id: '', 
    Amount_of_money: '', 
    Expense_Date: '', 
    Detail: '',
    payment_status: 0 
  });

  useEffect(() => {
    const adminStatus = localStorage.getItem('is_admin');
    const uId = localStorage.getItem('user_id');
    setIsAdmin(adminStatus === '1');
    setUserId(uId);
    
    if (uId) {
      fetchCategories();
      fetchMyVehicles(uId, adminStatus); 
      fetchExpensesList(uId, adminStatus); 
    }
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('http://localhost:5000/expense-categories');
      setCategories(response.data);
    } catch (error) { console.error(error); }
  };

  const fetchMyVehicles = async (uId, adminStatus) => {
    try {
      const response = await axios.get('http://localhost:5000/vehicles', { params: { user_id: uId, is_admin: adminStatus }});
      setMyVehicles(response.data);
    } catch (error) { console.error(error); }
  };

  const fetchExpensesList = async (uId, adminStatus) => {
    try {
      const response = await axios.get('http://localhost:5000/expenses', { params: { user_id: uId, is_admin: adminStatus }});
      setExpensesList(response.data);
    } catch (error) { console.error(error); }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/expense-categories', {
        is_document: expenseType === 'เอกสาร' ? 1 : 0, 
        expenses_type: expenseName 
      });
      alert("✅ เพิ่มประเภทเรียบร้อย");
      setShowCategoryModal(false);
      setExpenseName('');
      fetchCategories(); 
    } catch (error) { alert("❌ เกิดข้อผิดพลาด"); }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/expenses', expenseForm);
      alert("✅ บันทึกรายจ่ายสำเร็จ");
      setShowExpenseModal(false); 
      setExpenseForm({ Vehicle_id: '', expenses_type_id: '', Amount_of_money: '', Expense_Date: '', Detail: '', payment_status: 0 }); 
      fetchExpensesList(userId, isAdmin ? '1' : '0'); 
    } catch (error) { alert("❌ เกิดข้อผิดพลาดในการบันทึกรายจ่าย"); }
  };

  const togglePaidStatus = async (exp) => {
    if (exp.payment_status === 1) {
      try {
        await axios.put(`http://localhost:5000/expenses/${exp.Expenses_id}/status`, {
          payment_status: 0,
          Expense_Date: null
        });
        fetchExpensesList(userId, isAdmin ? '1' : '0'); 
      } catch (error) {
        console.error(error);
        alert("❌ เกิดข้อผิดพลาดในการอัปเดตสถานะ");
      }
    } else {
      setPayingExpenseId(exp.Expenses_id);
      setPayingDate('');
      setShowDateModal(true);
    }
  };

  const handleConfirmPayment = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:5000/expenses/${payingExpenseId}/status`, {
        payment_status: 1,
        Expense_Date: payingDate
      });
      setShowDateModal(false); 
      fetchExpensesList(userId, isAdmin ? '1' : '0'); 
    } catch (error) {
      console.error(error);
      alert("❌ เกิดข้อผิดพลาดในการอัปเดตสถานะ");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // ==========================================
  // ✅ โซนคำนวณยอดเงิน เดือนนี้ VS เดือนที่แล้ว
  // ==========================================
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  let thisMonthTotal = 0;
  let lastMonthTotal = 0;

  expensesList.forEach(exp => {
    // นับเฉพาะบิลที่จ่ายเงินแล้ว (payment_status === 1)
    if (exp.payment_status === 1 && exp.Expense_Date) {
      const expDate = new Date(exp.Expense_Date);
      const m = expDate.getMonth();
      const y = expDate.getFullYear();
      const amount = parseFloat(exp.Amount_of_money || 0);

      if (m === currentMonth && y === currentYear) {
        thisMonthTotal += amount;
      } else if (m === lastMonth && y === lastYear) {
        lastMonthTotal += amount;
      }
    }
  });

  return (
    <div style={{ padding: '30px', backgroundColor: '#F9F8F4', minHeight: '100vh', boxSizing: 'border-box' }}>
      
      {/* ================= 1. ส่วนหัว (สรุปยอด + ปุ่มเพิ่ม) ================= */}
      <div style={styles.topSection}>
        {/* กล่องสรุปยอดซ้ายมือ */}
        <div style={styles.summaryContainer}>
          {/* Card เดือนนี้ */}
          <div style={styles.summaryCard}>
            <div style={styles.iconCircle}>฿</div>
            <div>
              <div style={styles.summaryTitle}>ค่าใช้จ่ายรวมเดือนนี้</div>
              <div style={styles.summaryAmount}>{thisMonthTotal.toLocaleString()} <span style={styles.currency}>บาท</span></div>
            </div>
          </div>
          
          {/* Card เดือนก่อนหน้า */}
          <div style={styles.summaryCard}>
            <div style={styles.iconCircle}>฿</div>
            <div>
              <div style={styles.summaryTitle}>ค่าใช้จ่ายรวมเดือนก่อนหน้า</div>
              <div style={styles.summaryAmount}>{lastMonthTotal.toLocaleString()} <span style={styles.currency}>บาท</span></div>
            </div>
          </div>
        </div>

        {/* ปุ่มขวามือ */}
        <div style={styles.actionButtons}>
          <button onClick={() => setShowExpenseModal(true)} style={styles.addExpenseBtn}>➕ เพิ่มรายจ่าย</button>
          {isAdmin && (<button onClick={() => setShowCategoryModal(true)} style={styles.addCategoryBtn}>⚙️ ตั้งค่าประเภท</button>)}
        </div>
      </div>

      {/* ================= 2. พื้นที่สำหรับกราฟ (ตาม Design) ================= */}
      <div style={styles.graphPlaceholder}>
        <span style={{ fontSize: '40px', color: '#CBD5E1', zIndex: 2 }}>📊</span>
        <p style={styles.graphText}>กราฟแสดงรายจ่ายของเดือนนี้</p>
      </div>

      <hr style={{ borderTop: '2px dashed #E2E8F0', margin: '30px 0' }}/>
      <h2 style={{ color: '#2C3E50', marginBottom: '20px' }}>📋 รายการใช้จ่ายทั้งหมด</h2>

      {/* ================= 3. รายการ Card รายจ่าย ================= */}
      {expensesList.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: '50px', color: '#7f8c8d' }}><p>ยังไม่มีรายการรายจ่าย...</p></div>
      ) : (
        <div style={styles.grid}>
          {expensesList.map(exp => (
            <div key={exp.Expenses_id} style={{ ...styles.card, borderLeft: exp.payment_status === 1 ? '5px solid #16A34A' : '5px solid #DC2626' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={styles.categoryTag}>{exp.expenses_type}</span>
                <span style={{ fontWeight: 'bold', fontSize: '18px', color: '#2C3E50' }}>฿{exp.Amount_of_money}</span>
              </div>
              <h3 style={{ margin: '15px 0 5px 0', color: '#34495e' }}>{exp.Brand} {exp.Model}</h3>
              <p style={{ margin: '0', color: '#7f8c8d', fontSize: '13px' }}>ทะเบียน: {exp.vehicle_registration}</p>
              
              <p style={{ margin: '5px 0', color: '#34495e', fontSize: '14px', backgroundColor: '#F8FAFC', padding: '8px', borderRadius: '5px' }}>
                📝 หมายเหตุ: {exp.Detail || '-'}
              </p>

              {exp.payment_status === 1 ? (
                <p style={{ margin: '5px 0 15px 0', color: '#16A34A', fontSize: '14px', fontWeight: 'bold' }}>
                  📅 วันที่ชำระเงิน: {formatDate(exp.Expense_Date)}
                </p>
              ) : (
                <p style={{ margin: '5px 0 15px 0', color: '#DC2626', fontSize: '14px', fontWeight: 'bold' }}>
                  ⏳ ยังไม่ได้ชำระเงิน
                </p>
              )}

              <hr style={{ borderTop: '1px dashed #ecf0f1', margin: '10px 0' }}/>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 'bold', color: exp.payment_status === 1 ? '#16A34A' : '#DC2626' }}>
                <input type="checkbox" checked={exp.payment_status === 1} onChange={() => togglePaidStatus(exp)} style={{ transform: 'scale(1.5)' }} />
                {exp.payment_status === 1 ? '✅ จ่ายแล้ว' : '❌ ยังไม่จ่าย'}
              </label>
            </div>
          ))}
        </div>
      )}

      {/* ================= Modals ================= */}
      {/* Modal 1: ถามวันที่จ่ายเงิน */}
      {showDateModal && (
        <div style={styles.modalOverlay} onClick={() => setShowDateModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, borderBottom: '2px solid #16A34A', paddingBottom: '10px', color: '#2C3E50' }}>ยืนยันการชำระเงิน</h3>
            <form onSubmit={handleConfirmPayment} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
              <div><input type="date" required value={payingDate} onChange={e => setPayingDate(e.target.value)} style={styles.input}/></div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" style={{...styles.submitBtn, backgroundColor: '#16A34A'}}>บันทึกสถานะ</button>
                <button type="button" onClick={() => setShowDateModal(false)} style={styles.cancelBtn}>ยกเลิก</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: เพิ่มรายจ่าย */}
      {showExpenseModal && (
        <div style={styles.modalOverlay} onClick={() => setShowExpenseModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, borderBottom: '2px solid #3498db', paddingBottom: '10px' }}>บันทึกรายจ่ายใหม่</h3>
            <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
              <div>
                <label style={styles.label}>1. เลือกยานพาหนะ</label>
                <select required style={styles.input} onChange={e => setExpenseForm({...expenseForm, Vehicle_id: e.target.value})}>
                  <option value="">-- กรุณาเลือกรถ --</option>
                  {myVehicles.map(v => <option key={v.Vehicle_id} value={v.Vehicle_id}>{v.Brand} {v.Model} ({v.vehicle_registration})</option>)}
                </select>
              </div>
              <div>
                <label style={styles.label}>2. ประเภทรายจ่าย</label>
                <select required style={styles.input} onChange={e => setExpenseForm({...expenseForm, expenses_type_id: e.target.value})}>
                  <option value="">-- กรุณาเลือกประเภท --</option>
                  {categories.map((cat) => (
                    <option key={cat.expenses_type_id} value={cat.expenses_type_id}>{cat.expenses_type}</option>
                  ))}
                </select>
              </div>
              <div><label style={styles.label}>3. จำนวนเงิน (บาท)</label><input type="number" required min="0" style={styles.input} onChange={e => setExpenseForm({...expenseForm, Amount_of_money: e.target.value})}/></div>
              <div><label style={styles.label}>4. รายละเอียดเพิ่มเติม</label><input type="text" placeholder="เช่น เปลี่ยนที่ร้าน ABC, โอนผ่านแบงค์" style={styles.input} onChange={e => setExpenseForm({...expenseForm, Detail: e.target.value})}/></div>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '10px' }}>
                <input type="checkbox" style={{ transform: 'scale(1.2)' }} onChange={e => setExpenseForm({...expenseForm, payment_status: e.target.checked ? 1 : 0, Expense_Date: ''})} />
                <span style={{fontWeight: 'bold', color: '#34495e'}}>ชำระเงินเรียบร้อยแล้ว</span>
              </label>

              {expenseForm.payment_status === 1 && (
                <div style={{ padding: '10px', backgroundColor: '#f1f2f6', borderRadius: '8px' }}>
                  <label style={styles.label}>ระบุวันที่ชำระเงิน</label>
                  <input type="date" required style={styles.input} onChange={e => setExpenseForm({...expenseForm, Expense_Date: e.target.value})}/>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" style={{...styles.submitBtn, backgroundColor: '#3498db'}}>บันทึก</button>
                <button type="button" onClick={() => setShowExpenseModal(false)} style={styles.cancelBtn}>ยกเลิก</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: เพิ่มประเภท */}
      {showCategoryModal && (
        <div style={styles.modalOverlay} onClick={() => setShowCategoryModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, borderBottom: '2px solid #27ae60', paddingBottom: '10px', color: '#2c3e50' }}>เพิ่มประเภทรายจ่าย</h3>
            <form onSubmit={handleAddCategory} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
              <div>
                <label style={styles.label}>1. หมวดหมู่รายจ่าย:</label>
                <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
                  <label style={styles.checkboxLabel}><input type="checkbox" checked={expenseType === 'ชิ้นส่วน'} onChange={() => setExpenseType('ชิ้นส่วน')} style={{ transform: 'scale(1.3)' }}/>⚙️ ชิ้นส่วน</label>
                  <label style={styles.checkboxLabel}><input type="checkbox" checked={expenseType === 'เอกสาร'} onChange={() => setExpenseType('เอกสาร')} style={{ transform: 'scale(1.3)' }}/>📄 เอกสาร</label>
                </div>
              </div>
              <div><label style={styles.label}>2. ชื่อประเภท:</label><input type="text" required value={expenseName} onChange={(e) => setExpenseName(e.target.value)} style={styles.input}/></div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" style={{...styles.submitBtn, backgroundColor: '#27ae60'}}>บันทึก</button>
                <button type="button" onClick={() => setShowCategoryModal(false)} style={styles.cancelBtn}>ยกเลิก</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// 🎨 Styles
const styles = {
  // สไตล์สำหรับ Section ด้านบน (สรุปยอด + ปุ่ม)
  topSection: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', marginBottom: '25px' },
  summaryContainer: { display: 'flex', gap: '20px', flexWrap: 'wrap' },
  summaryCard: { backgroundColor: '#FFFFFF', padding: '20px 25px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #F0EAE1', minWidth: '280px' },
  iconCircle: { width: '55px', height: '55px', backgroundColor: '#E07A5F', color: 'white', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '28px', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(224, 122, 95, 0.3)' },
  summaryTitle: { color: '#8A7D72', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' },
  summaryAmount: { color: '#2C3E50', fontSize: '32px', fontWeight: 'bold', margin: 0 },
  currency: { fontSize: '16px', color: '#94A3B8', fontWeight: 'normal' },
  actionButtons: { display: 'flex', gap: '10px' },
  addExpenseBtn: { backgroundColor: '#2C3E50', color: 'white', border: 'none', padding: '12px 25px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
  addCategoryBtn: { backgroundColor: '#FFFFFF', color: '#2C3E50', border: '2px solid #2C3E50', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' },
  
  // สไตล์สำหรับพื้นที่ใส่กราฟ
  graphPlaceholder: { backgroundColor: '#FFFFFF', border: '2px dashed #CBD5E1', height: '220px', borderRadius: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden' },
  graphText: { zIndex: 2, color: '#64748B', fontWeight: 'bold', marginTop: '10px', fontSize: '16px' },

  // สไตล์ของ Card เดิม
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' },
  card: { backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.04)', transition: 'transform 0.2s' },
  categoryTag: { backgroundColor: '#F1F5F9', color: '#475569', padding: '5px 10px', borderRadius: '5px', fontSize: '12px', fontWeight: 'bold' },
  
  // สไตล์ของ Modal
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '450px', boxShadow: '0 5px 15px rgba(0,0,0,0.2)' },
  label: { fontWeight: 'bold', color: '#34495e', fontSize: '14px', marginBottom: '5px', display: 'block' },
  checkboxLabel: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '16px' },
  input: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #bdc3c7', fontSize: '16px', boxSizing: 'border-box' },
  submitBtn: { flex: 1, padding: '12px', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' },
  cancelBtn: { flex: 1, padding: '12px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }
};

export default Expenses;