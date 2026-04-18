import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import VehicleList from './pages/VehicleList';
import AddVehicle from './pages/AddVehicle';
import EditVehicle from './pages/EditVehicle';
import Profile from './pages/Profile'; 
// import Maintenance from './pages/Maintenance';
import Documents from './pages/Documents';     
import Expenses from './pages/Expenses';     
import Notification from './pages/Notification';     
import Schedules from './pages/Schedules';     

// เรียกใช้ตัวช่วยที่เราเพิ่งสร้าง
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';

function App() {
  return (
    <Router>
      <Routes>
        {/* 🟢 โซนสาธารณะ (ใครก็เข้าได้ และไม่มี Sidebar) */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* 🔴 โซนส่วนตัว (ต้อง Login ก่อน + มี Sidebar/Navbar) */}
        <Route element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }>
          {/* หน้าเหล่านี้จะถูกยัดลงไปใน <Outlet /> ของ Layout */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/vehicles" element={<VehicleList />} />
          <Route path="/add-vehicle" element={<AddVehicle />} />
          <Route path="/edit-vehicle/:id" element={<EditVehicle />} />
          
          {/* ✅ เพิ่ม Route หน้า Profile ตรงนี้ครับ */}
          <Route path="/profile" element={<Profile />} />
          {/* <Route path="/maintenance" element={<Maintenance />} /> */}
          <Route path="/documents" element={<Documents />} />
          <Route path="/Expenses" element={<Expenses />} />
          
          {/* ✅ เพิ่ม Route หน้าแจ้งเตือน (เผื่อไว้สำหรับปุ่มกระดิ่ง) */}
          <Route path="/Schedules" element={<Schedules />} /> 
          <Route path="/Notification" element={<Notification />} /> 
        </Route>

      </Routes>
    </Router>
  );
}

export default App;