'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function HistoryPage() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchSales();
  }, []);

  // ดึงข้อมูลการขายทั้งหมด เรียงจากล่าสุดไปเก่าสุด
  async function fetchSales() {
    setLoading(true);
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .order('sold_at', { ascending: false });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setSales(data);
      setErrorMsg('');
    }
    setLoading(false);
  }

  // รวมยอดขายทั้งหมดจาก total_price ของทุกรายการ
  const grandTotal = sales.reduce((sum, s) => sum + Number(s.total_price), 0);

  // แปลง timestamp ให้อ่านง่ายแบบไทย
  function formatDateTime(value) {
    const date = new Date(value);
    return date.toLocaleString('th-TH', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }

  return (
    <div>
      <h1>ประวัติการขาย</h1>

      <div className="card">
        <p style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: 0 }}>
          ยอดขายรวมทั้งหมด: {grandTotal.toFixed(2)} บาท
        </p>
      </div>

      {errorMsg && <p style={{ color: 'red' }}>เกิดข้อผิดพลาด: {errorMsg}</p>}

      {loading ? (
        <p>กำลังโหลดข้อมูล...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>วันเวลาที่ขาย</th>
              <th>ชื่อสินค้า</th>
              <th>จำนวน</th>
              <th>ยอดรวม</th>
            </tr>
          </thead>
          <tbody>
            {sales.length === 0 && (
              <tr>
                <td colSpan={4}>ยังไม่มีประวัติการขาย</td>
              </tr>
            )}
            {sales.map((s) => (
              <tr key={s.id}>
                <td>{formatDateTime(s.sold_at)}</td>
                <td>{s.product_name}</td>
                <td>{s.quantity}</td>
                <td>{Number(s.total_price).toFixed(2)} บาท</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
