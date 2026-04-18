import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

const EditVehicle = () => {
  const { id } = useParams(); // รับ ID รถที่จะแก้จาก URL
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    Brand: '', Model: '', vehicle_registration: '', Vehicle_Type: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [oldImage, setOldImage] = useState(null); // เอาไว้โชว์รูปเดิม

  // ดึงข้อมูลเก่ามาใส่ฟอร์ม
  useEffect(() => {
    axios.get('http://localhost:5000/vehicles')
      .then(res => {
        // หาข้อมูลรถคันที่ตรงกับ ID
        const car = res.data.find(c => c.Vehicle_id == id);
        if (car) {
          setFormData({
            Brand: car.Brand,
            Model: car.Model,
            vehicle_registration: car.vehicle_registration,
            Vehicle_Type: car.Vehicle_Type
          });
          setOldImage(car.Vehicle_image);
        }
      })
      .catch(err => console.error(err));
  }, [id]);

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

      // ใช้ PUT แทน POST
      await axios.put(`http://localhost:5000/vehicles/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      alert("แก้ไขข้อมูลเรียบร้อย!");
      navigate('/vehicles');
    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาด");
    }
  };

  return (
    <div style={styles.container}>
      <h2>✏️ แก้ไขข้อมูลรถ</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        
        {/* โชว์รูปเดิมให้ดู */}
        {oldImage && !selectedFile && (
           <div style={{textAlign: 'center'}}>
             <p>รูปปัจจุบัน:</p>
             <img src={`http://localhost:5000/uploads/${oldImage}`} alt="Old" style={{width: '150px', borderRadius: '10px'}}/>
           </div>
        )}

        <label>ยี่ห้อ</label>
        <input type="text" value={formData.Brand} onChange={e => setFormData({...formData, Brand: e.target.value})} style={styles.input} />

        <label>รุ่น</label>
        <input type="text" value={formData.Model} onChange={e => setFormData({...formData, Model: e.target.value})} style={styles.input} />

        <label>ทะเบียน</label>
        <input type="text" value={formData.vehicle_registration} onChange={e => setFormData({...formData, vehicle_registration: e.target.value})} style={styles.input} />

        <label>ประเภท</label>
        <select value={formData.Vehicle_Type} onChange={e => setFormData({...formData, Vehicle_Type: e.target.value})} style={styles.input}>
            <option value="รถเก๋ง">รถเก๋ง</option>
            <option value="รถจักรยานยนต์">รถจักรยานยนต์</option>
            <option value="รถกระบะ">รถกระบะ</option>
            <option value="อื่นๆ">อื่นๆ</option>
        </select>

        <label>เปลี่ยนรูปภาพ (ถ้าต้องการ)</label>
        <input type="file" onChange={e => setSelectedFile(e.target.files[0])} style={styles.input} />

        <button type="submit" style={styles.saveBtn}>บันทึกการแก้ไข</button>
        <button type="button" onClick={() => navigate('/vehicles')} style={styles.cancelBtn}>ยกเลิก</button>
      </form>
    </div>
  );
};

const styles = {
  container: { maxWidth: '500px', margin: '20px auto', padding: '30px', backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  input: { padding: '10px', border: '1px solid #ccc', borderRadius: '5px' },
  saveBtn: { padding: '10px', backgroundColor: '#f39c12', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
  cancelBtn: { padding: '10px', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '5px' }
};

export default EditVehicle;