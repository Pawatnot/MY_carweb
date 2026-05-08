import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // State เก็บข้อมูลดิบ
  const [vehicles, setVehicles] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [categories, setCategories] = useState([]);

  // State เก็บข้อมูลสรุปผล
  const [expenseSummary, setExpenseSummary] = useState({ thisMonth: 0, lastMonth: 0, percentChange: 0 });
  const [chartData, setChartData] = useState([]);
  const [docSchedules, setDocSchedules] = useState({ list: [], in30Days: 0 });
  const [maintSchedules, setMaintSchedules] = useState({ list: [], in7Days: 0 });

  useEffect(() => {
    const uId = localStorage.getItem('user_id');
    const adminStatus = localStorage.getItem('is_admin');
    
    if (uId) {
      setUserId(uId);
      setIsAdmin(adminStatus === '1');
      fetchAllData(uId, adminStatus);
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const fetchAllData = async (uId, adminStatus) => {
    try {
      const params = { params: { user_id: uId, is_admin: adminStatus } };
      
      const [vehRes, expRes, schRes, catRes] = await Promise.all([
        axios.get('http://localhost:5000/vehicles', params),
        axios.get('http://localhost:5000/expenses', params),
        axios.get('http://localhost:5000/schedules', params),
        axios.get('http://localhost:5000/expense-categories')
      ]);

      setVehicles(vehRes.data);
      setExpenses(expRes.data);
      setSchedules(schRes.data);
      setCategories(catRes.data);

      processExpenseData(expRes.data);
      processScheduleData(schRes.data, catRes.data);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  const processExpenseData = (expData) => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    let thisMonthTotal = 0;
    let lastMonthTotal = 0;

    const monthsToShow = 5;
    const monthNames = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    const cDataMap = {};

    // เตรียมโครงสร้างกราฟ 5 เดือน
    for (let i = monthsToShow - 1; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      cDataMap[key] = { name: `${monthNames[d.getMonth()]} ${(d.getFullYear() + 543).toString().slice(-2)}`, total: 0 };
    }

    expData.forEach(exp => {
      if (exp.payment_status === 1 && exp.Expense_Date) {
        const d = new Date(exp.Expense_Date);
        const m = d.getMonth();
        const y = d.getFullYear();
        const amount = parseFloat(exp.Amount_of_money || 0);

        if (m === currentMonth && y === currentYear) thisMonthTotal += amount;
        else if (m === lastMonth && y === lastYear) lastMonthTotal += amount;

        const key = `${y}-${m}`;
        if (cDataMap[key]) cDataMap[key].total += amount;
      }
    });

    let percentChange = 0;
    if (lastMonthTotal > 0) {
      percentChange = ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
    } else if (thisMonthTotal > 0) {
      percentChange = 100; 
    }

    setExpenseSummary({ thisMonth: thisMonthTotal, lastMonth: lastMonthTotal, percentChange });
    setChartData(Object.values(cDataMap));
  };

  const processScheduleData = (schData, catData) => {
    // หาว่าอันไหนคือเอกสาร (is_document === 1)
    const docNames = catData.filter(c => c.is_document === 1).map(c => c.expenses_type);
    
    const docs = [];
    const maints = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    schData.forEach(s => {
      const expDate = new Date(s.Expiry_Date);
      const diffTime = expDate - today;
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const item = { ...s, daysLeft, formattedDate: expDate.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }) };

      // แยกเป็นเอกสาร หรือ บำรุงรักษา
      if (docNames.includes(s.Item_Name)) {
        docs.push(item);
      } else {
        maints.push(item);
      }
    });

    // เรียงอันที่ใกล้หมดอายุขึ้นก่อน (น้อยไปมาก)
    docs.sort((a, b) => a.daysLeft - b.daysLeft);
    maints.sort((a, b) => a.daysLeft - b.daysLeft);

    // นับจำนวนที่ด่วน
    const docsIn30Days = docs.filter(d => d.daysLeft >= 0 && d.daysLeft <= 30).length;
    const maintsIn7Days = maints.filter(m => m.daysLeft >= 0 && m.daysLeft <= 7).length;

    setDocSchedules({ list: docs, in30Days: docsIn30Days });
    setMaintSchedules({ list: maints, in7Days: maintsIn7Days });
  };

  const renderScheduleList = (items) => {
    if (items.length === 0) return <div style={styles.emptyText}>ไม่มีรายการที่กำลังจะถึง</div>;
    
    return items.slice(0, 3).map(item => { // โชว์แค่ 3 อันดับแรก
      const isOverdue = item.daysLeft < 0;
      const statusColor = isOverdue ? '#DC2626' : (item.daysLeft <= 7 ? '#F59E0B' : '#16A34A');
      const statusText = isOverdue ? `เลยมา ${Math.abs(item.daysLeft)} วัน` : `${item.daysLeft} วัน`;

      return (
        <div key={item.Schedule_id} style={styles.listItem}>
          <div style={{ flex: 1 }}>
            <div style={styles.listTitle}>{item.vehicle_registration} <span style={styles.listSubTitle}>({item.Brand})</span></div>
            <div style={styles.listDesc}>{item.Item_Name}</div>
            <div style={styles.listDate}>{item.formattedDate}</div>
          </div>
          <div style={{ ...styles.statusBadge, color: statusColor, backgroundColor: isOverdue ? '#FEF2F2' : (item.daysLeft <= 7 ? '#FFFBEB' : '#F0FDF4') }}>
            {statusText}
          </div>
        </div>
      );
    });
  };

  return (
    <div style={styles.container}>
      
      {/* 4 Cards ด้านบน */}
      <div style={styles.grid4}>
        <div style={styles.summaryCard}>
          <div style={styles.cardTitle}>จำนวนรถทั้งหมด</div>
          <div style={styles.cardValue}>{vehicles.length} <span style={styles.cardUnit}>คัน</span></div>
        </div>

        <div style={styles.summaryCard}>
          <div style={styles.cardTitle}>เอกสารที่ต้องต่ออายุ</div>
          <div style={styles.cardValue}>{docSchedules.list.length}</div>
          <div style={{ ...styles.cardSubText, color: docSchedules.in30Days > 0 ? '#DC2626' : '#94A3B8' }}>
            {docSchedules.in30Days} รายการ<br/>หมดอายุภายใน 30 วัน
          </div>
        </div>

        <div style={styles.summaryCard}>
          <div style={styles.cardTitle}>การบำรุงรักษา</div>
          <div style={styles.cardValue}>{maintSchedules.list.length}</div>
          <div style={{ ...styles.cardSubText, color: maintSchedules.in7Days > 0 ? '#F59E0B' : '#94A3B8' }}>
            {maintSchedules.in7Days} รายการ<br/>ต้องดำเนินการสัปดาห์นี้
          </div>
        </div>

        <div style={styles.summaryCard}>
          <div style={styles.cardTitle}>ค่าใช้จ่ายรวมเดือนนี้</div>
          <div style={styles.cardValue}>{expenseSummary.thisMonth.toLocaleString()} <span style={styles.cardUnit}>บาท</span></div>
          <div style={{ ...styles.cardSubText, color: expenseSummary.percentChange > 0 ? '#DC2626' : '#16A34A', fontWeight: 'bold' }}>
            {expenseSummary.percentChange > 0 ? '+' : ''}{expenseSummary.percentChange.toFixed(1)}% <br/>
            <span style={{ color: '#94A3B8', fontWeight: 'normal' }}>จากเดือนที่แล้ว</span>
          </div>
        </div>
      </div>

      {/* กราฟและรายการแจ้งเตือน */}
      <div style={styles.grid2}>
        
        {/* กล่องกราฟซ้ายมือ */}
        <div style={styles.graphBox}>
          <div style={styles.sectionHeader}>กราฟแสดงรายจ่าย 5 เดือนล่าสุด</div>
          <div style={{ height: '300px', width: '100%', marginTop: '20px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <Tooltip cursor={{ fill: '#F8FAFC' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="total" fill="#818CF8" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* รายการแจ้งเตือนขวามือ */}
        <div style={styles.listBoxContainer}>
          
          <div style={styles.listBox}>
            <div style={styles.sectionHeaderRow}>
              <div style={styles.sectionHeader}>เอกสารใกล้หมดอายุ</div>
              <button onClick={() => navigate('/schedules')} style={styles.viewAllBtn}>ดูทั้งหมด</button>
            </div>
            {renderScheduleList(docSchedules.list)}
          </div>

          <div style={styles.listBox}>
            <div style={styles.sectionHeaderRow}>
              <div style={styles.sectionHeader}>การบำรุงรักษาที่กำลังจะถึง</div>
              <button onClick={() => navigate('/schedules')} style={styles.viewAllBtn}>ดูทั้งหมด</button>
            </div>
            {renderScheduleList(maintSchedules.list)}
          </div>

        </div>

      </div>

    </div>
  );
};

// สไตล์ต่างๆ แบบไม่มีอิโมจิ
const styles = {
  container: { padding: '30px', backgroundColor: '#F9F8F4', minHeight: '100vh', boxSizing: 'border-box' },
  grid4: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '20px' },
  summaryCard: { backgroundColor: '#FFFFFF', padding: '25px 20px', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', border: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column' },
  cardTitle: { color: '#64748B', fontSize: '15px', fontWeight: 'bold', marginBottom: '15px' },
  cardValue: { color: '#0F172A', fontSize: '36px', fontWeight: 'bold', marginBottom: '10px' },
  cardUnit: { fontSize: '16px', color: '#94A3B8', fontWeight: 'normal' },
  cardSubText: { fontSize: '13px', lineHeight: '1.4' },
  
  grid2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' },
  graphBox: { backgroundColor: '#FFFFFF', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', border: '1px solid #F1F5F9', flex: 1 },
  listBoxContainer: { display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 },
  listBox: { backgroundColor: '#FFFFFF', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', border: '1px solid #F1F5F9' },
  
  sectionHeaderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
  sectionHeader: { color: '#1E293B', fontSize: '18px', fontWeight: 'bold' },
  viewAllBtn: { backgroundColor: 'transparent', color: '#DC2626', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' },
  
  listItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: '1px dashed #E2E8F0' },
  listTitle: { color: '#1E293B', fontWeight: 'bold', fontSize: '15px', marginBottom: '5px' },
  listSubTitle: { color: '#64748B', fontWeight: 'normal', fontSize: '13px' },
  listDesc: { color: '#DC2626', fontSize: '14px', marginBottom: '3px' },
  listDate: { color: '#94A3B8', fontSize: '13px' },
  statusBadge: { padding: '5px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', whiteSpace: 'nowrap' },
  emptyText: { color: '#94A3B8', textAlign: 'center', padding: '20px 0', fontSize: '14px' }
};

export default Dashboard;