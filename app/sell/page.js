'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function SellPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [selectedId, setSelectedId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  // ดึงรายการสินค้าทั้งหมดมาไว้ใน dropdown
  async function fetchProducts() {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setProducts(data);
      setErrorMsg('');
    }
    setLoading(false);
  }

  // สินค้าที่เลือกอยู่ในปัจจุบัน
  const selectedProduct = products.find((p) => p.id === selectedId);

  // คำนวณยอดรวม = ราคา x จำนวน
  const qtyNumber = parseInt(quantity, 10) || 0;
  const totalPrice = selectedProduct ? selectedProduct.price * qtyNumber : 0;

  function resetForm() {
    setSelectedId('');
    setQuantity('');
  }

  // กดปุ่ม "ขาย"
  async function handleSell(e) {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedProduct) {
      alert('กรุณาเลือกสินค้า');
      return;
    }
    if (qtyNumber <= 0) {
      alert('กรุณากรอกจำนวนให้ถูกต้อง');
      return;
    }

    // ตรวจสอบ stock คงเหลือเพียงพอหรือไม่
    if (qtyNumber > selectedProduct.stock) {
      alert(
        `สินค้าคงเหลือไม่เพียงพอ (คงเหลือ ${selectedProduct.stock} ${selectedProduct.unit})`
      );
      return;
    }

    setSubmitting(true);

    // 1. บันทึกรายการขายลงตาราง sales
    const { error: saleError } = await supabase.from('sales').insert([
      {
        product_id: selectedProduct.id,
        product_name: selectedProduct.name,
        quantity: qtyNumber,
        total_price: totalPrice,
        sold_at: new Date().toISOString(),
      },
    ]);

    if (saleError) {
      setErrorMsg('บันทึกการขายไม่สำเร็จ: ' + saleError.message);
      setSubmitting(false);
      return;
    }

    // 2. อัปเดต stock ของสินค้าให้ลดลงตามจำนวนที่ขาย
    const newStock = selectedProduct.stock - qtyNumber;
    const { error: stockError } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', selectedProduct.id);

    if (stockError) {
      setErrorMsg('อัปเดตสต๊อกไม่สำเร็จ: ' + stockError.message);
      setSubmitting(false);
      return;
    }

    setSuccessMsg(
      `ขาย "${selectedProduct.name}" จำนวน ${qtyNumber} ${selectedProduct.unit} สำเร็จ`
    );
    resetForm();
    fetchProducts(); // โหลดข้อมูลสินค้าใหม่ให้ stock อัปเดตบนหน้าจอ
    setSubmitting(false);
  }

  return (
    <div>
      <h1>ขายสินค้า</h1>

      {loading ? (
        <p>กำลังโหลดข้อมูลสินค้า...</p>
      ) : (
        <div className="card">
          <form onSubmit={handleSell}>
            <div className="form-row">
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
              >
                <option value="">-- เลือกสินค้า --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.price} บาท)
                  </option>
                ))}
              </select>

              <input
                type="number"
                placeholder="จำนวน"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>

            {selectedProduct && (
              <div style={{ marginBottom: 12 }}>
                <p>
                  ราคาต่อหน่วย: {selectedProduct.price} บาท / {selectedProduct.unit}
                </p>
                <p>คงเหลือในสต๊อก: {selectedProduct.stock} {selectedProduct.unit}</p>
                <p style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                  ยอดรวม: {totalPrice.toFixed(2)} บาท
                </p>
              </div>
            )}

            <button type="submit" disabled={submitting}>
              {submitting ? 'กำลังบันทึก...' : 'ขาย'}
            </button>
          </form>
        </div>
      )}

      {successMsg && <p style={{ color: 'green' }}>{successMsg}</p>}
      {errorMsg && <p style={{ color: 'red' }}>เกิดข้อผิดพลาด: {errorMsg}</p>}
    </div>
  );
}
