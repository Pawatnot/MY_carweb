import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Dashboard = () => {
  const [totalVehicles, setTotalVehicles] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  // ✅ State สำหรับเก็บค่า % ที่เปลี่ยนแปลง
  const [expensePercent, setExpensePercent] = useState(0); 

  const expiringDocs = [
    { id: 1, plate: 'นค 1234 เลย', type: 'ประกันภัย', expiryDate: '1 ม.ค 2570', daysLeft: 1, status: 'red' },
    { id: 2, plate: 'กก 1234 กรุงเทพ', type: 'พ.ร.บ', expiryDate: '17 ม.ค 2570', daysLeft: 18, status: 'yellow' },
    { id: 3, plate: 'ญษ 6247 เลย', type: 'ใบขับขี่', expiryDate: '20 ม.ค 2570', daysLeft: 21, status: 'green' },
  ];

  const upcomingMaintenance = [
    { id: 1, plate: 'นค 1234 เลย', detail: 'เปลี่ยนน้ำมันเครื่อง', date: '15 ก.พ. 2568', daysLeft: 2 },
    { id: 2, plate: 'กก 1234 กรุงเทพ', detail: 'เปลี่ยนผ้าเบรค', date: '16 ก.พ. 2568', daysLeft: 2 },
  ];

  useEffect(() => {
    const adminStatus = localStorage.getItem('is_admin');
    const uId = localStorage.getItem('user_id');
    
    if (uId) {
      fetchDashboardData(uId, adminStatus);
    }
  }, []);

  const fetchDashboardData = async (uId, adminStatus) => {
    try {
      const vehicleRes = await axios.get('http://localhost:5000/vehicles', { params: { user_id: uId, is_admin: adminStatus }});
      setTotalVehicles(vehicleRes.data.length); 

      const expenseRes = await axios.get('http://localhost:5000/expenses', { params: { user_id: uId, is_admin: adminStatus }});
      const allExpenses = expenseRes.data;

      // หาวันที่ปัจจุบัน
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();

      // หาเดือนและปีของ "เดือนที่แล้ว"
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastYear = currentMonth === 0 ? currentYear - 1 : currentYear;

      let thisMonthTotal = 0;
      let lastMonthTotal = 0;

      // ✅ วนลูปแยกยอดรายจ่ายของ "เดือนนี้" กับ "เดือนที่แล้ว"
      allExpenses.forEach(exp => {
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

      setMonthlyExpenses(thisMonthTotal);

      // ✅ คำนวณ % การเปลี่ยนแปลง
      let percentChange = 0;
      if (lastMonthTotal > 0) {
        percentChange = ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
      } else if (thisMonthTotal > 0) {
        percentChange = 100; // ถ้าเดือนที่แล้วเป็น 0 แต่เดือนนี้มีรายจ่าย ถือว่าเพิ่ม 100%
      }
      setExpensePercent(percentChange);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  // ✅ ฟังก์ชันกำหนดการแสดงผลข้อความและสีของเปอร์เซ็นต์
  const renderPercentChange = () => {
    if (expensePercent === 0) {
      return { text: 'เท่ากับเดือนที่แล้ว', color: '#94A3B8' }; // สีเทา
    } else if (expensePercent > 0) {
      return { text: `+${expensePercent.toFixed(1)}%`, color: '#DC2626' }; // สีแดง (จ่ายเยอะขึ้น)
    } else {
      return { text: `${expensePercent.toFixed(1)}%`, color: '#16A34A' }; // สีเขียว (จ่ายน้อยลง)
    }
  };

  const percentDisplay = renderPercentChange();

  return (
    <div style={styles.container}>
      <div style={styles.mainGrid}>
        
        <div style={styles.leftColumn}>
          
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statHeader}><span> จำนวนรถทั้งหมด</span></div>
              <div style={styles.statNumber}>
                {totalVehicles} <span style={{fontSize: '20px', color: '#94A3B8', fontWeight: 'normal'}}>คัน</span>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statHeader}><span>📄 เอกสารที่ต้องต่ออายุ</span></div>
              <div style={styles.statNumber}>4</div>
              <div style={{ color: '#DC2626', fontSize: '13px' }}>2 รายการ <br/><span style={{color: '#94A3B8'}}>หมดอายุภายใน 30 วัน</span></div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statHeader}><span>⚙️ การบำรุงรักษา</span></div>
              <div style={styles.statNumber}>5</div>
              <div style={{ color: '#D97706', fontSize: '13px' }}>2 รายการ <br/><span style={{color: '#94A3B8'}}>ต้องดำเนินการสัปดาห์นี้</span></div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statHeader}><span>฿ ค่าใช้จ่ายรวมเดือนนี้</span></div>
              <div style={styles.statNumber}>{monthlyExpenses.toLocaleString()} <span style={{fontSize: '20px', color: '#94A3B8'}}>บาท</span></div>
              
              {/* ✅ แสดง % ที่คำนวณมาพร้อมสลับสีอัตโนมัติ */}
              <div style={{ color: percentDisplay.color, fontSize: '13px', fontWeight: 'bold' }}>
                {percentDisplay.text} <br/>
                <span style={{color: '#94A3B8', fontWeight: 'normal'}}>จากเดือนที่แล้ว</span>
              </div>
            </div>
          </div>

          <div style={styles.chartCard}>
            <div style={styles.placeholderChart}>
              <span style={{ fontSize: '40px', color: '#CBD5E1' }}>📊</span>
              <p style={{ color: '#94A3B8', marginTop: '10px' }}>กราฟแสดงรายจ่ายแต่ละเดือน</p>
            </div>
          </div>

        </div>

        <div style={styles.rightColumn}>
          
          <div style={styles.listCard}>
            <div style={styles.cardHeader}>
              <h3 style={{ margin: 0, color: '#2C3E50' }}>เอกสารใกล้หมดอายุ</h3>
              <a href="#" style={styles.link}>ดูทั้งหมด</a>
            </div>
            
            <table style={styles.table}>
              <thead>
                <tr style={{ color: '#8A7D72', textAlign: 'left', borderBottom: '2px solid #F0EAE1' }}>
                  <th style={{ paddingBottom: '10px' }}>ทะเบียนรถ</th>
                  <th style={{ paddingBottom: '10px' }}>ประเภท</th>
                  <th style={{ paddingBottom: '10px' }}>วันหมดอายุ</th>
                  <th style={{ paddingBottom: '10px' }}>สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {expiringDocs.map(doc => (
                  <tr key={doc.id} style={{ borderBottom: '1px solid #F0EAE1' }}>
                    <td style={{ padding: '12px 0', fontSize: '14px', color: '#4A4036' }}>{doc.plate}</td>
                    <td style={{ padding: '12px 0', fontSize: '14px', color: '#4A4036' }}>{doc.type}</td>
                    <td style={{ padding: '12px 0', fontSize: '14px', color: '#4A4036' }}>{doc.expiryDate}</td>
                    <td style={{ padding: '12px 0', fontSize: '14px', color: doc.status === 'red' ? '#DC2626' : doc.status === 'yellow' ? '#D97706' : '#16A34A', fontWeight: 'bold' }}>
                      {doc.daysLeft} วัน
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={styles.listCard}>
             <div style={styles.cardHeader}>
              <h3 style={{ margin: 0, color: '#2C3E50' }}>การบำรุงรักษาที่กำลังจะถึง</h3>
              <a href="#" style={styles.link}>ดูทั้งหมด</a>
            </div>
            <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {upcomingMaintenance.map(item => (
                <div key={item.id} style={{ backgroundColor: '#FFF1F2', border: '1px solid #FFE4E6', padding: '12px 15px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#9F1239', fontSize: '15px' }}>{item.plate}</div>
                    <div style={{ fontSize: '13px', color: '#BE123C', marginTop: '2px' }}>{item.detail}</div>
                    <div style={{ fontSize: '12px', color: '#E11D48', marginTop: '2px' }}>{item.date}</div>
                  </div>
                  <div style={{ color: '#BE123C', fontSize: '15px', fontWeight: 'bold', backgroundColor: '#FFE4E6', padding: '5px 10px', borderRadius: '8px' }}>
                    {item.daysLeft} วัน
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

const styles = {
  container: { padding: '30px', backgroundColor: '#F9F8F4', minHeight: '100vh', color: '#4A4036', boxSizing: 'border-box' },
  mainGrid: { display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '25px', alignItems: 'start' },
  leftColumn: { display: 'flex', flexDirection: 'column', gap: '25px' },
  rightColumn: { display: 'flex', flexDirection: 'column', gap: '25px' },
  statsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' },
  statCard: { backgroundColor: '#FFFFFF', padding: '25px', borderRadius: '16px', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #F0EAE1' },
  statHeader: { color: '#8A7D72', fontSize: '20px', fontWeight: 'bold', marginBottom: '10px' },
  statNumber: { fontSize: '52px', fontWeight: 'bold', color: '#2C3E50', margin: '10px 0' },
  chartCard: { backgroundColor: '#FFFFFF', padding: '25px', borderRadius: '16px', minHeight: '320px', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #F0EAE1' },
  placeholderChart: { border: '2px dashed #E2E8F0', width: '100%', height: '250px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', borderRadius: '12px', backgroundColor: '#F8FAFC' },
  listCard: { backgroundColor: '#FFFFFF', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #F0EAE1' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  link: { color: '#B91C1C', textDecoration: 'none', fontSize: '14px', fontWeight: 'bold' },
  table: { width: '100%', borderCollapse: 'collapse' }
};

export default Dashboard;