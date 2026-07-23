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
  
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  
  // State สำหรับหน้าต่างจัดการข้อมูล
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);

  const [newBrandInput, setNewBrandInput] = useState('');
  const [adminSelectedBrand, setAdminSelectedBrand] = useState('');
  const [newModelInput, setNewModelInput] = useState('');

  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
  const [notifyText, setNotifyText] = useState('');

  const [pendingRequests, setPendingRequests] = useState([]);
  const [isBellOpen, setIsBellOpen] = useState(false);

  const [formData, setFormData] = useState({
    Brand: '', Model: '', vehicle_registration: '', Vehicle_Type: 'รถเก๋ง'
  });

  useEffect(() => {
    const storedUserId = localStorage.getItem('user_id');
    const adminStatus = localStorage.getItem('is_admin');
    
    if (storedUserId) {
      setUserId(storedUserId);
      setIsAdmin(adminStatus === '1');
      fetchBrandsData(); 
      
      if (adminStatus === '1') fetchRequests();
    } else {
      alert("กรุณาเข้าสู่ระบบก่อน");
      navigate('/login');
    }
  }, [navigate]);

  const fetchRequests = async () => {
    try {
      const res = await axios.get('http://localhost:5000/notifications');
      setPendingRequests(res.data);
    } catch (err) { console.error(err); }
  };

  const handleDeleteRequest = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/notifications/${id}`);
      setPendingRequests(pendingRequests.filter(req => req.id !== id));
    } catch (err) { alert("เกิดข้อผิดพลาดในการลบการแจ้งเตือน"); }
  };

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

  // ================= ฟังก์ชันจัดการแก้ไขและลบ =================
  const handleEditBrand = async (oldBrand) => {
    const newBrand = window.prompt(`แก้ไขชื่อยี่ห้อ (เดิม: ${oldBrand}):`, oldBrand);
    if (!newBrand || newBrand === oldBrand) return;
    try {
      await axios.put(`http://localhost:5000/api/brands/${oldBrand}`, { newBrand });
      fetchBrandsData();
    } catch (error) { alert(error.response?.data?.message || 'เกิดข้อผิดพลาด'); }
  };

  const handleDeleteBrand = async (brand) => {
    if (!window.confirm(`คำเตือน: คุณต้องการลบยี่ห้อ "${brand}" พร้อมรุ่นรถทั้งหมดข้างในใช่หรือไม่?`)) return;
    try {
      await axios.delete(`http://localhost:5000/api/brands/${brand}`);
      if (formData.Brand === brand) setFormData({...formData, Brand: '', Model: ''});
      fetchBrandsData();
    } catch (error) { alert('เกิดข้อผิดพลาด'); }
  };

  const handleEditModel = async (brand, oldModel) => {
    const newModel = window.prompt(`แก้ไขชื่อรุ่นของยี่ห้อ ${brand} (เดิม: ${oldModel}):`, oldModel);
    if (!newModel || newModel === oldModel) return;
    try {
      await axios.put(`http://localhost:5000/api/brands/${brand}/models/${oldModel}`, { newModel });
      fetchBrandsData();
    } catch (error) { alert(error.response?.data?.message || 'เกิดข้อผิดพลาด'); }
  };

  const handleDeleteModel = async (brand, model) => {
    if (!window.confirm(`ยืนยันการลบรุ่น "${model}" ออกจากยี่ห้อ ${brand} หรือไม่?`)) return;
    try {
      await axios.delete(`http://localhost:5000/api/brands/${brand}/models/${model}`);
      if (formData.Model === model) setFormData({...formData, Model: ''});
      fetchBrandsData();
    } catch (error) { alert('เกิดข้อผิดพลาด'); }
  };

  // ================= ฟังก์ชันเพิ่มข้อมูล =================
  const handleAdminSaveBrand = async (e) => {
    e.preventDefault();
    if (!newBrandInput.trim()) return alert('กรุณาพิมพ์ยี่ห้อ');
    try {
      await axios.post('http://localhost:5000/api/brands', { brand: newBrandInput });
      fetchBrandsData(); setIsBrandModalOpen(false); setNewBrandInput('');
    } catch (error) { alert('เกิดข้อผิดพลาด'); }
  };

  const handleAdminSaveModel = async (e) => {
    e.preventDefault();
    if (!adminSelectedBrand || !newModelInput.trim()) return alert('กรุณาเลือกยี่ห้อและพิมพ์รุ่น');
    try {
      await axios.post('http://localhost:5000/api/brands', { brand: adminSelectedBrand, model: newModelInput });
      fetchBrandsData(); setIsModelModalOpen(false); setNewModelInput(''); setAdminSelectedBrand('');
    } catch (error) { alert(error.response?.data?.message || 'เกิดข้อผิดพลาด'); }
  };

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
    
    try {
      const data = new FormData();
      data.append('User_id', userId); 
      data.append('Brand', formData.Brand);
      data.append('Model', formData.Model);
      data.append('vehicle_registration', formData.vehicle_registration);
      data.append('Vehicle_Type', formData.Vehicle_Type);
      if (selectedFile) data.append('image', selectedFile); 

      await axios.post('http://localhost:5000/vehicles', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      alert("เพิ่มรถสำเร็จแล้ว!"); navigate('/vehicles');
    } catch (error) { alert("เกิดข้อผิดพลาดในการเพิ่มรถ"); }
  };

  return (
    <div style={styles.container}>
      
      {isAdmin && (
        <div style={styles.adminPanel}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
            <div>
              <h4 style={{ margin: '0 0 5px 0', color: '#d35400' }}>ส่วนจัดการตัวเลือก (เฉพาะแอดมิน)</h4>
              <p style={{ fontSize: '13px', color: '#7f8c8d', margin: 0 }}>เพิ่มยี่ห้อหรือรุ่นรถได้ทันที</p>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button onClick={() => setIsManageModalOpen(true)} style={styles.manageBtn}>
                จัดการข้อมูล
              </button>
              
              <div style={{ position: 'relative' }}>
                <button onClick={() => setIsBellOpen(!isBellOpen)} style={styles.bellBtn}>
                  แจ้งเตือน 
                  {pendingRequests.length > 0 && <span style={styles.badge}>{pendingRequests.length}</span>}
                </button>
                {isBellOpen && (
                  <div style={styles.notificationDropdown}>
                    <h5 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>ข้อความคำขอจากผู้ใช้</h5>
                    {pendingRequests.length === 0 ? (
                      <p style={{ fontSize: '13px', color: '#7f8c8d', textAlign: 'center', margin: 0 }}>ไม่มีแจ้งเตือนใหม่</p>
                    ) : (
                      pendingRequests.map((req) => (
                        <div key={req.id} style={styles.notificationItem}>
                          <p style={{ margin: '0 0 5px 0', fontSize: '14px', fontWeight: 'bold' }}>{req.message}</p>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '11px', color: '#95a5a6' }}>{req.date}</span>
                            <button onClick={() => handleDeleteRequest(req.id)} style={styles.clearBtn}>ลบทิ้ง</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={() => setIsBrandModalOpen(true)} style={styles.adminBtn}>+ เพิ่มยี่ห้อใหม่</button>
            <button type="button" onClick={() => setIsModelModalOpen(true)} style={styles.adminBtn}>+ เพิ่มรุ่นรถใหม่</button>
          </div>
        </div>
      )}

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

        <div style={styles.formGroup}>
          <label style={styles.label}>ทะเบียนรถ</label>
          <input type="text" name="vehicle_registration" required onChange={handleChange} style={styles.input} />
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

      {/* ================= Popup: หน้าต่างจัดการข้อมูล (แก้ไข/ลบ) ================= */}
      {isManageModalOpen && isAdmin && (
        <div style={styles.modalOverlay}>
          <div style={{...styles.modalContent, width: '450px', maxHeight: '80vh', overflowY: 'auto'}}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, color: '#2c3e50' }}>จัดการยี่ห้อและรุ่นรถ</h3>
              <button onClick={() => setIsManageModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✖</button>
            </div>
            
            {brandOptions.length === 0 ? <p style={{textAlign: 'center', color: '#7f8c8d'}}>ยังไม่มีข้อมูลในระบบ</p> : null}
            
            {brandOptions.map(brand => (
              <div key={brand} style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', paddingBottom: '5px', borderBottom: '2px solid #dee2e6' }}>
                  <strong style={{ fontSize: '16px', color: '#d35400' }}>{brand}</strong>
                  <div>
                    <button onClick={() => handleEditBrand(brand)} style={styles.iconBtnText}>แก้ไข</button>
                    <button onClick={() => handleDeleteBrand(brand)} style={{...styles.iconBtnText, color: '#c0392b'}}>ลบ</button>
                  </div>
                </div>
                
                {brandsData[brand].length === 0 ? <span style={{fontSize: '13px', color: '#aaa'}}>ไม่มีรุ่นรถ</span> : null}
                
                {brandsData[brand].map(model => (
                  <div key={model} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0 5px 15px', fontSize: '14px' }}>
                    <span>- {model}</span>
                    <div>
                      <button onClick={() => handleEditModel(brand, model)} style={{...styles.iconBtnText, fontSize: '12px'}}>แก้ไข</button>
                      <button onClick={() => handleDeleteModel(brand, model)} style={{...styles.iconBtnText, color: '#c0392b', fontSize: '12px'}}>ลบ</button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Popup อื่นๆ */}
      {isBrandModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={{ marginTop: 0 }}>เพิ่มยี่ห้อใหม่</h3>
            <input type="text" value={newBrandInput} onChange={(e) => setNewBrandInput(e.target.value)} placeholder="พิมพ์ยี่ห้อ..." style={styles.modalInput} autoFocus />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setIsBrandModalOpen(false)} style={styles.cancelBtn}>ปิด</button>
              <button onClick={handleAdminSaveBrand} style={styles.saveBtn}>บันทึก</button>
            </div>
          </div>
        </div>
      )}

      {isModelModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={{ marginTop: 0 }}>เพิ่มรุ่นรถใหม่</h3>
            <select value={adminSelectedBrand} onChange={(e) => setAdminSelectedBrand(e.target.value)} style={{...styles.modalInput, marginBottom: '10px'}}>
              <option value="">-- เลือกยี่ห้อก่อน --</option>
              {brandOptions.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <input type="text" value={newModelInput} onChange={(e) => setNewModelInput(e.target.value)} placeholder="พิมพ์รุ่น..." style={styles.modalInput} />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setIsModelModalOpen(false)} style={styles.cancelBtn}>ปิด</button>
              <button onClick={handleAdminSaveModel} style={styles.saveBtn}>บันทึก</button>
            </div>
          </div>
        </div>
      )}

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
  adminPanel: { backgroundColor: '#fef5e7', padding: '15px', borderRadius: '8px', marginBottom: '25px', border: '1px dashed #f39c12', position: 'relative' },
  adminBtn: { padding: '8px 12px', backgroundColor: '#e67e22', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
  
  manageBtn: { padding: '8px 15px', backgroundColor: '#ecf0f1', border: '1px solid #bdc3c7', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', color: '#2c3e50', fontSize: '13px' },
  iconBtnText: { background: 'none', border: 'none', color: '#3498db', cursor: 'pointer', fontSize: '13px', marginLeft: '10px' },

  bellBtn: { padding: '8px 15px', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', color: '#333', position: 'relative', display: 'flex', alignItems: 'center', gap: '5px' },
  badge: { backgroundColor: '#e74c3c', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '11px', position: 'absolute', top: '-5px', right: '-5px' },
  notificationDropdown: { position: 'absolute', top: '40px', right: '0', backgroundColor: 'white', width: '280px', borderRadius: '8px', boxShadow: '0 5px 15px rgba(0,0,0,0.2)', padding: '15px', zIndex: 100, maxHeight: '300px', overflowY: 'auto' },
  notificationItem: { backgroundColor: '#f9f9f9', padding: '10px', borderRadius: '6px', marginBottom: '10px', borderLeft: '3px solid #e74c3c' },
  clearBtn: { background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: '11px', textDecoration: 'underline' },

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