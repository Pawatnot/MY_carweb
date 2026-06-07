import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
  
  const [activeTab, setActiveTab] = useState('all'); 
  
  const [expenseType, setExpenseType] = useState('ชิ้นส่วน'); 
  const [expenseName, setExpenseName] = useState('');        

  // ✅ 1. State สำหรับข้อมูลหลัก (บิลใบนี้ของรถคันไหน จ่ายเมื่อไหร่)
  const [billData, setBillData] = useState({
    Vehicle_id: '',
    payment_status: 0,
    Expense_Date: ''
  });

  // ✅ 2. State สำหรับรายการย่อย (เป็น Array เพื่อให้เพิ่มหลายๆ กล่องได้)
  const [expenseItems, setExpenseItems] = useState([
    { expenses_type_id: '', Amount_of_money: '', Detail: '', isAutoSchedule: false, nextExpiryDate: '' }
  ]);

  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState('');

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
      alert("เพิ่มประเภทเรียบร้อย");
      setShowCategoryModal(false);
      setExpenseName('');
      fetchCategories(); 
    } catch (error) { alert("เกิดข้อผิดพลาด"); }
  };

  // ฟังก์ชันเพิ่มกล่องรายการใหม่
  const handleAddItem = () => {
    setExpenseItems([...expenseItems, { expenses_type_id: '', Amount_of_money: '', Detail: '', isAutoSchedule: false, nextExpiryDate: '' }]);
  };

  // ฟังก์ชันลบกล่องรายการ (ห้ามลบถ้าเหลือกล่องเดียว)
  const handleRemoveItem = (index) => {
    if (expenseItems.length > 1) {
      setExpenseItems(expenseItems.filter((_, i) => i !== index));
    }
  };

  // ฟังก์ชันอัปเดตค่าเมื่อพิมพ์ข้อมูลในกล่อง
  const handleItemChange = (index, field, value) => {
    const newItems = [...expenseItems];
    newItems[index][field] = value;
    setExpenseItems(newItems);
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      // ใช้ Promise.all เพื่อวนลูปส่งข้อมูลทุกรายการใน expenseItems ไปที่ Backend
      await Promise.all(expenseItems.map(async (item) => {
        
        // 1. ส่งบันทึกรายจ่าย
        const expenseRes = await axios.post('http://localhost:5000/expenses', {
          Vehicle_id: billData.Vehicle_id,
          payment_status: billData.payment_status,
          Expense_Date: billData.Expense_Date,
          expenses_type_id: item.expenses_type_id,
          Amount_of_money: item.Amount_of_money,
          Detail: item.Detail
        });
        const newExpenseId = expenseRes.data.insertId;

        // 2. ถ้ารายการนั้นติ๊ก "ตั้งแจ้งเตือน" ให้บันทึกลง Schedules ด้วย
        if (item.isAutoSchedule && item.nextExpiryDate) {
          const selectedCat = categories.find(c => c.expenses_type_id == item.expenses_type_id);
          const itemName = selectedCat ? selectedCat.expenses_type : 'บำรุงรักษารถยนต์';

          await axios.post('http://localhost:5000/schedules', {
            Vehicle_id: billData.Vehicle_id,
            expenses_id: newExpenseId,
            Item_Name: itemName,
            Expiry_Date: item.nextExpiryDate
          });
        }
      }));

      alert("บันทึกข้อมูลสำเร็จทุกรายการ!");
      setShowExpenseModal(false); 
      
      // ล้างฟอร์มกลับเป็นค่าเริ่มต้น
      setBillData({ Vehicle_id: '', payment_status: 0, Expense_Date: '' });
      setExpenseItems([{ expenses_type_id: '', Amount_of_money: '', Detail: '', isAutoSchedule: false, nextExpiryDate: '' }]);
      
      fetchExpensesList(userId, isAdmin ? '1' : '0'); 
    } catch (error) { 
      console.error(error);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูลบางรายการ"); 
    }
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
        alert("เกิดข้อผิดพลาดในการอัปเดตสถานะ");
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
      alert("เกิดข้อผิดพลาดในการอัปเดตสถานะ");
    }
  };

  const filteredExpenses = expensesList.filter(expense => {
    // 1. ด่านแรก: กรองตามยานพาหนะ (แก้ไขให้ใช้ ทะเบียนรถ ในการกรอง)
    if (selectedVehicleFilter !== '' && expense.vehicle_registration !== selectedVehicleFilter) {
      return false;
    }

    // 2. ด่านสอง: กรองตามสถานะการจ่ายเงิน
    if (activeTab === 'paid') return expense.payment_status === 1;
    if (activeTab === 'unpaid') return expense.payment_status === 0;
    return true; 
  });

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // -----------------------------------------------------
  // ส่วนคำนวณและเตรียมข้อมูลสำหรับกราฟ (แยกตาม 5 เดือนล่าสุด)
  // -----------------------------------------------------
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  let thisMonthTotal = 0;
  let lastMonthTotal = 0;

  const monthsToShow = 5;
  const monthNames = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  const chartDataMap = {};

  // 1. สร้างโครงสร้างข้อมูล 5 เดือนล่าสุดรอไว้ (เรียงจากเก่าไปใหม่)
  for (let i = monthsToShow - 1; i >= 0; i--) {
    const d = new Date(currentYear, currentMonth - i, 1);
    const m = d.getMonth();
    const y = d.getFullYear();
    const key = `${y}-${m}`;
    const label = `${monthNames[m]} ${(y + 543).toString().slice(-2)}`;
    chartDataMap[key] = { name: label, total: 0 };
  }

  // 2. จัดกลุ่มยอดเงินรายจ่ายลงในเดือนที่ถูกต้อง
  expensesList.forEach(exp => {
    if (exp.payment_status === 1 && exp.Expense_Date) {
      const expDate = new Date(exp.Expense_Date);
      const m = expDate.getMonth();
      const y = expDate.getFullYear();
      const amount = parseFloat(exp.Amount_of_money || 0);

      // คำนวณกล่องสรุปยอดเดือนนี้ / เดือนก่อน
      if (m === currentMonth && y === currentYear) {
        thisMonthTotal += amount;
      } else if (m === lastMonth && y === lastYear) {
        lastMonthTotal += amount;
      }

      // นำยอดเข้ากราฟ (เฉพาะถ้าอยู่ใน 5 เดือนล่าสุด)
      const key = `${y}-${m}`;
      if (chartDataMap[key]) {
        chartDataMap[key].total += amount;
      }
    }
  });

  const chartData = Object.values(chartDataMap);

  return (
    <div style={{ padding: '30px', backgroundColor: '#F9F8F4', minHeight: '100vh', boxSizing: 'border-box' }}>
      
      <div style={styles.topSection}>
        <h2 style={{ color: '#2C3E50', margin: 0 }}>ระบบบันทึกรายจ่าย</h2>
        
        {/* จัดกลุ่มให้อยู่ขวามือ */}
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          
          {/* Dropdown เลือกรถ */}
          <select 
            style={styles.filterSelect}
            value={selectedVehicleFilter}
            onChange={(e) => setSelectedVehicleFilter(e.target.value)}
          >
            <option value="">-- ยานพาหนะทั้งหมด --</option>
            {myVehicles.map(v => (
              // แก้ไข value ให้เป็นทะเบียนรถ
              <option key={v.Vehicle_id} value={v.vehicle_registration}>
                {v.vehicle_registration} ({v.Brand})
              </option>
            ))}
          </select>

          {/* ปุ่มเพิ่มรายจ่าย */}
          <button onClick={() => setShowExpenseModal(true)} style={styles.addExpenseBtn}>เพิ่มรายจ่ายใหม่</button>
        </div>
      </div>

      <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 10px rgba(0,0,0,0.03)', border: '1px solid #F0EAE1', marginBottom: '30px' }}>
        <h3 style={{ color: '#2C3E50', marginTop: 0, marginBottom: '20px' }}>กราฟสรุปรายจ่าย 5 เดือนล่าสุด</h3>
        
        <div style={{ height: '300px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} />
              <Tooltip 
                cursor={{ fill: '#F8FAFC' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
              />
              <Bar dataKey="total" fill="#3498db" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <hr style={{ borderTop: '2px dashed #E2E8F0', margin: '30px 0' }}/>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <h2 style={{ color: '#2C3E50', margin: 0 }}>รายการใช้จ่ายทั้งหมด</h2>

        <div style={styles.tabContainer}>
          <button onClick={() => setActiveTab('all')} style={activeTab === 'all' ? styles.activeTabAll : styles.inactiveTab}>
            ทั้งหมด
          </button>
          <button onClick={() => setActiveTab('unpaid')} style={activeTab === 'unpaid' ? styles.activeTabUnpaid : styles.inactiveTab}>
            ยังไม่จ่าย
          </button>
          <button onClick={() => setActiveTab('paid')} style={activeTab === 'paid' ? styles.activeTabPaid : styles.inactiveTab}>
            จ่ายแล้ว
          </button>
        </div>
      </div>

      {filteredExpenses.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: '50px', color: '#7f8c8d' }}>
          <p>ไม่มีรายการที่ค้นหาในหมวดหมู่นี้...</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {filteredExpenses.map(exp => (
            <div key={exp.Expenses_id} style={{ ...styles.card, borderLeft: exp.payment_status === 1 ? '5px solid #16A34A' : '5px solid #DC2626' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={styles.categoryTag}>{exp.expenses_type}</span>
                <span style={{ fontWeight: 'bold', fontSize: '18px', color: '#2C3E50' }}>฿{exp.Amount_of_money}</span>
              </div>
              <h3 style={{ margin: '15px 0 5px 0', color: '#34495e' }}>{exp.Brand} {exp.Model}</h3>
              <p style={{ margin: '0', color: '#7f8c8d', fontSize: '13px' }}>ทะเบียน: {exp.vehicle_registration}</p>
              
              <p style={{ margin: '5px 0', color: '#34495e', fontSize: '14px', backgroundColor: '#F8FAFC', padding: '8px', borderRadius: '5px' }}>
                หมายเหตุ: {exp.Detail || '-'}
              </p>

              {exp.payment_status === 1 ? (
                <p style={{ margin: '5px 0 15px 0', color: '#16A34A', fontSize: '14px', fontWeight: 'bold' }}>
                  วันที่ชำระเงิน: {formatDate(exp.Expense_Date)}
                </p>
              ) : (
                <p style={{ margin: '5px 0 15px 0', color: '#DC2626', fontSize: '14px', fontWeight: 'bold' }}>
                  ยังไม่ได้ชำระเงิน
                </p>
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

      {showExpenseModal && (
        <div style={styles.modalOverlay} onClick={() => setShowExpenseModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, borderBottom: '2px solid #3498db', paddingBottom: '10px' }}>บันทึกรายจ่าย (บิลเดียวหลายรายการ)</h3>
            <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
              
              {/* --- ส่วนที่ 1: ข้อมูลหลักของบิล --- */}
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
                  <input type="checkbox" checked={billData.payment_status === 1} onChange={e => setBillData({...billData, payment_status: e.target.checked ? 1 : 0, Expense_Date: ''})} style={{ transform: 'scale(1.2)' }} />
                  <span style={{fontWeight: 'bold', color: '#34495e'}}>ชำระเงินเรียบร้อยแล้ว</span>
                </label>

                {billData.payment_status === 1 && (
                  <div style={{ marginTop: '10px' }}>
                    <label style={styles.label}>วันที่ชำระเงิน</label>
                    <input type="date" required style={styles.input} value={billData.Expense_Date} onChange={e => setBillData({...billData, Expense_Date: e.target.value})}/>
                  </div>
                )}
              </div>

              {/* --- ส่วนที่ 2: วนลูปกล่องรายการย่อย --- */}
              <h4 style={{ margin: '10px 0 0 0', color: '#2C3E50' }}>รายการค่าใช้จ่าย</h4>
              {expenseItems.map((item, index) => (
                <div key={index} style={{ padding: '15px', backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #CBD5E1', position: 'relative' }}>
                  
                  {/* ปุ่ม X สำหรับลบรายการ (จะซ่อนไว้ถ้ามีกล่องเดียว) */}
                  {expenseItems.length > 1 && (
                    <button type="button" onClick={() => handleRemoveItem(index)} style={{ position: 'absolute', top: '10px', right: '10px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '50%', width: '25px', height: '25px', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
                  )}
                  
                  <h5 style={{ margin: '0 0 10px 0', color: '#64748B' }}>รายการที่ {index + 1}</h5>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                    <div>
                      <label style={styles.label}>ประเภท</label>
                      <select required style={styles.input} value={item.expenses_type_id} onChange={e => handleItemChange(index, 'expenses_type_id', e.target.value)}>
                        <option value="">-- เลือก --</option>
                        {categories.map((cat) => (
                          <option key={cat.expenses_type_id} value={cat.expenses_type_id}>{cat.expenses_type}</option>
                        ))}
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

              {/* ปุ่มกดเพิ่มรายการ */}
              <button type="button" onClick={handleAddItem} style={{ padding: '10px', backgroundColor: '#F1F5F9', color: '#334155', border: '2px dashed #94A3B8', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                + เพิ่มรายการค่าใช้จ่าย
              </button>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" style={{...styles.submitBtn, backgroundColor: '#3498db'}}>บันทึกข้อมูลทั้งหมด</button>
                <button type="button" onClick={() => setShowExpenseModal(false)} style={styles.cancelBtn}>ยกเลิก</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCategoryModal && (
        <div style={styles.modalOverlay} onClick={() => setShowCategoryModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, borderBottom: '2px solid #27ae60', paddingBottom: '10px', color: '#2c3e50' }}>เพิ่มประเภทรายจ่าย</h3>
            <form onSubmit={handleAddCategory} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
              <div>
                <label style={styles.label}>1. หมวดหมู่รายจ่าย:</label>
                <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
                  <label style={styles.checkboxLabel}>
                    <input type="radio" name="expenseCategoryType" checked={expenseType === 'ชิ้นส่วน'} onChange={() => setExpenseType('ชิ้นส่วน')} style={{ transform: 'scale(1.3)' }}/> ชิ้นส่วน
                  </label>
                  <label style={styles.checkboxLabel}>
                    <input type="radio" name="expenseCategoryType" checked={expenseType === 'เอกสาร'} onChange={() => setExpenseType('เอกสาร')} style={{ transform: 'scale(1.3)' }}/> เอกสาร
                  </label>
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

const styles = {
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
  
  tabContainer: { display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px' },
  activeTabAll: { padding: '8px 20px', backgroundColor: '#2C3E50', color: 'white', border: 'none', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' },
  activeTabUnpaid: { padding: '8px 20px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' },
  activeTabPaid: { padding: '8px 20px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' },
  inactiveTab: { padding: '8px 20px', backgroundColor: '#FFFFFF', color: '#64748b', border: '1px solid #CBD5E1', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' },
  card: { backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.04)', transition: 'transform 0.2s' },
  categoryTag: { backgroundColor: '#F1F5F9', color: '#475569', padding: '5px 10px', borderRadius: '5px', fontSize: '12px', fontWeight: 'bold' },
  
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '450px', boxShadow: '0 5px 15px rgba(0,0,0,0.2)', maxHeight: '90vh',overflowY: 'auto' },
  label: { fontWeight: 'bold', color: '#34495e', fontSize: '14px', marginBottom: '5px', display: 'block' },
  checkboxLabel: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '16px' },
  input: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #bdc3c7', fontSize: '16px', boxSizing: 'border-box' },
  submitBtn: { flex: 1, padding: '12px', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' },
  cancelBtn: { flex: 1, padding: '12px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' },
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

export default Expenses;