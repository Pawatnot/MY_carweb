import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AdminSettings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('vehicles');

  // State สำหรับยานพาหนะ
  const [brandsData, setBrandsData] = useState({});
  const [brandOptions, setBrandOptions] = useState([]);
  const [newBrandInput, setNewBrandInput] = useState('');
  const [adminSelectedBrand, setAdminSelectedBrand] = useState('');
  const [newModelInput, setNewModelInput] = useState('');
  const [expandedBrand, setExpandedBrand] = useState(null);

  // State สำหรับประเภทรายจ่าย
  const [categories, setCategories] = useState([]);
  const [expenseType, setExpenseType] = useState('ชิ้นส่วน');
  const [expenseName, setExpenseName] = useState('');

  // State สำหรับควบคุม Modal แก้ไขข้อมูล 
  const [editModal, setEditModal] = useState({
    isOpen: false,
    type: '', // 'brand', 'model', 'category'
    originalValue: '',
    parentBrand: '', 
    categoryId: '' 
  });
  const [editInputValue, setEditInputValue] = useState('');

  useEffect(() => {
    const isAdmin = localStorage.getItem('is_admin');
    if (isAdmin !== '1') {
      alert("เฉพาะผู้ดูแลระบบเท่านั้น");
      navigate('/');
      return;
    }
    fetchBrandsData();
    fetchCategories();
  }, [navigate]);

  const fetchBrandsData = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/brands');
      setBrandsData(res.data);
      setBrandOptions(Object.keys(res.data));
    } catch (err) { console.error(err); }
  };

  const handleSaveBrand = async (e) => {
    e.preventDefault();
    if (!newBrandInput.trim()) return alert('กรุณาพิมพ์ยี่ห้อ');
    try {
      await axios.post('http://localhost:5000/api/brands', { brand: newBrandInput });
      fetchBrandsData(); setNewBrandInput('');
    } catch (error) { alert('เกิดข้อผิดพลาด'); }
  };

  const handleSaveModel = async (e) => {
    e.preventDefault();
    if (!adminSelectedBrand || !newModelInput.trim()) return alert('กรุณาเลือกยี่ห้อและพิมพ์รุ่น');
    try {
      await axios.post('http://localhost:5000/api/brands', { brand: adminSelectedBrand, model: newModelInput });
      fetchBrandsData(); setNewModelInput(''); setAdminSelectedBrand('');
      setExpandedBrand(adminSelectedBrand);
    } catch (error) { alert(error.response?.data?.message || 'เกิดข้อผิดพลาด'); }
  };

  const openEditModal = (type, originalValue, extraParams = {}) => {
    setEditModal({ isOpen: true, type, originalValue, ...extraParams });
    setEditInputValue(originalValue);
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    const newValue = editInputValue.trim();
    if (!newValue || newValue === editModal.originalValue) {
      setEditModal({ ...editModal, isOpen: false });
      return;
    }

    try {
      if (editModal.type === 'brand') {
        await axios.put(`http://localhost:5000/api/brands/${editModal.originalValue}`, { newBrand: newValue });
        fetchBrandsData();
        if (expandedBrand === editModal.originalValue) setExpandedBrand(newValue);
      } 
      else if (editModal.type === 'model') {
        await axios.put(`http://localhost:5000/api/brands/${editModal.parentBrand}/models/${editModal.originalValue}`, { newModel: newValue });
        fetchBrandsData();
      } 
      else if (editModal.type === 'category') {
        await axios.put(`http://localhost:5000/expense-categories/${editModal.categoryId}`, { expenses_type: newValue });
        fetchCategories();
      }
      setEditModal({ ...editModal, isOpen: false });
    } catch (error) {
      alert(error.response?.data?.message || 'เกิดข้อผิดพลาดในการแก้ไข');
    }
  };

  const handleDeleteBrand = async (brand) => {
    if (!window.confirm(`คำเตือน: คุณต้องการลบยี่ห้อ "${brand}" พร้อมรุ่นรถทั้งหมดข้างในใช่หรือไม่?`)) return;
    try {
      await axios.delete(`http://localhost:5000/api/brands/${brand}`);
      fetchBrandsData();
      if(expandedBrand === brand) setExpandedBrand(null);
    } catch (error) { alert('เกิดข้อผิดพลาด'); }
  };

  const handleDeleteModel = async (brand, model) => {
    if (!window.confirm(`ยืนยันการลบรุ่น "${model}" ออกจากยี่ห้อ ${brand} หรือไม่?`)) return;
    try {
      await axios.delete(`http://localhost:5000/api/brands/${brand}/models/${model}`);
      fetchBrandsData();
    } catch (error) { alert('เกิดข้อผิดพลาด'); }
  };

  const toggleExpand = (brand) => {
    if (expandedBrand === brand) {
      setExpandedBrand(null);
    } else {
      setExpandedBrand(brand);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('http://localhost:5000/expense-categories');
      setCategories(response.data);
    } catch (error) { console.error(error); }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!expenseName.trim()) return alert('กรุณาพิมพ์ชื่อประเภท');
    try {
      await axios.post('http://localhost:5000/expense-categories', {
        is_document: expenseType === 'เอกสาร' ? 1 : 0, 
        expenses_type: expenseName 
      });
      fetchCategories(); setExpenseName('');
    } catch (error) { alert("เกิดข้อผิดพลาด"); }
  };

  // ✅ ฟังก์ชันสำหรับลบประเภทรายจ่าย
  const handleDeleteCategory = async (id, name) => {
    if (!window.confirm(`ยืนยันการลบประเภทรายจ่าย "${name}" ใช่หรือไม่?\n\n(หมายเหตุ: หากประเภทนี้ถูกใช้งานไปแล้ว จะไม่สามารถลบได้)`)) return;
    try {
      await axios.delete(`http://localhost:5000/expense-categories/${id}`);
      fetchCategories();
    } catch (error) { 
      alert(error.response?.data?.message || "เกิดข้อผิดพลาดในการลบ (อาจมีข้อมูลรายจ่ายที่ใช้ประเภทนี้อยู่)"); 
    }
  };

  const handleToggleCategory = async (id, currentStatus) => {
    try {
      await axios.put(`http://localhost:5000/expense-categories/${id}/toggle`, {
        is_active: currentStatus === 1 || currentStatus === true || currentStatus === null ? 0 : 1
      });
      fetchCategories();
    } catch (error) { alert("เกิดข้อผิดพลาดในการเปลี่ยนสถานะ"); }
  };

  // ชุดไอคอน SVG
  const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );

  const DeleteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );

  const ChevronIcon = ({ expanded }) => (
    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
    </svg>
  );

  return (
    <div style={styles.container}>
      <h2 style={{ color: '#2C3E50', marginBottom: '20px' }}>ตั้งค่าระบบ (ข้อมูลพื้นฐาน)</h2>
      
      <div style={styles.tabContainer}>
        <button onClick={() => setActiveTab('vehicles')} style={activeTab === 'vehicles' ? styles.activeTab : styles.inactiveTab}>ยี่ห้อและรุ่นรถ</button>
        <button onClick={() => setActiveTab('expenses')} style={activeTab === 'expenses' ? styles.activeTab : styles.inactiveTab}>ประเภทรายจ่าย</button>
      </div>

      {activeTab === 'vehicles' && (
        <div style={styles.contentGrid}>
          <div>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>+ เพิ่มยี่ห้อรถใหม่</h3>
              <form onSubmit={handleSaveBrand} style={{ display: 'flex', gap: '10px' }}>
                <input type="text" value={newBrandInput} onChange={e => setNewBrandInput(e.target.value)} placeholder="พิมพ์ยี่ห้อ..." style={styles.input} />
                <button type="submit" style={styles.saveBtn}>บันทึก</button>
              </form>
            </div>

            <div style={{...styles.card, marginTop: '20px'}}>
              <h3 style={styles.cardTitle}>+ เพิ่มรุ่นรถใหม่</h3>
              <form onSubmit={handleSaveModel} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <select value={adminSelectedBrand} onChange={e => setAdminSelectedBrand(e.target.value)} style={styles.input}>
                  <option value="">-- เลือกยี่ห้อก่อน --</option>
                  {brandOptions.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="text" value={newModelInput} onChange={e => setNewModelInput(e.target.value)} placeholder="พิมพ์รุ่น..." style={styles.input} />
                  <button type="submit" style={styles.saveBtn}>บันทึก</button>
                </div>
              </form>
            </div>
          </div>

          <div style={styles.card}>
            <h3 style={styles.cardTitle}>ข้อมูลยี่ห้อและรุ่นรถในระบบ</h3>
            <div style={{ maxHeight: '500px', overflowY: 'auto', paddingRight: '10px' }}>
              {brandOptions.length === 0 ? <p style={{color: '#7f8c8d'}}>ยังไม่มีข้อมูลในระบบ</p> : null}
              
              {brandOptions.map(brand => {
                const isExpanded = expandedBrand === brand;
                return (
                  <div key={brand} style={{ ...styles.listItem, padding: '0', overflow: 'hidden' }}>
                    <div 
                      onClick={() => toggleExpand(brand)}
                      style={{ 
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                        padding: '15px', cursor: 'pointer', backgroundColor: isExpanded ? '#F8FAFC' : 'transparent',
                        transition: 'background-color 0.2s', width: '100%', boxSizing: 'border-box'
                      }}
                    >
                      <strong style={{ fontSize: '16px', color: '#d35400', display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                        <span style={{ color: '#94a3b8', display: 'flex' }}><ChevronIcon expanded={isExpanded} /></span> 
                        {brand}
                      </strong>
                      <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 'bold' }}>
                        {brandsData[brand]?.length || 0} รุ่น
                      </span>
                    </div>
                    
                    {isExpanded && (
                      <div style={{ padding: '15px', borderTop: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px', gap: '10px' }}>
                          <button onClick={() => openEditModal('brand', brand)} style={styles.modernEditBtn}>
                            <EditIcon /> แก้ไขชื่อยี่ห้อ
                          </button>
                          <button onClick={() => handleDeleteBrand(brand)} style={styles.modernDeleteBtn}>
                            <DeleteIcon /> ลบยี่ห้อนี้ทิ้ง
                          </button>
                        </div>
                        
                        {brandsData[brand].length === 0 ? <span style={{fontSize: '13px', color: '#94a3b8'}}>ยังไม่มีข้อมูลรุ่นรถ</span> : null}
                        
                        {brandsData[brand].map(model => (
                          <div key={model} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 10px 10px 15px', fontSize: '14px', borderBottom: '1px dashed #F1F5F9' }}>
                            <span style={{ color: '#334155', fontWeight: 'bold' }}>- {model}</span>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button onClick={() => openEditModal('model', model, { parentBrand: brand })} style={styles.iconOnlyEditBtn} title="แก้ไขรุ่น">
                                <EditIcon />
                              </button>
                              <button onClick={() => handleDeleteModel(brand, model)} style={styles.iconOnlyDeleteBtn} title="ลบรุ่น">
                                <DeleteIcon />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'expenses' && (
        <div style={styles.contentGrid}>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>+ เพิ่มประเภทรายจ่ายใหม่</h3>
            <form onSubmit={handleAddCategory} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{fontWeight: 'bold', fontSize: '14px', marginBottom: '5px', display: 'block'}}>หมวดหมู่รายจ่าย:</label>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <label><input type="radio" checked={expenseType === 'ชิ้นส่วน'} onChange={() => setExpenseType('ชิ้นส่วน')} /> ชิ้นส่วน</label>
                  <label><input type="radio" checked={expenseType === 'เอกสาร'} onChange={() => setExpenseType('เอกสาร')} /> เอกสาร</label>
                </div>
              </div>
              <div>
                <label style={{fontWeight: 'bold', fontSize: '14px', marginBottom: '5px', display: 'block'}}>ชื่อประเภท:</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="text" value={expenseName} onChange={e => setExpenseName(e.target.value)} required style={styles.input} />
                  <button type="submit" style={styles.saveBtn}>บันทึก</button>
                </div>
              </div>
            </form>
          </div>

          <div style={styles.card}>
            <h3 style={styles.cardTitle}>ประเภทรายจ่ายในระบบ</h3>
            <div style={{ maxHeight: '500px', overflowY: 'auto', paddingRight: '10px' }}>
              {categories.map(cat => {
                const isActive = cat.is_active === 1 || cat.is_active === true || cat.is_active === null;
                return (
                  <div key={cat.expenses_type_id} style={{ ...styles.listItem, backgroundColor: isActive ? '#F0FDF4' : '#F8FAFC', border: `1px solid ${isActive ? '#BBF7D0' : '#E2E8F0'}`, padding: '15px' }}>
                    <div>
                      <strong style={{ display: 'block', color: '#1E293B', fontSize: '15px' }}>{cat.expenses_type}</strong>
                      <span style={{ fontSize: '12px', color: '#64748B' }}>หมวดหมู่: {cat.is_document === 1 ? 'เอกสาร' : 'ชิ้นส่วน'}</span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <button onClick={() => openEditModal('category', cat.expenses_type, { categoryId: cat.expenses_type_id })} style={styles.modernEditBtn}>
                        <EditIcon /> แก้ไข
                      </button>
                      
                      {/* ✅ ปุ่มลบประเภทรายจ่าย */}
                      <button onClick={() => handleDeleteCategory(cat.expenses_type_id, cat.expenses_type)} style={styles.modernDeleteBtn}>
                        <DeleteIcon /> ลบ
                      </button>

                      <div style={{ width: '1px', height: '24px', backgroundColor: '#CBD5E1', margin: '0 5px' }}></div>
                      
                      <div onClick={() => handleToggleCategory(cat.expenses_type_id, cat.is_active)} style={{ width: '50px', height: '26px', borderRadius: '26px', backgroundColor: isActive ? '#22C55E' : '#EF4444', position: 'relative', cursor: 'pointer', flexShrink: 0 }}>
                        <span style={{ position: 'absolute', left: '6px', top: '50%', transform: 'translateY(-50%)', color: 'white', fontSize: '11px', opacity: isActive ? 1 : 0 }}>✓</span>
                        <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: 'white', fontSize: '11px', opacity: isActive ? 0 : 1 }}>✕</span>
                        <div style={{ width: '20px', height: '20px', backgroundColor: 'white', borderRadius: '50%', position: 'absolute', top: '3px', left: isActive ? '27px' : '3px', transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {editModal.isOpen && (
        <div style={styles.modalOverlay} onClick={() => setEditModal({ ...editModal, isOpen: false })}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, color: '#1E293B', marginBottom: '15px', borderBottom: '2px solid #F1F5F9', paddingBottom: '10px' }}>
              {editModal.type === 'brand' && `แก้ไขยี่ห้อรถ (เดิม: ${editModal.originalValue})`}
              {editModal.type === 'model' && `แก้ไขรุ่นรถ ${editModal.parentBrand} (เดิม: ${editModal.originalValue})`}
              {editModal.type === 'category' && `แก้ไขประเภทรายจ่าย (เดิม: ${editModal.originalValue})`}
            </h3>
            
            <form onSubmit={submitEdit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input
                type="text"
                value={editInputValue}
                onChange={e => setEditInputValue(e.target.value)}
                style={styles.modalInput}
                autoFocus
                required
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setEditModal({ ...editModal, isOpen: false })} style={styles.cancelBtn}>ยกเลิก</button>
                <button type="submit" style={styles.saveBtn}>บันทึกการแก้ไข</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { padding: '30px', backgroundColor: '#F9F8F4', minHeight: '100vh', boxSizing: 'border-box' },
  tabContainer: { display: 'flex', gap: '10px', marginBottom: '25px', borderBottom: '1px solid #E2E8F0', paddingBottom: '10px' },
  activeTab: { padding: '10px 20px', backgroundColor: '#2C3E50', color: 'white', border: 'none', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' },
  inactiveTab: { padding: '10px 20px', backgroundColor: '#FFFFFF', color: '#64748B', border: '1px solid #CBD5E1', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' },
  contentGrid: { display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '20px' },
  card: { backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.03)', border: '1px solid #F0EAE1' },
  cardTitle: { marginTop: 0, borderBottom: '2px solid #F1F5F9', paddingBottom: '10px', color: '#1E293B' },
  input: { flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', outline: 'none' },
  saveBtn: { padding: '10px 20px', backgroundColor: '#0EA5E9', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: '0.2s' },
  listItem: { backgroundColor: '#FFFFFF', borderRadius: '10px', border: '1px solid #E2E8F0', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' },
  
  modernEditBtn: { display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', backgroundColor: '#F0F9FF', color: '#0284C7', border: '1px solid #BAE6FD', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', transition: '0.2s' },
  modernDeleteBtn: { display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', transition: '0.2s' },
  iconOnlyEditBtn: { background: '#F0F9FF', border: '1px solid #BAE6FD', color: '#0284C7', cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', transition: '0.2s' },
  iconOnlyDeleteBtn: { background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', transition: '0.2s' },

  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(3px)' },
  modalContent: { backgroundColor: 'white', padding: '25px', borderRadius: '12px', width: '90%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' },
  modalInput: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '15px', boxSizing: 'border-box', outline: 'none' },
  cancelBtn: { padding: '10px 15px', backgroundColor: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }
};

export default AdminSettings;