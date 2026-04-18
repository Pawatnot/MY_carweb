import axios from 'axios';

// ตั้งค่า URL หลักของ Node.js Backend ที่น๊อตรันอยู่ที่พอร์ต 5000
const api = axios.create({
  baseURL: 'http://localhost:5000'
});

// ฟังก์ชันดึงรายการรถจากฐานข้อมูล
export const getVehicles = async () => {
  try {
    const response = await api.get('/vehicles');
    return response.data;
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการดึงข้อมูลรถ:", error);
    throw error;
  }
};

export default api;