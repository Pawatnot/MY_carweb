import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AddVehicle = () => {
  const navigate = useNavigate();
  
  const [userId, setUserId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false); // ✅ เพิ่ม State เช็คแอดมิน
  const [selectedFile, setSelectedFile] = useState(null);

  // ✅ State สำหรับเก็บลิสต์ ยี่ห้อ และ รุ่น ที่ดึงจาก Database
  const [brandOptions, setBrandOptions] = useState([]);
  const [modelOptions, setModelOptions] = useState([]);
  
  // ✅ State เช็คว่าแอดมินกดเลือก "+ อื่นๆ" หรือไม่
  const [isNewBrand, setIsNewBrand] = useState(false);
  const [isNewModel, setIsNewModel] = useState(false);

  const [formData, setFormData] = useState({
    Brand: '',
    Model: '',
    vehicle_registration: '',
    Vehicle_Type: 'รถยนต์ส่วนบุคคล'
  });

  useEffect(() => {
    const storedUserId = localStorage.getItem('user_id');
    const adminStatus = localStorage.getItem('is_admin'); // ดึงสถานะแอดมินมาเช็ค
    
    if (storedUserId) {
      setUserId(storedUserId);
      setIsAdmin(adminStatus === '1'); // ถ้าเป็น '1' คือ Admin
      fetchBrands(); // โหลดรายชื่อยี่ห้อรถตั้งแต่เริ่มเปิดหน้า
    } else {
      alert("กรุณาเข้าสู่ระบบก่อนเพิ่มรถ");
      navigate('/login');
    }
  }, [navigate]);

  // ✅ ฟังก์ชันดึงยี่ห้อรถจาก Database
  const fetchBrands = async () => {
    try {
      const res = await axios.get('http://localhost:5000/vehicle-brands');
      setBrandOptions(res.data.length > 0 ? res.data : ['Honda', 'Toyota', 'Isuzu', 'Yamaha']);
    } catch (err) { console.error(err); }
  };

  // ✅ ฟังก์ชันดึงรุ่นรถตามยี่ห้อที่เลือก
  const fetchModels = async (selectedBrand) => {
    try {
      const res = await axios.get(`http://localhost:5000/vehicle-models?brand=${selectedBrand}`);
      setModelOptions(res.data);
    } catch (err) { console.error(err); }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!userId) {
        alert("ไม่พบข้อมูลผู้ใช้งาน กรุณาล็อกอินใหม่อีกครั้ง");
        return;
    }

    try {
      const data = new FormData();
      data.append('User_id', userId); 
      data.append('Brand', formData.Brand);
      data.append('Model', formData.Model);
      data.append('vehicle_registration', formData.vehicle_registration);
      data.append('Vehicle_Type', formData.Vehicle_Type);

      if (selectedFile) {
        data.append('image', selectedFile); 
      }

      await axios.post('http://localhost:5000/vehicles', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      alert("🎉 เพิ่มรถสำเร็จแล้ว!");
      navigate('/vehicles');
    } catch (error) {
      console.error("Error adding vehicle:", error);
      alert("เกิดข้อผิดพลาดในการเพิ่มรถ");
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>🚘 เพิ่มรถคันใหม่</h2>
      
      <form onSubmit={handleSubmit} style={styles.form}>
        
        {/* ================= ส่วนของ ยี่ห้อรถ (Brand) ================= */}
        <div style={styles.formGroup}>
          <label style={styles.label}>ยี่ห้อ (Brand)</label>
          <select 
            style={styles.select} 
            required 
            value={isNewBrand ? 'other' : formData.Brand} 
            onChange={(e) => {
              if (e.target.value === 'other') {
                setIsNewBrand(true);
                setIsNewModel(true); // พอยี่ห้อใหม่ รุ่นก็ต้องพิมพ์ใหม่ด้วย
                setFormData({...formData, Brand: '', Model: ''}); 
                setModelOptions([]);
              } else {
                setIsNewBrand(false);
                setIsNewModel(false);
                setFormData({...formData, Brand: e.target.value, Model: ''});
                fetchModels(e.target.value); // ไปดึงรุ่นของยี่ห้อนี้มา
              }
            }}
          >
            <option value="">-- กรุณาเลือกยี่ห้อ --</option>
            {brandOptions.map(b => <option key={b} value={b}>{b}</option>)}
            {/* ซ่อนตัวเลือกอื่นๆ ไว้ ถ้าไม่ใช่ Admin */}
            {isAdmin && <option value="other" style={{ fontWeight: 'bold', color: '#e67e22' }}>+ อื่นๆ (เพิ่มยี่ห้อใหม่)</option>}
          </select>

          {/* กล่องให้พิมพ์ยี่ห้อใหม่ จะโผล่มาเมื่อ Admin เลือก "อื่นๆ" */}
          {isNewBrand && (
            <input 
              type="text" 
              placeholder="พิมพ์ยี่ห้อรถใหม่..." 
              style={{...styles.input, marginTop: '8px', border: '2px solid #e67e22'}} 
              required 
              value={formData.Brand}
              onChange={e => setFormData({...formData, Brand: e.target.value})}
            />
          )}
        </div>

        {/* ================= ส่วนของ รุ่นรถ (Model) ================= */}
        <div style={styles.formGroup}>
          <label style={styles.label}>รุ่น (Model)</label>
          {isNewBrand || isNewModel ? (
            <input 
              type="text" 
              placeholder="พิมพ์รุ่นรถ..." 
              style={isNewModel ? {...styles.input, border: '2px solid #e67e22'} : styles.input} 
              required 
              value={formData.Model}
              onChange={e => setFormData({...formData, Model: e.target.value})}
            />
          ) : (
            <select 
              style={styles.select} 
              required 
              value={formData.Model}
              onChange={(e) => {
                if (e.target.value === 'other') {
                  setIsNewModel(true);
                  setFormData({...formData, Model: ''});
                } else {
                  setFormData({...formData, Model: e.target.value});
                }
              }}
            >
              <option value="">-- กรุณาเลือกรุ่น --</option>
              {modelOptions.map(m => <option key={m} value={m}>{m}</option>)}
              {isAdmin && <option value="other" style={{ fontWeight: 'bold', color: '#e67e22' }}>+ อื่นๆ (เพิ่มรุ่นใหม่)</option>}
            </select>
          )}
        </div>

        {/* ================= ส่วนอื่นๆ คงเดิม ================= */}
        <div style={styles.formGroup}>
          <label style={styles.label}>ทะเบียนรถ</label>
          <input type="text" name="vehicle_registration" required onChange={handleChange} style={styles.input} />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>ประเภทรถ</label>
          <select name="Vehicle_Type" onChange={handleChange} style={styles.select}>
            <option value="รถยนต์ส่วนบุคคล">รถยนต์ส่วนบุคคล</option>
            <option value="รถจักรยานยนต์">รถจักรยานยนต์</option>
            <option value="รถกระบะ">รถกระบะ</option>
            <option value="อื่นๆ">อื่นๆ</option>
          </select>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>รูปภาพรถ</label>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange} 
            style={styles.input} 
          />
        </div>

        <button type="submit" style={styles.submitBtn}>บันทึกข้อมูลรถ</button>
      </form>
    </div>
  );
};

const styles = {
  container: { maxWidth: '600px', margin: '0 auto', padding: '30px', backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontWeight: 'bold', color: '#34495e' },
  input: { padding: '12px', borderRadius: '5px', border: '1px solid #bdc3c7', fontSize: '16px', boxSizing: 'border-box' },
  select: { padding: '12px', borderRadius: '5px', border: '1px solid #bdc3c7', fontSize: '16px', backgroundColor: 'white', boxSizing: 'border-box' },
  submitBtn: { padding: '12px', backgroundColor: '#2C3E50', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px', transition: '0.3s' }
};

export default AddVehicle;