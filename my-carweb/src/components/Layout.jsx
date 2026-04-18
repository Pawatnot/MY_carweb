import React from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { Outlet } from 'react-router-dom'; // Outlet คือจุดที่จะเอาเนื้อหาแต่ละหน้ามาเสียบ

const Layout = () => {
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