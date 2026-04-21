import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Expenses = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState(null);
  
  const [showCategoryModal, setShowCategoryModal] = useState(false); 
  const [showExpenseModal, setShowExpenseModal] = useState(false);   
  
  // ✅ State สำหรับหน้าต่างยืนยันวันที่จ่ายเงินจาก Card
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

  // ==========================================
  // ✅ ระบบอัปเดตสถานะจาก Card
  // ==========================================
  const togglePaidStatus = async (exp) => {
    if (exp.payment_status === 1) {
      // ถ้าจ่ายแล้ว แล้วกดติ๊กออก (เปลี่ยนเป็นยังไม่จ่าย) ให้ทำทันทีโดยลบวันที่ทิ้ง
      try {
        await axios.put(`http://localhost:5000/expenses/${exp.Expenses_id}/status`, {
          payment_status: 0,
          Expense_Date: null
        });
        fetchExpensesList(userId, isAdmin ? '1' : '0'); // โหลดข้อมูลใหม่
      } catch (error) {
        console.error(error);
        alert("❌ เกิดข้อผิดพลาดในการอัปเดตสถานะ");
      }
    } else {
      // ถ้ายังไม่จ่าย พอกดปุ๊บ ให้เปิดหน้าต่างถามวันที่
      setPayingExpenseId(exp.Expenses_id);
      setPayingDate('');
      setShowDateModal(true);
    }
  };

  // ✅ ฟังก์ชันตอนกดยืนยันวันที่ในหน้าต่างเล็ก
  const handleConfirmPayment = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:5000/expenses/${payingExpenseId}/status`, {
        payment_status: 1,
        Expense_Date: payingDate
      });
      setShowDateModal(false); // ปิดหน้าต่าง
      fetchExpensesList(userId, isAdmin ? '1' : '0'); // โหลดข้อมูลใหม่
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

  return (
    <div style={{ padding: '20px' }}>
      <div style={styles.headerContainer}>
        <h2 style={{ color: '#2c3e50', margin: 0 }}>รายการรายจ่ายของฉัน</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setShowExpenseModal(true)} style={styles.addExpenseBtn}>➕ เพิ่มรายจ่าย</button>
          {isAdmin && (<button onClick={() => setShowCategoryModal(true)} style={styles.addCategoryBtn}>⚙️ ตั้งค่าประเภทรายจ่าย</button>)}
        </div>
      </div>

      {expensesList.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: '50px', color: '#7f8c8d' }}><p>ยังไม่มีรายการรายจ่าย...</p></div>
      ) : (
        <div style={styles.grid}>
          {expensesList.map(exp => (
            <div key={exp.Expenses_id} style={{ ...styles.card, borderLeft: exp.payment_status === 1 ? '5px solid #27ae60' : '5px solid #e74c3c' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={styles.categoryTag}>{exp.expenses_type}</span>
                <span style={{ fontWeight: 'bold', fontSize: '18px', color: '#2c3e50' }}>฿{exp.Amount_of_money}</span>
              </div>
              <h3 style={{ margin: '15px 0 5px 0', color: '#34495e' }}>{exp.Brand} {exp.Model}</h3>
              <p style={{ margin: '0', color: '#7f8c8d', fontSize: '13px' }}>ทะเบียน: {exp.vehicle_registration}</p>
              
              <p style={{ margin: '5px 0', color: '#34495e', fontSize: '14px', backgroundColor: '#f9f9f9', padding: '8px', borderRadius: '5px' }}>
                📝 หมายเหตุ: {exp.Detail || '-'}
              </p>

              {exp.payment_status === 1 ? (
                <p style={{ margin: '5px 0 15px 0', color: '#27ae60', fontSize: '14px', fontWeight: 'bold' }}>
                  📅 วันที่ชำระเงิน: {formatDate(exp.Expense_Date)}
                </p>
              ) : (
                <p style={{ margin: '5px 0 15px 0', color: '#e74c3c', fontSize: '14px', fontWeight: 'bold' }}>
                  ⏳ ยังไม่ได้ชำระเงิน
                </p>
              )}

              <hr style={{ borderTop: '1px dashed #ecf0f1', margin: '10px 0' }}/>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 'bold', color: exp.payment_status === 1 ? '#27ae60' : '#e74c3c' }}>
                {/* ✅ แก้ฟังก์ชันตรง Checkbox ให้ส่งค่า exp เข้าไปทั้งก้อน */}
                <input type="checkbox" checked={exp.payment_status === 1} onChange={() => togglePaidStatus(exp)} style={{ transform: 'scale(1.5)' }} />
                {exp.payment_status === 1 ? '✅ จ่ายแล้ว' : '❌ ยังไม่จ่าย'}
              </label>
            </div>
          ))}
        </div>
      )}

      {/* ==========================================
          ✅ Modal: ถามวันที่เมื่อกด Checkbox จ่ายเงินจาก Card
          ========================================== */}
      {showDateModal && (
        <div style={styles.modalOverlay} onClick={() => setShowDateModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, borderBottom: '2px solid #27ae60', paddingBottom: '10px', color: '#2c3e50' }}>ยืนยันการชำระเงิน</h3>
            <p style={{ color: '#7f8c8d', fontSize: '14px' }}>กรุณาระบุวันที่คุณทำการชำระเงินรายการนี้</p>
            
            <form onSubmit={handleConfirmPayment} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
              <div>
                <input type="date" required value={payingDate} onChange={e => setPayingDate(e.target.value)} style={styles.input}/>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" style={{...styles.submitBtn, backgroundColor: '#27ae60'}}>บันทึกสถานะ</button>
                <button type="button" onClick={() => setShowDateModal(false)} style={styles.cancelBtn}>ยกเลิก</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 1: เพิ่มรายจ่าย */}
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
                <input 
                  type="checkbox" 
                  style={{ transform: 'scale(1.2)' }} 
                  onChange={e => setExpenseForm({...expenseForm, payment_status: e.target.checked ? 1 : 0, Expense_Date: ''})} 
                />
                <span style={{fontWeight: 'bold', color: '#34495e'}}>ชำระเงินเรียบร้อยแล้ว</span>
              </label>

              {expenseForm.payment_status === 1 && (
                <div style={{ padding: '10px', backgroundColor: '#f1f2f6', borderRadius: '8px' }}>
                  <label style={styles.label}>ระบุวันที่ชำระเงิน</label>
                  <input type="date" required style={styles.input} onChange={e => setExpenseForm({...expenseForm, Expense_Date: e.target.value})}/>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" style={{...styles.submitBtn, backgroundColor: '#3498db'}}>บันทึกรายจ่าย</button>
                <button type="button" onClick={() => setShowExpenseModal(false)} style={styles.cancelBtn}>ยกเลิก</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: เพิ่มประเภท (Admin) */}
      {showCategoryModal && (
        <div style={styles.modalOverlay} onClick={() => setShowCategoryModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, borderBottom: '2px solid #27ae60', paddingBottom: '10px', color: '#2c3e50' }}>เพิ่มประเภทรายจ่ายใหม่</h3>
            <form onSubmit={handleAddCategory} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
              <div>
                <label style={styles.label}>1. หมวดหมู่รายจ่าย:</label>
                <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
                  <label style={styles.checkboxLabel}><input type="checkbox" checked={expenseType === 'ชิ้นส่วน'} onChange={() => setExpenseType('ชิ้นส่วน')} style={{ transform: 'scale(1.3)' }}/>⚙️ ชิ้นส่วนยานพาหนะ</label>
                  <label style={styles.checkboxLabel}><input type="checkbox" checked={expenseType === 'เอกสาร'} onChange={() => setExpenseType('เอกสาร')} style={{ transform: 'scale(1.3)' }}/>📄 เอกสาร/อื่นๆ</label>
                </div>
              </div>
              <div><label style={styles.label}>2. ชื่อประเภทรายจ่าย:</label><input type="text" required placeholder="เช่น ค่าน้ำมัน, ต่อภาษี, เปลี่ยนยาง..." value={expenseName} onChange={(e) => setExpenseName(e.target.value)} style={styles.input}/></div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" style={styles.submitBtn}>บันทึกข้อมูล</button>
                <button type="button" onClick={() => setShowCategoryModal(false)} style={styles.cancelBtn}>ยกเลิก</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  headerContainer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' },
  addExpenseBtn: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#3498db', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '30px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' },
  addCategoryBtn: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#fff', border: '2px solid #27ae60', color: '#27ae60', padding: '8px 20px', borderRadius: '30px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginTop: '20px' },
  card: { backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', transition: 'transform 0.2s' },
  categoryTag: { backgroundColor: '#f1f2f6', color: '#57606f', padding: '5px 10px', borderRadius: '5px', fontSize: '12px', fontWeight: 'bold' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '450px', boxShadow: '0 5px 15px rgba(0,0,0,0.2)' },
  label: { fontWeight: 'bold', color: '#34495e', fontSize: '14px', marginBottom: '5px', display: 'block' },
  checkboxLabel: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '16px' },
  input: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #bdc3c7', fontSize: '16px', boxSizing: 'border-box' },
  submitBtn: { flex: 1, padding: '12px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' },
  cancelBtn: { flex: 1, padding: '12px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }
};

export default Expenses;