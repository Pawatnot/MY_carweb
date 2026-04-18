import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  // เช็คว่ามีข้อมูล user ในเครื่องไหม
//   const user = localStorage.getItem('user');

//   // ถ้ามี user ให้แสดงหน้านั้นๆ (children)
//   // ถ้าไม่มี ให้ดีดกลับไปหน้า /login
//   return user ? children : <Navigate to="/login" />;

    return children;
};

export default PrivateRoute;