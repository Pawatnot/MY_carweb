import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Notification = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const uId = localStorage.getItem('user_id');
    const adminStatus = localStorage.getItem('is_admin');
    
    if (uId) {
      fetchAlerts(uId, adminStatus);
    } else {
      navigate('/login');
    }
  }, [navigate]);

const fetchAlerts = async (uId, adminStatus) => {
    try {
      setIsLoading(true);
      const response = await axios.get('http://localhost:5000/schedules', { 
        params: { user_id: uId, is_admin: adminStatus }
      });
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const alerts = [];

      response.data.forEach(item => {
        // --- สิ่งที่เพิ่มเข้ามา: ถ้าสถานะคือดำเนินการแล้ว (1) ให้ข้ามรายการนี้ไปเลย ไม่ต้องเอามาโชว์ ---
        if (item.is_completed === 1) return; 

        const expDate = new Date(item.Expiry_Date);
        const diffTime = expDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // คัดกรองเฉพาะรายการที่เลยกำหนด (< 0) หรือ ด่วนภายใน 7 วัน (0 - 7)
        if (diffDays <= 7) {
          alerts.push({
            ...item,
            daysLeft: diffDays,
            formattedDate: expDate.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })
          });
        }
      });

      // เรียงลำดับความด่วน (ติดลบเยอะสุดขึ้นก่อน)
      alerts.sort((a, b) => a.daysLeft - b.daysLeft);
      
      setNotifications(alerts);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getAlertStyle = (daysLeft) => {
    if (daysLeft < 0) {
      return { border: '1px solid #FECACA', bg: '#FEF2F2', text: '#DC2626', iconBg: '#F87171', label: 'เลยกำหนด' };
    }
    return { border: '1px solid #FDE68A', bg: '#FFFBEB', text: '#D97706', iconBg: '#FBBF24', label: 'ใกล้ถึงกำหนด' };
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerContainer}>
        <h2 style={styles.pageTitle}>การแจ้งเตือนของคุณ</h2>
        <div style={styles.badgeCount}>
          มีรายการด่วน {notifications.length} รายการ
        </div>
      </div>

      <div style={styles.listContainer}>
        {isLoading ? (
          <div style={styles.emptyText}>กำลังโหลดข้อมูล...</div>
        ) : notifications.length === 0 ? (
          <div style={styles.emptyContainer}>
            <div style={styles.emptyIcon}></div>
            <p style={styles.emptyText}>ไม่มีการแจ้งเตือนใหม่ในขณะนี้</p>
            <p style={styles.emptySubText}>ยานพาหนะของคุณอยู่ในสถานะปกติทั้งหมด</p>
          </div>
        ) : (
          notifications.map(noti => {
            const styleInfo = getAlertStyle(noti.daysLeft);
            return (
              <div key={noti.Schedule_id} style={{...styles.alertCard, backgroundColor: styleInfo.bg, borderColor: styleInfo.border}}>
                <div style={styles.cardContent}>
                  
                  {/* ไอคอนวงกลมซ้ายมือ */}
                  <div style={{...styles.iconCircle, backgroundColor: styleInfo.iconBg}}>!</div>
                  
                  {/* รายละเอียดตรงกลาง */}
                  <div style={styles.textContainer}>
                    <div style={styles.titleRow}>
                      <span style={{ fontWeight: 'bold', color: '#1E293B', fontSize: '16px' }}>
                        {noti.vehicle_registration} ({noti.Brand})
                      </span>
                      <span style={{...styles.statusTag, backgroundColor: styleInfo.text}}>
                        {styleInfo.label}
                      </span>
                    </div>
                    
                    <div style={styles.detailText}>
                      รายการ: <span style={{ fontWeight: 'bold' }}>{noti.Item_Name}</span>
                    </div>
                    
                    <div style={styles.dateText}>
                      วันที่กำหนด: {noti.formattedDate} 
                      <span style={{ color: styleInfo.text, fontWeight: 'bold', marginLeft: '10px' }}>
                        ({noti.daysLeft < 0 ? `เลยกำหนดมาแล้ว ${Math.abs(noti.daysLeft)} วัน` : `เหลืออีก ${noti.daysLeft} วัน`})
                      </span>
                    </div>
                  </div>
                </div>

                {/* ปุ่มแอคชันขวามือ */}
                <div style={styles.actionContainer}>
                  <button 
                    onClick={() => navigate('/schedules')} 
                    style={styles.actionBtn}
                  >
                    จัดการรายการนี้
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

const styles = {
  container: { padding: '30px', backgroundColor: '#F9F8F4', minHeight: '100vh', boxSizing: 'border-box' },
  headerContainer: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' },
  pageTitle: { color: '#2C3E50', margin: 0, fontSize: '24px' },
  badgeCount: { backgroundColor: '#DC2626', color: 'white', padding: '5px 12px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold' },
  listContainer: { display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '900px' },
  
  alertCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.02)', flexWrap: 'wrap', gap: '15px' },
  cardContent: { display: 'flex', alignItems: 'center', gap: '20px', flex: 1, minWidth: '300px' },
  
  iconCircle: { width: '45px', height: '45px', borderRadius: '50%', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '24px', fontWeight: 'bold', flexShrink: 0 },
  textContainer: { flex: 1 },
  titleRow: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' },
  statusTag: { color: 'white', padding: '3px 10px', borderRadius: '15px', fontSize: '12px', fontWeight: 'bold' },
  detailText: { color: '#4A4036', fontSize: '15px', marginBottom: '5px' },
  dateText: { color: '#64748B', fontSize: '14px' },
  
  actionContainer: { display: 'flex', alignItems: 'center' },
  actionBtn: { backgroundColor: '#FFFFFF', color: '#2C3E50', border: '1px solid #CBD5E1', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', transition: '0.2s', whiteSpace: 'nowrap' },
  
  emptyContainer: { backgroundColor: '#FFFFFF', padding: '50px 20px', borderRadius: '16px', border: '1px dashed #CBD5E1', textAlign: 'center' },
  emptyIcon: { width: '60px', height: '60px', backgroundColor: '#F1F5F9', borderRadius: '50%', margin: '0 auto 15px auto' },
  emptyText: { color: '#475569', fontSize: '18px', fontWeight: 'bold', margin: '0 0 5px 0' },
  emptySubText: { color: '#94A3B8', fontSize: '14px', margin: 0 }
};

export default Notification;