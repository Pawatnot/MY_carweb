import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

const EditVehicle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);

  const [brandOptions, setBrandOptions] = useState([]);
  const [modelOptions, setModelOptions] = useState([]);
  
  const [isNewBrand, setIsNewBrand] = useState(false);
  const [isNewModel, setIsNewModel] = useState(false);

  const [formData, setFormData] = useState({
    Brand: '',
    Model: '',
    vehicle_registration: '',
    Vehicle_Type: 'รถเก๋ง'
  });

  useEffect(() => {
    const adminStatus = localStorage.getItem('is_admin');
    setIsAdmin(adminStatus === '1');
    fetchBrands();
    fetchVehicleData();
  }, [id]);

  const fetchVehicleData = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/vehicles/${id}`);
      const vehicle = res.data;
      
      setFormData({
        Brand: vehicle.Brand,
        Model: vehicle.Model,
        vehicle_registration: vehicle.vehicle_registration,
        Vehicle_Type: vehicle.Vehicle_Type
      });
      
      if (vehicle.Vehicle_image) {
        setCurrentImage(vehicle.Vehicle_image);
      }

      if (vehicle.Brand) {
        fetchModels(vehicle.Brand);
      }
    } catch (error) {
      console.error("Error fetching vehicle:", error);
      alert("ไม่สามารถดึงข้อมูลรถได้");
    }
  };

  const fetchBrands = async () => {
    try {
      const res = await axios.get('http://localhost:5000/vehicle-brands');
      setBrandOptions(res.data.length > 0 ? res.data : ['Honda', 'Toyota', 'Isuzu', 'Yamaha']);
    } catch (err) { console.error(err); }
  };

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
    try {
      const data = new FormData();
      data.append('Brand', formData.Brand);
      data.append('Model', formData.Model);
      data.append('vehicle_registration', formData.vehicle_registration);
      data.append('Vehicle_Type', formData.Vehicle_Type);

      if (selectedFile) {
        data.append('image', selectedFile); 
      }

      await axios.put(`http://localhost:5000/vehicles/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      alert("อัปเดตข้อมูลรถสำเร็จ");
      navigate('/vehicles');
    } catch (error) {
      console.error("Error updating vehicle:", error);
      alert("เกิดข้อผิดพลาดในการอัปเดตข้อมูล");
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>แก้ไขข้อมูลยานพาหนะ</h2>
      
      <form onSubmit={handleSubmit} style={styles.form}>
        
        <div style={styles.formGroup}>
          <label style={styles.label}>ยี่ห้อ (Brand)</label>
          <select 
            style={styles.select} 
            required 
            value={isNewBrand ? 'other' : formData.Brand} 
            onChange={(e) => {
              if (e.target.value === 'other') {
                setIsNewBrand(true);
                setIsNewModel(true);
                setFormData({...formData, Brand: '', Model: ''}); 
                setModelOptions([]);
              } else {
                setIsNewBrand(false);
                setIsNewModel(false);
                setFormData({...formData, Brand: e.target.value, Model: ''});
                fetchModels(e.target.value);
              }
            }}
          >
            <option value="">-- กรุณาเลือกยี่ห้อ --</option>
            {brandOptions.map(b => <option key={b} value={b}>{b}</option>)}
            {isAdmin && <option value="other" style={{ fontWeight: 'bold', color: '#e67e22' }}>+ อื่นๆ (เพิ่มยี่ห้อใหม่)</option>}
          </select>

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

        <div style={styles.formGroup}>
          <label style={styles.label}>ทะเบียนรถ</label>
          <input type="text" name="vehicle_registration" value={formData.vehicle_registration} required onChange={handleChange} style={styles.input} />
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
          <label style={styles.label}>รูปภาพรถ (เลือกใหม่เพื่อเปลี่ยน)</label>
          {currentImage && !selectedFile && (
            <div style={{ marginBottom: '10px' }}>
              <img src={`http://localhost:5000/uploads/${currentImage}`} alt="Current Vehicle" style={{ width: '150px', borderRadius: '8px', border: '1px solid #bdc3c7' }} />
            </div>
          )}
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange} 
            style={styles.input} 
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button type="submit" style={styles.submitBtn}>บันทึกการแก้ไข</button>
          <button type="button" onClick={() => navigate('/vehicles')} style={styles.cancelBtn}>ยกเลิก</button>
        </div>
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
  submitBtn: { flex: 1, padding: '12px', backgroundColor: '#2C3E50', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' },
  cancelBtn: { flex: 1, padding: '12px', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' }
};

export default EditVehicle;