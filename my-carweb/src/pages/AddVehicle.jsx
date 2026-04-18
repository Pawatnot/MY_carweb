import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AddVehicle = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // 1. เพิ่ม State สำหรับเก็บไฟล์รูปภาพ
  const [selectedFile, setSelectedFile] = useState(null);

  const [formData, setFormData] = useState({
    Brand: '',
    Model: '',
    vehicle_registration: '',
    Vehicle_Type: 'รถยนต์ส่วนบุคคล'
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      alert("กรุณาเข้าสู่ระบบก่อนเพิ่มรถ");
      navigate('/login');
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 2. ฟังก์ชันเมื่อมีการเลือกไฟล์
  const handleFileChange = (e) => {
    // เก็บไฟล์ตัวจริงไว้ใน State (e.target.files[0] คือไฟล์แรกที่เลือก)
    setSelectedFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      // 3. สร้าง FormData (ซองเอกสารสำหรับส่งไฟล์)
      const data = new FormData();
      
      // ยัดข้อมูลตัวหนังสือลงซอง
      data.append('User_id', user.User_id);
      data.append('Brand', formData.Brand);
      data.append('Model', formData.Model);
      data.append('vehicle_registration', formData.vehicle_registration);
      data.append('Vehicle_Type', formData.Vehicle_Type);

      // ยัดไฟล์รูปภาพลงซอง (ถ้ามีการเลือก)
      if (selectedFile) {
        data.append('image', selectedFile); 
      }

      // 4. ส่งไปที่ Backend (ต้องกำหนด header เป็น multipart/form-data)
      await axios.post('http://localhost:5000/vehicles', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      alert("🎉 เพิ่มรถและรูปภาพสำเร็จแล้ว!");
      navigate('/vehicles');
    } catch (error) {
      console.error("Error adding vehicle:", error);
      alert("เกิดข้อผิดพลาดในการเพิ่มรถ");
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}> เพิ่มรถคันใหม่</h2>
      
      <form onSubmit={handleSubmit} style={styles.form}>
        {/* ... ช่องกรอกข้อความอื่นๆ เหมือนเดิม ... */}
        <div style={styles.formGroup}>
          <label style={styles.label}>ยี่ห้อ (Brand)</label>
          <input type="text" name="Brand" required onChange={handleChange} style={styles.input} />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>รุ่น (Model)</label>
          <input type="text" name="Model" required onChange={handleChange} style={styles.input} />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>ทะเบียนรถ</label>
          <input type="text" name="vehicle_registration" required onChange={handleChange} style={styles.input} />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>ประเภทรถ</label>
          <select name="Vehicle_Type" onChange={handleChange} style={styles.select}>
            <option value="รถเก๋ง">รถเก๋ง</option>
            <option value="รถจักรยานยนต์">รถจักรยานยนต์</option>
            <option value="รถกระบะ">รถกระบะ</option>
            <option value="อื่นๆ">อื่นๆ</option>
          </select>
        </div>

        {/* 5. เพิ่มช่อง Input สำหรับเลือกไฟล์ */}
        <div style={styles.formGroup}>
          <label style={styles.label}>รูปภาพรถ (ถ้ามี)</label>
          <input 
            type="file" 
            accept="image/*" // บังคับให้เลือกได้เฉพาะไฟล์รูป
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
  container: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '30px',
    backgroundColor: 'white',
    borderRadius: '10px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
  },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontWeight: 'bold', color: '#34495e' },
  input: { padding: '12px', borderRadius: '5px', border: '1px solid #bdc3c7', fontSize: '16px' },
  select: { padding: '12px', borderRadius: '5px', border: '1px solid #bdc3c7', fontSize: '16px', backgroundColor: 'white' },
  submitBtn: {
    padding: '12px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '10px'
  }
};

export default AddVehicle;