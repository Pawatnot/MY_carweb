import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Expenses = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState(null);
  
  const [showCategoryModal, setShowCategoryModal] = useState(false); 
  const [showExpenseModal, setShowExpenseModal] = useState(false);   
  const [showEditModal, setShowEditModal] = useState(false);
  
  const [editData, setEditData] = useState({
    Expenses_id: '', Vehicle_id: '', expenses_type_id: '', Amount_of_money: '', Detail: '', current_receipt: ''
  });
  const [editReceiptFile, setEditReceiptFile] = useState(null);
  
  const [showDateModal, setShowDateModal] = useState(false);
  const [payingExpenseId, setPayingExpenseId] = useState(null);
  const [payingDate, setPayingDate] = useState('');

  const [categories, setCategories] = useState([]);
  const [myVehicles, setMyVehicles] = useState([]); 
  const [expensesList, setExpensesList] = useState([]);
  
  const [activeTab, setActiveTab] = useState('all'); 
  const [expenseName, setExpenseName] = useState('');        

  const [billData, setBillData] = useState({ Vehicle_id: '', payment_status: 0, Expense_Date: '' });
  const [receiptFile, setReceiptFile] = useState(null); 

  const [expenseItems, setExpenseItems] = useState([
    { expenses_type_id: '', Amount_of_money: '', Detail: '', isAutoSchedule: false, nextExpiryDate: '' }
  ]);
  
  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState(''); 

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

  // ✅ ฟังก์ชันส่งคำร้องขอเพิ่มประเภทรายจ่ายใหม่
  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/notifications', { 
        Type: 'ประเภทรายจ่าย',
        Message: expenseName 
      });
      alert("ส่งคำร้องไปยังแอดมินเรียบร้อยแล้ว");
      setShowCategoryModal(false); 
      setExpenseName('');
    } catch (error) { alert("เกิดข้อผิดพลาดในการส่งคำร้อง"); }
  };

  const handleAddItem = () => setExpenseItems([...expenseItems, { expenses_type_id: '', Amount_of_money: '', Detail: '', isAutoSchedule: false, nextExpiryDate: '' }]);
  const handleRemoveItem = (index) => { if (expenseItems.length > 1) setExpenseItems(expenseItems.filter((_, i) => i !== index)); };
  const handleItemChange = (index, field, value) => {
    const newItems = [...expenseItems];
    newItems[index][field] = value;
    setExpenseItems(newItems);
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (billData.payment_status === 1 && !receiptFile) {
      return alert("กรุณาแนบภาพใบเสร็จเพื่อเป็นหลักฐานการชำระเงิน"); 
    }

    try {
      await Promise.all(expenseItems.map(async (item) => {
        const formData = new FormData();
        formData.append('Vehicle_id', billData.Vehicle_id);
        formData.append('payment_status', billData.payment_status);
        formData.append('Expense_Date', billData.Expense_Date);
        formData.append('expenses_type_id', item.expenses_type_id);
        formData.append('Amount_of_money', item.Amount_of_money);
        formData.append('Detail', item.Detail);
        if (receiptFile) formData.append('receipt_image', receiptFile);

        const expenseRes = await axios.post('http://localhost:5000/expenses', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        const newExpenseId = expenseRes.data.insertId;

        if (item.isAutoSchedule && item.nextExpiryDate) {
          const selectedCat = categories.find(c => c.expenses_type_id == item.expenses_type_id);
          const itemName = selectedCat ? selectedCat.expenses_type : 'บำรุงรักษารถยนต์';
          await axios.post('http://localhost:5000/schedules', { Vehicle_id: billData.Vehicle_id, expenses_id: newExpenseId, Item_Name: itemName, Expiry_Date: item.nextExpiryDate });
        }
      }));

      alert("บันทึกข้อมูลสำเร็จ!");
      setShowExpenseModal(false); 
      setBillData({ Vehicle_id: '', payment_status: 0, Expense_Date: '' });
      setReceiptFile(null);
      setExpenseItems([{ expenses_type_id: '', Amount_of_money: '', Detail: '', isAutoSchedule: false, nextExpiryDate: '' }]);
      fetchExpensesList(userId, isAdmin ? '1' : '0'); 
    } catch (error) { alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล"); }
  };

  const handleOpenEdit = (exp) => {
    setEditData({
      Expenses_id: exp.Expenses_id,
      Vehicle_id: exp.Vehicle_id ? exp.Vehicle_id.toString() : '',
      expenses_type_id: exp.expenses_type_id ? exp.expenses_type_id.toString() : '',
      Amount_of_money: exp.Amount_of_money || '',
      Detail: exp.Detail || '',
      current_receipt: exp.receipt_image || ''
    });
    setEditReceiptFile(null);
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('Vehicle_id', editData.Vehicle_id);
      formData.append('expenses_type_id', editData.expenses_type_id);
      formData.append('Amount_of_money', editData.Amount_of_money);
      formData.append('Detail', editData.Detail);
      if (editReceiptFile) formData.append('receipt_image', editReceiptFile);

      await axios.put(`http://localhost:5000/expenses/${editData.Expenses_id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert("แก้ไขข้อมูลสำเร็จ!");
      setShowEditModal(false);
      fetchExpensesList(userId, isAdmin ? '1' : '0');
    } catch (error) { alert("เกิดข้อผิดพลาดในการแก้ไขข้อมูล"); }
  };

  const handleDelete = async (id) => {
    if (window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบรายจ่ายนี้?")) {
      try {
        await axios.delete(`http://localhost:5000/expenses/${id}`);
        fetchExpensesList(userId, isAdmin ? '1' : '0');
      } catch (error) { alert("เกิดข้อผิดพลาดในการลบ"); }
    }
  };

  const togglePaidStatus = async (exp) => {
    if (exp.payment_status === 1) {
      try {
        const formData = new FormData();
        formData.append('payment_status', 0);
        formData.append('Expense_Date', '');
        
        await axios.put(`http://localhost:5000/expenses/${exp.Expenses_id}/status`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        fetchExpensesList(userId, isAdmin ? '1' : '0'); 
      } catch (error) { alert("เกิดข้อผิดพลาด"); }
    } else {
      setPayingExpenseId(exp.Expenses_id); 
      setPayingDate(''); 
      setReceiptFile(null); 
      setShowDateModal(true);
    }
  };

  const handleConfirmPayment = async (e) => {
    e.preventDefault();
    if (!receiptFile) {
      return alert("กรุณาแนบภาพสลิป/ใบเสร็จเพื่อยืนยันการชำระเงิน");
    }

    try {
      const formData = new FormData();
      formData.append('payment_status', 1);
      formData.append('Expense_Date', payingDate);
      formData.append('receipt_image', receiptFile);

      await axios.put(`http://localhost:5000/expenses/${payingExpenseId}/status`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setShowDateModal(false); 
      setReceiptFile(null); 
      fetchExpensesList(userId, isAdmin ? '1' : '0'); 
    } catch (error) { alert("เกิดข้อผิดพลาด"); }
  };

  const filteredExpenses = expensesList.filter(expense => {
    if (selectedVehicleFilter !== '' && expense.vehicle_registration !== selectedVehicleFilter) return false;
    if (selectedCategoryFilter !== '' && expense.expenses_type_id?.toString() !== selectedCategoryFilter) return false;
    if (activeTab === 'paid') return expense.payment_status === 1;
    if (activeTab === 'unpaid') return expense.payment_status === 0;
    return true; 
  });

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const monthsToShow = 5;
  const monthNames = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  const chartDataMap = {};

  for (let i = monthsToShow - 1; i >= 0; i--) {
    const d = new Date(currentYear, currentMonth - i, 1);
    const m = d.getMonth();
    const y = d.getFullYear();
    chartDataMap[`${y}-${m}`] = { name: `${monthNames[m]} ${(y + 543).toString().slice(-2)}`, total: 0 };
  }

  expensesList.forEach(exp => {
    if (exp.payment_status === 1 && exp.Expense_Date) {
      const expDate = new Date(exp.Expense_Date);
      const key = `${expDate.getFullYear()}-${expDate.getMonth()}`;
      if (chartDataMap[key]) chartDataMap[key].total += parseFloat(exp.Amount_of_money || 0);
    }
  });
  const chartData = Object.values(chartDataMap);

  return (
    <div style={{ padding: '30px', backgroundColor: '#F9F8F4', minHeight: '100vh', boxSizing: 'border-box' }}>
      <div style={styles.topSection}>
        <h2 style={{ color: '#2C3E50', margin: 0 }}>ระบบบันทึกรายจ่าย</h2>
        <button onClick={() => setShowExpenseModal(true)} style={styles.addExpenseBtn}>เพิ่มรายจ่ายใหม่</button>
      </div>

      <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 10px rgba(0,0,0,0.03)', border: '1px solid #F0EAE1', marginBottom: '30px' }}>
        <h3 style={{ color: '#2C3E50', marginTop: 0, marginBottom: '20px' }}>กราฟสรุปรายจ่าย 5 เดือนล่าสุด</h3>
        <div style={{ height: '300px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} />
              <Tooltip cursor={{ fill: '#F8FAFC' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="total" fill="#3498db" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <hr style={{ borderTop: '2px dashed #E2E8F0', margin: '30px 0' }}/>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '15px' }}>
        <h2 style={{ color: '#2C3E50', margin: 0 }}>รายการใช้จ่ายทั้งหมด</h2>
        <div style={styles.tabContainer}>
          <button onClick={() => setActiveTab('all')} style={activeTab === 'all' ? styles.activeTabAll : styles.inactiveTab}>ทั้งหมด</button>
          <button onClick={() => setActiveTab('unpaid')} style={activeTab === 'unpaid' ? styles.activeTabUnpaid : styles.inactiveTab}>ยังไม่จ่าย</button>
          <button onClick={() => setActiveTab('paid')} style={activeTab === 'paid' ? styles.activeTabPaid : styles.inactiveTab}>จ่ายแล้ว</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', flexWrap: 'wrap' }}>
        <select style={styles.filterSelect} value={selectedVehicleFilter} onChange={(e) => setSelectedVehicleFilter(e.target.value)}>
          <option value="">-- ยานพาหนะทั้งหมด --</option>
          {myVehicles.map(v => <option key={v.Vehicle_id} value={v.vehicle_registration}>{v.vehicle_registration} ({v.Brand})</option>)}
        </select>
        <select style={styles.filterSelect} value={selectedCategoryFilter} onChange={(e) => setSelectedCategoryFilter(e.target.value)}>
          <option value="">-- ประเภทรายจ่ายทั้งหมด --</option>
          {categories.map(cat => <option key={cat.expenses_type_id} value={cat.expenses_type_id.toString()}>{cat.expenses_type}</option>)}
        </select>
      </div>

      {filteredExpenses.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: '50px', color: '#7f8c8d' }}><p>ไม่มีรายการที่ค้นหาในหมวดหมู่นี้...</p></div>
      ) : (
        <div style={styles.grid}>
          {filteredExpenses.map(exp => (
            <div key={exp.Expenses_id} style={{ ...styles.card, borderLeft: exp.payment_status === 1 ? '5px solid #16A34A' : '5px solid #DC2626' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={styles.categoryTag}>{exp.expenses_type}</span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', fontSize: '18px', color: '#2C3E50', marginRight: '5px' }}>฿{exp.Amount_of_money}</span>
  
                <button onClick={() => handleOpenEdit(exp)} style={{...styles.editIconBtn, color: '#f39c12'}} title="แก้ไข">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>

                <button onClick={() => handleDelete(exp.Expenses_id)} style={{...styles.deleteIconBtn, color: '#e74c3c'}} title="ลบ">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
                </div>
              </div>

              <h3 style={{ margin: '15px 0 5px 0', color: '#34495e' }}>{exp.Brand} {exp.Model}</h3>
              <p style={{ margin: '0', color: '#7f8c8d', fontSize: '13px' }}>ทะเบียน: {exp.vehicle_registration}</p>
              
              <p style={{ margin: '10px 0', color: '#34495e', fontSize: '14px', backgroundColor: '#F8FAFC', padding: '8px', borderRadius: '5px' }}>
                หมายเหตุ: {exp.Detail || '-'}
              </p>

              {exp.receipt_image && (
                <a href={`http://localhost:5000/uploads/${exp.receipt_image}`} target="_blank" rel="noreferrer" style={styles.receiptLink}>
                  📄 ดูใบเสร็จรับเงิน
                </a>
              )}

              {exp.payment_status === 1 ? (
                <p style={{ margin: '5px 0 15px 0', color: '#16A34A', fontSize: '14px', fontWeight: 'bold' }}>วันที่ชำระเงิน: {formatDate(exp.Expense_Date)}</p>
              ) : (
                <p style={{ margin: '5px 0 15px 0', color: '#DC2626', fontSize: '14px', fontWeight: 'bold' }}>ยังไม่ได้ชำระเงิน</p>
              )}

              <hr style={{ borderTop: '1px dashed #ecf0f1', margin: '10px 0' }}/>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 'bold', color: exp.payment_status === 1 ? '#16A34A' : '#DC2626' }}>
                <input type="checkbox" checked={exp.payment_status === 1} onChange={() => togglePaidStatus(exp)} style={{ transform: 'scale(1.5)' }} />
                {exp.payment_status === 1 ? 'จ่ายแล้ว' : 'ยังไม่จ่าย'}
              </label>
            </div>
          ))}
        </div>
      )}

      {/* Modal แก้ไขข้อมูล */}
      {showEditModal && (
        <div style={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, borderBottom: '2px solid #f39c12', paddingBottom: '10px', color: '#2c3e50' }}>แก้ไขข้อมูลรายจ่าย</h3>
            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
              <div>
                <label style={styles.label}>ยานพาหนะ</label>
                <select required style={styles.input} value={editData.Vehicle_id} onChange={e => setEditData({...editData, Vehicle_id: e.target.value})}>
                  <option value="">-- กรุณาเลือกรถ --</option>
                  {myVehicles.map(v => <option key={v.Vehicle_id} value={v.Vehicle_id}>{v.Brand} {v.Model} ({v.vehicle_registration})</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={styles.label}>ประเภท</label>
                  <select required style={styles.input} value={editData.expenses_type_id} onChange={e => setEditData({...editData, expenses_type_id: e.target.value})}>
                    <option value="">-- เลือก --</option>
                    {categories.map((cat) => (
                        <option key={cat.expenses_type_id} value={cat.expenses_type_id}>{cat.expenses_type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={styles.label}>จำนวนเงิน</label>
                  <input type="number" required min="0" style={styles.input} value={editData.Amount_of_money} onChange={e => setEditData({...editData, Amount_of_money: e.target.value})}/>
                </div>
              </div>

              <div>
                <label style={styles.label}>รายละเอียด</label>
                <input type="text" style={styles.input} value={editData.Detail} onChange={e => setEditData({...editData, Detail: e.target.value})}/>
              </div>

              <div>
                <label style={styles.label}>รูปใบเสร็จ (เลือกใหม่เพื่อเปลี่ยน)</label>
                {editData.current_receipt && !editReceiptFile && (
                  <div style={{ marginBottom: '10px' }}>
                    <img src={`http://localhost:5000/uploads/${editData.current_receipt}`} alt="Receipt" style={{ width: '100px', borderRadius: '5px', border: '1px solid #ccc' }} />
                  </div>
                )}
                <input type="file" accept="image/*" style={styles.input} onChange={e => setEditReceiptFile(e.target.files[0])} />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" style={{...styles.submitBtn, backgroundColor: '#f39c12'}}>บันทึกการแก้ไข</button>
                <button type="button" onClick={() => setShowEditModal(false)} style={styles.cancelBtn}>ยกเลิก</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal ยืนยันชำระเงิน */}
      {showDateModal && (
        <div style={styles.modalOverlay} onClick={() => { setShowDateModal(false); setReceiptFile(null); }}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, borderBottom: '2px solid #16A34A', paddingBottom: '10px', color: '#2C3E50' }}>ยืนยันการชำระเงิน</h3>
            <form onSubmit={handleConfirmPayment} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
              <div>
                <label style={styles.label}>วันที่ชำระเงิน <span style={{color: 'red'}}>*</span></label>
                <input type="date" required value={payingDate} onChange={e => setPayingDate(e.target.value)} style={styles.input}/>
              </div>
              
              <div>
                <label style={styles.label}>แนบสลิป/ใบเสร็จ <span style={{color: 'red'}}>*</span></label>
                <input type="file" required accept="image/*" onChange={e => setReceiptFile(e.target.files[0])} style={styles.input} />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" style={{...styles.submitBtn, backgroundColor: '#16A34A'}}>บันทึกสถานะ</button>
                <button type="button" onClick={() => { setShowDateModal(false); setReceiptFile(null); }} style={styles.cancelBtn}>ยกเลิก</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal บันทึกรายจ่ายใหม่ */}
      {showExpenseModal && (
        <div style={styles.modalOverlay} onClick={() => { setShowExpenseModal(false); setReceiptFile(null); }}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, borderBottom: '2px solid #3498db', paddingBottom: '10px' }}>บันทึกรายจ่าย</h3>
            <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
              
              <div style={{ padding: '15px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#2C3E50' }}>ข้อมูลหลัก</h4>
                <div style={{ marginBottom: '10px' }}>
                  <label style={styles.label}>ยานพาหนะ</label>
                  <select required style={styles.input} value={billData.Vehicle_id} onChange={e => setBillData({...billData, Vehicle_id: e.target.value})}>
                    <option value="">-- กรุณาเลือกรถ --</option>
                    {myVehicles.map(v => <option key={v.Vehicle_id} value={v.Vehicle_id}>{v.Brand} {v.Model} ({v.vehicle_registration})</option>)}
                  </select>
                </div>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '10px' }}>
                  <input type="checkbox" checked={billData.payment_status === 1} onChange={e => {
                    setBillData({...billData, payment_status: e.target.checked ? 1 : 0, Expense_Date: ''});
                    if (!e.target.checked) setReceiptFile(null); 
                  }} style={{ transform: 'scale(1.2)' }} />
                  <span style={{fontWeight: 'bold', color: '#34495e'}}>ชำระเงินเรียบร้อยแล้ว</span>
                </label>

                {billData.payment_status === 1 && (
                  <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#F0FDF4', borderRadius: '8px', border: '1px dashed #BBF7D0' }}>
                    <div style={{ marginBottom: '10px' }}>
                      <label style={styles.label}>วันที่ชำระเงิน <span style={{color: 'red'}}>*</span></label>
                      <input type="date" required style={styles.input} value={billData.Expense_Date} onChange={e => setBillData({...billData, Expense_Date: e.target.value})}/>
                    </div>
                    <div>
                      <label style={styles.label}>ภาพใบเสร็จรับเงิน <span style={{color: 'red'}}>*</span></label>
                      <input type="file" required accept="image/*" style={styles.input} onChange={e => setReceiptFile(e.target.files[0])} />
                    </div>
                  </div>
                )}
              </div>

              <h4 style={{ margin: '10px 0 0 0', color: '#2C3E50' }}>รายการค่าใช้จ่ายในบิลนี้</h4>
              {expenseItems.map((item, index) => (
                <div key={index} style={{ padding: '15px', backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #CBD5E1', position: 'relative' }}>
                  {expenseItems.length > 1 && (
                    <button type="button" onClick={() => handleRemoveItem(index)} style={{ position: 'absolute', top: '10px', right: '10px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '50%', width: '25px', height: '25px', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
                  )}
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                    <div>
                      <label style={styles.label}>ประเภท</label>
                      <select required style={styles.input} value={item.expenses_type_id} onChange={e => {
                        // ✅ ถ้าเลือกอันล่างสุด ให้เด้ง Modal ขอเพิ่มหมวดหมู่
                        if (e.target.value === 'request_new') {
                          setShowCategoryModal(true);
                        } else {
                          handleItemChange(index, 'expenses_type_id', e.target.value);
                        }
                      }}>
                        <option value="">-- เลือก --</option>
                        {categories.filter(cat => cat.is_active !== 0).map((cat) => (
                            <option key={cat.expenses_type_id} value={cat.expenses_type_id}>{cat.expenses_type}</option>
                        ))}
                        {/* ✅ เพิ่มตัวเลือก "หาไม่พบ แจ้งแอดมิน" กลับมาแล้วครับ! */}
                        {!isAdmin && (
                          <option value="request_new" style={{ fontWeight: 'bold', color: '#e74c3c' }}>
                            หาไม่พบ? แจ้งแอดมินเพิ่มข้อมูล
                          </option>
                        )}
                      </select>
                    </div>
                    <div>
                      <label style={styles.label}>จำนวนเงิน</label>
                      <input type="number" required min="0" placeholder="0" style={styles.input} value={item.Amount_of_money} onChange={e => handleItemChange(index, 'Amount_of_money', e.target.value)}/>
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: '10px' }}>
                    <label style={styles.label}>รายละเอียด</label>
                    <input type="text" placeholder="เช่น เปลี่ยนผ้าเบรคหน้า" style={styles.input} value={item.Detail} onChange={e => handleItemChange(index, 'Detail', e.target.value)}/>
                  </div>

                  <div style={{ padding: '10px', backgroundColor: '#F0FDF4', borderRadius: '8px', border: '1px solid #BBF7D0' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={item.isAutoSchedule} onChange={e => handleItemChange(index, 'isAutoSchedule', e.target.checked)} style={{ transform: 'scale(1.2)' }} />
                      <span style={{fontWeight: 'bold', color: '#16A34A', fontSize: '13px'}}>ตั้งเตือนรอบถัดไปอัตโนมัติ</span>
                    </label>
                    {item.isAutoSchedule && (
                      <div style={{ marginTop: '10px' }}>
                        <input type="date" required style={styles.input} value={item.nextExpiryDate} onChange={e => handleItemChange(index, 'nextExpiryDate', e.target.value)}/>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <button type="button" onClick={handleAddItem} style={{ padding: '10px', backgroundColor: '#F1F5F9', color: '#334155', border: '2px dashed #94A3B8', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                + เพิ่มรายการในบิลนี้
              </button>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" style={{...styles.submitBtn, backgroundColor: '#3498db'}}>บันทึกข้อมูลทั้งหมด</button>
                <button type="button" onClick={() => { setShowExpenseModal(false); setReceiptFile(null); }} style={styles.cancelBtn}>ยกเลิก</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ✅ เพิ่มกล่อง Modal สำหรับพิมพ์แจ้งแอดมินขอเพิ่มประเภทรายจ่าย */}
      {showCategoryModal && (
        <div style={styles.modalOverlay} onClick={() => setShowCategoryModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, color: '#c0392b' }}>แจ้งเพิ่มประเภทรายจ่ายใหม่</h3>
            <form onSubmit={handleAddCategory}>
              <input 
                type="text" 
                required 
                value={expenseName} 
                onChange={(e) => setExpenseName(e.target.value)} 
                placeholder="เช่น ค่าล้างรถ, ค่าฟิล์มกรองแสง" 
                style={{...styles.input, marginBottom: '20px'}} 
                autoFocus 
              />
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowCategoryModal(false)} style={styles.cancelBtn}>ยกเลิก</button>
                <button type="submit" style={{...styles.saveBtn, backgroundColor: '#c0392b'}}>ส่งคำขอ</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

const styles = {
  topSection: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '25px' },
  addExpenseBtn: { backgroundColor: '#2C3E50', color: 'white', border: 'none', padding: '12px 25px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
  tabContainer: { display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px' },
  activeTabAll: { padding: '8px 20px', backgroundColor: '#2C3E50', color: 'white', border: 'none', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' },
  activeTabUnpaid: { padding: '8px 20px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' },
  activeTabPaid: { padding: '8px 20px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' },
  inactiveTab: { padding: '8px 20px', backgroundColor: '#FFFFFF', color: '#64748b', border: '1px solid #CBD5E1', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' },
  card: { backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.04)', transition: 'transform 0.2s' },
  categoryTag: { backgroundColor: '#F1F5F9', color: '#475569', padding: '5px 10px', borderRadius: '5px', fontSize: '12px', fontWeight: 'bold' },
  editIconBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', padding: '0 5px' },
  deleteIconBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', padding: '0 5px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '450px', boxShadow: '0 5px 15px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' },
  label: { fontWeight: 'bold', color: '#34495e', fontSize: '14px', marginBottom: '5px', display: 'block' },
  input: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #bdc3c7', fontSize: '16px', boxSizing: 'border-box' },
  submitBtn: { flex: 1, padding: '12px', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' },
  cancelBtn: { flex: 1, padding: '12px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' },
  saveBtn: { padding: '8px 15px', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
  filterSelect: { padding: '10px 15px', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', color: '#475569', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', outline: 'none', minWidth: '200px' },
  receiptLink: { display: 'inline-block', marginTop: '10px', padding: '5px 10px', backgroundColor: '#F1F5F9', color: '#3498db', borderRadius: '5px', textDecoration: 'none', fontSize: '13px', fontWeight: 'bold' }
};

export default Expenses;