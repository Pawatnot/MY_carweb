import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const Login = () => {
  const [formData, setFormData] = useState({
    Email: '', 
    Password: ''
  });
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // 1. ยิงข้อมูลไปตรวจสอบกับหลังบ้าน
      const response = await axios.post('http://localhost:5000/login', formData);
      
      if (response.data.status === 'success') {
        // 2. ✅ บันทึกข้อมูลลงเครื่อง (ปรับให้ตรงกับ Backend ใหม่)
        localStorage.setItem('user_id', response.data.user_id);
        localStorage.setItem('name', response.data.name);
        
        // 🌟 บรรทัดนี้สำคัญมาก: เก็บสิทธิ์ is_admin (0 หรือ 1) ไว้ใช้ซ่อน/โชว์เมนู
        localStorage.setItem('is_admin', response.data.is_admin); 

        // (แถม) เก็บแบบเก่าเผื่อ Navbar หรือหน้าอื่นของน๊อตยังเรียกใช้แบบเดิมอยู่ จะได้ไม่พังครับ
        const userData = { Name: response.data.name, is_admin: response.data.is_admin };
        localStorage.setItem('user', JSON.stringify(userData)); 
        
        alert("เข้าสู่ระบบสำเร็จ! ยินดีต้อนรับ " + response.data.name);
        
        // 3. เปลี่ยนหน้า + รีโหลดเพื่อให้อัปเดตข้อมูล
        window.location.href = '/'; 
      }

    } catch (error) {
      alert("อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่");
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h2 style={{textAlign: 'center', color: '#333'}}>เข้าสู่ระบบ</h2>
        
        <label>อีเมล</label>
        <input 
          type="email" 
          placeholder="Email" 
          onChange={e => setFormData({...formData, Email: e.target.value})} 
          style={styles.input} 
          required 
        />
        
        <label>รหัสผ่าน</label>
        <input 
          type="password" 
          placeholder="กรอกรหัสผ่าน" 
          onChange={e => setFormData({...formData, Password: e.target.value})} 
          style={styles.input} 
          required 
        />
        
        <button type="submit" style={styles.button}>Login</button>

        <p style={{textAlign: 'center', marginTop: '15px'}}>
          ยังไม่มีบัญชี? <Link to="/register" style={{color: '#3498db'}}>สมัครสมาชิกที่นี่</Link>
        </p>
      </form>
    </div>
  );
};

const styles = {
  container: { display: 'flex', justifyContent: 'center', marginTop: '50px' },
  form: { display: 'flex', flexDirection: 'column', width: '300px', gap: '10px', padding: '30px', border: '1px solid #ddd', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', backgroundColor: 'white' },
  input: { padding: '10px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '16px' },
  button: { padding: '10px', backgroundColor: '#2c3e50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px', fontSize: '16px' }
};

export default Login;