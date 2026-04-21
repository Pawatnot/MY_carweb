import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import addIcon from '../assets/add.png';

const VehicleList = () => {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = () => {
    // ✅ 1. ดึงไอดีและสิทธิ์จาก localStorage ของคนที่กำลังล็อกอินอยู่
    const userId = localStorage.getItem('user_id');
    const isAdmin = localStorage.getItem('is_admin');

    // ✅ 2. ส่งค่าพารามิเตอร์ (params) ไปให้หลังบ้านด้วย
    axios.get('http://localhost:5000/vehicles', {
      params: { 
        user_id: userId, 
        is_admin: isAdmin 
      }
    })
      .then(response => {
        setCars(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching data:", error);
        setLoading(false);
      });
  };

  const handleDelete = async (id) => {
    if (window.confirm("⚠️ คุณแน่ใจหรือไม่ที่จะลบรถคันนี้?")) {
      try {
        await axios.delete(`http://localhost:5000/vehicles/${id}`);
        setCars(cars.filter(car => car.Vehicle_id !== id));
        setSelectedVehicle(null);
        alert("✅ ลบเรียบร้อย");
      } catch (error) {
        console.error("Error deleting:", error);
      }
    }
  };

  const closeModal = () => {
    setSelectedVehicle(null);
  };

  if (loading) return <div style={{textAlign: 'center', marginTop: '50px'}}> กำลังโหลด...</div>;

  return (
    <div style={{ padding: '30px', backgroundColor: '#F9F8F4', minHeight: '100vh', boxSizing: 'border-box' }}>
      
      {/* ✅ ส่วนหัวข้อ + ปุ่มเพิ่มรถ (แบบ Button มีไอคอน + ข้อความ) */}
      <div style={styles.headerContainer}>
        <h2 style={{ color: '#2c3e50', margin: 0 }}>รายการรถของฉัน</h2>
        
        {/* เปลี่ยนเป็น <button> จริงๆ */}
        <button 
          onClick={() => navigate('/add-vehicle')} 
          style={styles.addBtn}
        >
          {/* เอารูปมาใส่เป็นไอคอนข้างในปุ่ม */}
          <img src={addIcon} alt="icon" style={styles.btnIcon} />
          เพิ่มยานพาหนะ
        </button>
      </div>

      {cars.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
          <p style={{ color: '#7f8c8d' }}>ยังไม่มีข้อมูลรถ...</p>
          <div onClick={() => navigate('/add-vehicle')} style={{cursor: 'pointer', display: 'inline-block', marginTop: '10px'}}>
             <img src={addIcon} alt="Add" style={{width: '60px', height: '60px'}} />
             <p style={{margin: '5px 0', color: '#27ae60', fontWeight: 'bold'}}>กดเพื่อเพิ่มรถ</p>
          </div>
        </div>
      ) : (
        <div style={styles.grid}>
          {cars.map((car) => (
            <div key={car.Vehicle_id} style={styles.card} onClick={() => setSelectedVehicle(car)}>
              {car.Vehicle_image ? (
                <img src={`http://localhost:5000/uploads/${car.Vehicle_image}`} alt={car.Model} style={styles.thumbnail}/>
              ) : (
                <div style={styles.noImagePlaceholder}>🚗 ไม่มีรูป</div>
              )}
              <div style={{ padding: '15px' }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#34495e' }}>{car.Brand} {car.Model}</h3>
                <p style={{ margin: '5px 0', color: '#7f8c8d' }}>ทะเบียน: <strong>{car.vehicle_registration}</strong></p>
                <span style={styles.tag}>{car.Vehicle_Type}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Popup */}
      {selectedVehicle && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button style={styles.closeBtn} onClick={closeModal}>&times;</button>
            <h2 style={{ borderBottom: '2px solid #3498db', paddingBottom: '10px', marginBottom: '20px' }}>ข้อมูลยานพาหนะ</h2>
            
            {selectedVehicle.Vehicle_image ? (
              <img src={`http://localhost:5000/uploads/${selectedVehicle.Vehicle_image}`} alt="Car" style={styles.fullImage} />
            ) : (
              <div style={{...styles.fullImage, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ecf0f1', color: '#95a5a6'}}>ไม่มีรูปภาพ</div>
            )}

            <div style={styles.detailsContainer}>
              <p><strong>ยี่ห้อ:</strong> {selectedVehicle.Brand}</p>
              <p><strong>รุ่น:</strong> {selectedVehicle.Model}</p>
              <p><strong>ทะเบียน:</strong> {selectedVehicle.vehicle_registration}</p>
              <p><strong>ประเภท:</strong> {selectedVehicle.Vehicle_Type}</p>
            </div>

            <div style={styles.actionButtons}>
               <button 
                  style={{...styles.editBtn, backgroundColor: '#3498db', marginRight: '10px'}}
                  onClick={() => navigate(`/maintenance/${selectedVehicle.Vehicle_id}`)}
                >
                  🔧 ประวัติซ่อม
               </button>

               <button style={styles.editBtn} onClick={() => navigate(`/edit-vehicle/${selectedVehicle.Vehicle_id}`)}> แก้ไข</button>
               <button style={styles.deleteBtn} onClick={() => handleDelete(selectedVehicle.Vehicle_id)}> ลบข้อมูล</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  headerContainer: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: '20px' 
  },
  
  // ✅ Style ปุ่มกดแบบใหม่ (Button + Icon + Text)
  addBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px', // ระยะห่างระหว่างไอคอนกับข้อความ
    backgroundColor: '#fff', // พื้นหลังขาว
    border: '2px solid #27ae60', // ขอบเขียว
    color: '#27ae60', // ตัวหนังสือเขียว
    padding: '8px 20px',
    borderRadius: '30px', // ทำมุมโค้งมนเหมือนแคปซูล
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    transition: '0.3s',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
  },
  // ✅ Style สำหรับไอคอนในปุ่ม
  btnIcon: {
    width: '24px',
    height: '24px'
  },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
  card: { border: '1px solid #ddd', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', backgroundColor: 'white', cursor: 'pointer', transition: 'transform 0.2s' },
  thumbnail: { width: '100%', height: '180px', objectFit: 'cover', borderBottom: '1px solid #eee' },
  noImagePlaceholder: { width: '100%', height: '180px', backgroundColor: '#ecf0f1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bdc3c7', fontSize: '18px', fontWeight: 'bold' },
  tag: { backgroundColor: '#eaf2f8', color: '#3498db', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: 'white', padding: '30px', borderRadius: '15px', width: '90%', maxWidth: '500px', position: 'relative', boxShadow: '0 5px 15px rgba(0,0,0,0.3)' },
  closeBtn: { position: 'absolute', top: '15px', right: '20px', background: 'none', border: 'none', fontSize: '30px', cursor: 'pointer', color: '#7f8c8d' },
  fullImage: { width: '100%', height: 'auto', maxHeight: '300px', objectFit: 'contain', borderRadius: '10px', marginBottom: '20px', border: '1px solid #eee' },
  detailsContainer: { fontSize: '16px', lineHeight: '1.6', color: '#2c3e50' },
  actionButtons: { display: 'flex', gap: '10px', marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '20px' },
  editBtn: { flex: 1, padding: '12px', backgroundColor: '#f39c12', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' },
  deleteBtn: { flex: 1, padding: '12px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }
};

export default VehicleList;