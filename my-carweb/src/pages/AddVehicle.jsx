import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AddVehicle = () => {
  const navigate = useNavigate();
  
  const [userId, setUserId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const [brandsData, setBrandsData] = useState({});
  const [brandOptions, setBrandOptions] = useState([]);
  const [modelOptions, setModelOptions] = useState([]);
  
  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
  const [notifyText, setNotifyText] = useState('');

  // ✅ แยก State ทะเบียน กับ จังหวัด ออกจากกันเพื่อให้กรอกง่าย
  const [regNumber, setRegNumber] = useState('');
  const [regProvince, setRegProvince] = useState('กรุงเทพมหานคร'); // ตั้งค่าเริ่มต้นเป็นกรุงเทพฯ (เปลี่ยนได้ตามสะดวก)

  const [formData, setFormData] = useState({
    Brand: '', Model: '', Vehicle_Type: 'รถเก๋ง'
  });

  // รายชื่อ 77 จังหวัดในประเทศไทย
  const provinces = [
    "กรุงเทพมหานคร", "กระบี่", "กาญจนบุรี", "กาฬสินธุ์", "กำแพงเพชร", "ขอนแก่น", "จันทบุรี", "ฉะเชิงเทรา", "ชลบุรี", "ชัยนาท", "ชัยภูมิ", "ชุมพร", "ตรัง", "ตราด", "ตาก", "นครนายก", "นครปฐม", "นครพนม", "นครราชสีมา", "นครศรีธรรมราช", "นครสวรรค์", "นนทบุรี", "นราธิวาส", "น่าน", "บึงกาฬ", "บุรีรัมย์", "ปทุมธานี", "ประจวบคีรีขันธ์", "ปราจีนบุรี", "ปัตตานี", "พระนครศรีอยุธยา", "พะเยา", "พังงา", "พัทลุง", "พิจิตร", "พิษณุโลก", "เพชรบุรี", "เพชรบูรณ์", "แพร่", "ภูเก็ต", "มหาสารคาม", "มุกดาหาร", "แม่ฮ่องสอน", "ยโสธร", "ยะลา", "ร้อยเอ็ด", "ระนอง", "ระยอง", "ราชบุรี", "ลพบุรี", "ลำปาง", "ลำพูน", "เลย", "ศรีสะเกษ", "สกลนคร", "สงขลา", "สตูล", "สมุทรปราการ", "สมุทรสงคราม", "สมุทรสาคร", "สระแก้ว", "สระบุรี", "สิงห์บุรี", "สุโขทัย", "สุพรรณบุรี", "สุราษฎร์ธานี", "สุรินทร์", "หนองคาย", "หนองบัวลำภู", "อ่างทอง", "อำนาจเจริญ", "อุดรธานี", "อุตรดิตถ์", "อุทัยธานี", "อุบลราชธานี"
  ];

  useEffect(() => {
    const storedUserId = localStorage.getItem('user_id');
    const adminStatus = localStorage.getItem('is_admin');
    
    if (storedUserId) {
      setUserId(storedUserId);
      setIsAdmin(adminStatus === '1');
      fetchBrandsData(); 
    } else {
      alert("กรุณาเข้าสู่ระบบก่อน");
      navigate('/login');
    }
  }, [navigate]);

  const fetchBrandsData = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/brands');
      setBrandsData(res.data);
      setBrandOptions(Object.keys(res.data)); 
      if (formData.Brand) setModelOptions(res.data[formData.Brand] || []);
    } catch (err) { console.error(err); }
  };

  const handleBrandSelect = (e) => {
    const val = e.target.value;
    if (val === 'NOTIFY_ADMIN') {
      setIsNotifyModalOpen(true);
      setFormData({...formData, Brand: '', Model: ''});
    } else {
      setFormData({...formData, Brand: val, Model: ''});
      setModelOptions(val ? brandsData[val] : []); 
    }
  };

  const handleModelSelect = (e) => {
    const val = e.target.value;
    if (val === 'NOTIFY_ADMIN') {
      setIsNotifyModalOpen(true);
      setFormData({...formData, Model: ''});
    } else {
      setFormData({...formData, Model: val});
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleFileChange = (e) => setSelectedFile(e.target.files[0]);

  const handleSendNotification = async () => {
    if (!notifyText.trim()) return alert('กรุณาพิมพ์สิ่งที่ต้องการให้แอดมินเพิ่ม');
    try {
      await axios.post('http://localhost:5000/notifications', { Message: notifyText });
      alert('ส่งคำขอเรียบร้อย แอดมินจะดำเนินการเร็วๆ นี้');
      setIsNotifyModalOpen(false); setNotifyText('');
    } catch (error) { alert('เกิดข้อผิดพลาดในการส่งแจ้งเตือน'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) return alert("ไม่พบข้อมูลผู้ใช้งาน");
    
    // ✅ นำเลขทะเบียนมารวมกับจังหวัดเป็นสตริงเดียว เช่น "1กก 1234 กรุงเทพมหานคร"
    const fullRegistration = `${regNumber.trim()} ${regProvince}`;

    try {
      const data = new FormData();
      data.append('User_id', userId); 
      data.append('Brand', formData.Brand);
      data.append('Model', formData.Model);
      data.append('vehicle_registration', fullRegistration); // ส่งค่าที่รวมแล้วเข้า Backend
      data.append('Vehicle_Type', formData.Vehicle_Type);
      if (selectedFile) data.append('image', selectedFile); 

      await axios.post('http://localhost:5000/vehicles', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      alert("เพิ่มรถสำเร็จแล้ว!"); navigate('/vehicles');
    } catch (error) { alert("เกิดข้อผิดพลาดในการเพิ่มรถ"); }
  };

  return (
    <div style={styles.container}>
      <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>เพิ่มรถคันใหม่</h2>
      
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formGroup}>
          <label style={styles.label}>ยี่ห้อ (Brand)</label>
          <select style={styles.select} required value={formData.Brand} onChange={handleBrandSelect}>
            <option value="">-- กรุณาเลือกยี่ห้อ --</option>
            {brandOptions.map(b => <option key={b} value={b}>{b}</option>)}
            {!isAdmin && <option value="NOTIFY_ADMIN" style={{ fontWeight: 'bold', color: '#e74c3c' }}>หาไม่พบ? แจ้งแอดมินเพิ่มข้อมูล</option>}
          </select>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>รุ่น (Model)</label>
          <select style={styles.select} required value={formData.Model} onChange={handleModelSelect}>
            <option value="">-- กรุณาเลือกรุ่น --</option>
            {modelOptions.map(m => <option key={m} value={m}>{m}</option>)}
            {!isAdmin && formData.Brand && <option value="NOTIFY_ADMIN" style={{ fontWeight: 'bold', color: '#e74c3c' }}>หาไม่พบ? แจ้งแอดมินเพิ่มข้อมูล</option>}
          </select>
        </div>

        {/* ✅ ช่องกรอกทะเบียนรถและเลือกจังหวัดแบบรวมในคอลัมน์เดียว */}
        <div style={styles.formGroup}>
          <label style={styles.label}>ทะเบียนรถและจังหวัด</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="text" 
              placeholder="เช่น 1กก 1234 หรือ กข-5678" 
              required 
              value={regNumber} 
              onChange={(e) => setRegNumber(e.target.value)} 
              style={{ ...styles.input, flex: 1.2 }} 
            />
            <select 
              value={regProvince} 
              onChange={(e) => setRegProvince(e.target.value)} 
              style={{ ...styles.select, flex: 1 }}
            >
              {provinces.map(prov => (
                <option key={prov} value={prov}>{prov}</option>
              ))}
            </select>
          </div>
          <span style={{ fontSize: '12px', color: '#7f8c8d' }}>ระบบจะบันทึกรวมกันเป็น: {regNumber ? `${regNumber} ${regProvince}` : '...'}</span>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>ประเภทรถ</label>
          <select name="Vehicle_Type" value={formData.Vehicle_Type} onChange={handleChange} style={styles.select}>
            <option value="รถเก๋ง">รถเก๋ง</option>
            <option value="รถกระบะ">รถกระบะ</option>
            <option value="รถครอบครัว">รถครอบครัว</option>
            <option value="รถบรรทุกขนาดเล็ก">รถบรรทุกขนาดเล็ก</option>
            <option value="รถจักรยานยนต์">รถจักรยานยนต์</option>
          </select>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>รูปภาพรถ</label>
          <input type="file" accept="image/*" onChange={handleFileChange} style={styles.input} />
        </div>

        <button type="submit" style={styles.submitBtn}>บันทึกข้อมูลรถ</button>
      </form>

      {isNotifyModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={{ marginTop: 0, color: '#c0392b' }}>แจ้งเพิ่มข้อมูลรถ</h3>
            <textarea value={notifyText} onChange={(e) => setNotifyText(e.target.value)} placeholder="ระบุยี่ห้อและรุ่นที่ต้องการ" style={{...styles.modalInput, height: '80px'}} autoFocus />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setIsNotifyModalOpen(false)} style={styles.cancelBtn}>ยกเลิก</button>
              <button onClick={handleSendNotification} style={{...styles.saveBtn, backgroundColor: '#c0392b'}}>ส่งคำขอ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { maxWidth: '600px', margin: '0 auto', padding: '30px', backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', position: 'relative' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontWeight: 'bold', color: '#34495e' },
  input: { padding: '12px', borderRadius: '5px', border: '1px solid #bdc3c7', fontSize: '16px', boxSizing: 'border-box' },
  select: { padding: '12px', borderRadius: '5px', border: '1px solid #bdc3c7', fontSize: '16px', backgroundColor: 'white', boxSizing: 'border-box' },
  submitBtn: { padding: '12px', backgroundColor: '#2C3E50', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: 'white', padding: '25px', borderRadius: '10px', width: '350px', boxShadow: '0 5px 15px rgba(0,0,0,0.3)' },
  modalInput: { width: '100%', padding: '10px', marginBottom: '20px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box', fontFamily: 'inherit' },
  cancelBtn: { padding: '8px 15px', backgroundColor: '#e0e0e0', color: '#333', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
  saveBtn: { padding: '8px 15px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }
};

export default AddVehicle;