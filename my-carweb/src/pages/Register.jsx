import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({
    Name: '', Email: '', Password: '', PhoneNum: ''
  });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // ยิงข้อมูลไปที่ Node.js Backend
      const response = await axios.post('http://localhost:5000/register', formData);
      alert(response.data.message);
      navigate('/login'); // สมัครเสร็จแล้วเด้งไปหน้า Login
    } catch (error) {
      console.error(error);
      alert("สมัครสมาชิกไม่สำเร็จ หรืออีเมลนี้ถูกใช้ไปแล้ว");
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h2 style={{textAlign: 'center'}}>สมัครสมาชิกใหม่</h2>
        
        <label>ชื่อ-นามสกุล</label>
        <input type="text" placeholder="ชื่อ-นามสกุล" onChange={e => setFormData({...formData, Name: e.target.value})} style={styles.input} required />
        
        <label>อีเมล</label>
        <input type="email" placeholder="Email" onChange={e => setFormData({...formData, Email: e.target.value})} style={styles.input} required />
        
        <label>รหัสผ่าน</label>
        <input type="password" placeholder="ตั้งรหัสผ่าน" onChange={e => setFormData({...formData, Password: e.target.value})} style={styles.input} required />
        
        <label>เบอร์โทรศัพท์</label>
        <input type="text" placeholder="08x-xxx-xxxx" onChange={e => setFormData({...formData, PhoneNum: e.target.value})} style={styles.input} required />
        
        <button type="submit" style={styles.button}>ยืนยันการสมัคร</button>
        
        <p style={{textAlign: 'center', marginTop: '10px'}}>
          มีบัญชีอยู่แล้ว? <Link to="/login">เข้าสู่ระบบที่นี่</Link>
        </p>
      </form>
    </div>
  );
};

const styles = {
  container: { display: 'flex', justifyContent: 'center', marginTop: '50px' },
  form: { display: 'flex', flexDirection: 'column', width: '350px', gap: '10px', padding: '30px', border: '1px solid #ddd', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', backgroundColor: 'white' },
  input: { padding: '10px', borderRadius: '5px', border: '1px solid #ccc' },
  button: { padding: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' }
};

export default Register;