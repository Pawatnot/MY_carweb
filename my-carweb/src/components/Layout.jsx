import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { Outlet } from 'react-router-dom'; // Outlet คือจุดที่จะเอาเนื้อหาแต่ละหน้ามาเสียบ

const Layout = () => {
  // สร้าง state คอยเก็บค่าสิทธิ์ admin เพื่อให้คอมโพเนนต์รู้ว่ามีการเปลี่ยนแปลง
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem('is_admin') === '1');

  // ใช้ useEffect คอยตรวจจับการเปลี่ยนแปลงของ localStorage (เผื่อมีการอัปเดตสิทธิ์)
  useEffect(() => {
    const handleStorageChange = () => {
      setIsAdmin(localStorage.getItem('is_admin') === '1');
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: '250px', backgroundColor: '#f4f6f9', minHeight: '100vh' }}>
        <Navbar />
        <div style={{ padding: '30px' }}>
          {/* Outlet จะเปลี่ยนไปเรื่อยๆ ตามหน้า Dashboard, Vehicles ฯลฯ */}
          <Outlet /> 
        </div>
      </div>
    </div>
  );
};

export default Layout;