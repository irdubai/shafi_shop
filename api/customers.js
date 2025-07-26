// =====================================================
// API مدیریت مشتریان
// =====================================================

import { executeQuery } from '../lib/db.js';

export default async function handler(req, res) {
  // تنظیم CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getCustomers(req, res);
      case 'POST':
        return await createCustomer(req, res);
      case 'PUT':
        return await updateCustomer(req, res);
      case 'DELETE':
        return await deleteCustomer(req, res);
      default:
        return res.status(405).json({
          success: false,
          message: 'Method not allowed'
        });
    }
  } catch (error) {
    console.error('Customers API Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}

// دریافت لیست مشتریان
async function getCustomers(req, res) {
  const { search, type, city, status, limit = 100, offset = 0 } = req.query;

  let query = `
    SELECT 
      id, customer_code, name, company, phone, email, city, address,
      balance_type, balance, currency, customer_type, is_active, notes,
      created_at, updated_at
    FROM customers 
    WHERE 1=1
  `;
  const params = [];

  // فیلتر جستجو
  if (search) {
    query += ` AND (name LIKE ? OR company LIKE ? OR customer_code LIKE ?)`;
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  // فیلتر نوع مشتری
  if (type && type !== 'all') {
    query += ` AND customer_type = ?`;
    params.push(type);
  }

  // فیلتر شهر
  if (city && city !== 'all') {
    query += ` AND city = ?`;
    params.push(city);
  }

  // فیلتر وضعیت
  if (status && status !== 'all') {
    query += ` AND is_active = ?`;
    params.push(status === 'active' ? 1 : 0);
  }

  query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), parseInt(offset));

  const result = await executeQuery(query, params);

  if (!result.success) {
    return res.status(500).json({
      success: false,
      message: 'خطا در دریافت لیست مشتریان',
      error: result.error
    });
  }

  // دریافت تعداد کل برای pagination
  let countQuery = `SELECT COUNT(*) as total FROM customers WHERE 1=1`;
  const countParams = [];
  
  if (search) {
    countQuery += ` AND (name LIKE ? OR company LIKE ? OR customer_code LIKE ?)`;
    const searchTerm = `%${search}%`;
    countParams.push(searchTerm, searchTerm, searchTerm);
  }
  
  if (type && type !== 'all') {
    countQuery += ` AND customer_type = ?`;
    countParams.push(type);
  }
  
  if (city && city !== 'all') {
    countQuery += ` AND city = ?`;
    countParams.push(city);
  }
  
  if (status && status !== 'all') {
    countQuery += ` AND is_active = ?`;
    countParams.push(status === 'active' ? 1 : 0);
  }

  const countResult = await executeQuery(countQuery, countParams);
  const total = countResult.success ? countResult.data[0]?.total || 0 : 0;

  return res.status(200).json({
    success: true,
    data: result.data,
    pagination: {
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasMore: (parseInt(offset) + parseInt(limit)) < total
    }
  });
}

// ایجاد مشتری جدید
async function createCustomer(req, res) {
  const {
    customer_code,
    name,
    company,
    phone,
    email,
    city,
    address,
    balance_type = 'creditor',
    balance = 0,
    currency = 'AED',
    customer_type = 'retail',
    is_active = true,
    notes
  } = req.body;

  // اعتبارسنجی
  if (!customer_code || !name) {
    return res.status(400).json({
      success: false,
      message: 'کد مشتری و نام الزامی است'
    });
  }

  // بررسی تکراری نبودن کد مشتری
  const existingCustomer = await executeQuery(
    'SELECT id FROM customers WHERE customer_code = ?',
    [customer_code]
  );

  if (existingCustomer.success && existingCustomer.data.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'کد مشتری تکراری است'
    });
  }

  const query = `
    INSERT INTO customers (
      customer_code, name, company, phone, email, city, address,
      balance_type, balance, currency, customer_type, is_active, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    customer_code, name, company, phone, email, city, address,
    balance_type, parseFloat(balance), currency, customer_type, is_active, notes
  ];

  const result = await executeQuery(query, params);

  if (!result.success) {
    return res.status(500).json({
      success: false,
      message: 'خطا در ایجاد مشتری جدید',
      error: result.error
    });
  }

  // دریافت مشتری ایجاد شده
  const newCustomer = await executeQuery(
    'SELECT * FROM customers WHERE id = ?',
    [result.insertId]
  );

  return res.status(201).json({
    success: true,
    message: 'مشتری با موفقیت ایجاد شد',
    data: newCustomer.success ? newCustomer.data[0] : null
  });
}

// بروزرسانی مشتری
async function updateCustomer(req, res) {
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({
      success: false,
      message: 'شناسه مشتری الزامی است'
    });
  }

  const {
    customer_code,
    name,
    company,
    phone,
    email,
    city,
    address,
    balance_type,
    balance,
    currency,
    customer_type,
    is_active,
    notes
  } = req.body;

  // بررسی وجود مشتری
  const existingCustomer = await executeQuery(
    'SELECT * FROM customers WHERE id = ?',
    [id]
  );

  if (!existingCustomer.success || existingCustomer.data.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'مشتری یافت نشد'
    });
  }

  // بررسی تکراری نبودن کد مشتری اگر تغییر کرده باشد
  if (customer_code && customer_code !== existingCustomer.data[0].customer_code) {
    const duplicateCheck = await executeQuery(
      'SELECT id FROM customers WHERE customer_code = ? AND id != ?',
      [customer_code, id]
    );

    if (duplicateCheck.success && duplicateCheck.data.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'کد مشتری تکراری است'
      });
    }
  }

  const query = `
    UPDATE customers SET
      customer_code = ?, name = ?, company = ?, phone = ?, email = ?,
      city = ?, address = ?, balance_type = ?, balance = ?, currency = ?,
      customer_type = ?, is_active = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  const params = [
    customer_code || existingCustomer.data[0].customer_code,
    name || existingCustomer.data[0].name,
    company || existingCustomer.data[0].company,
    phone || existingCustomer.data[0].phone,
    email || existingCustomer.data[0].email,
    city || existingCustomer.data[0].city,
    address || existingCustomer.data[0].address,
    balance_type || existingCustomer.data[0].balance_type,
    balance !== undefined ? parseFloat(balance) : existingCustomer.data[0].balance,
    currency || existingCustomer.data[0].currency,
    customer_type || existingCustomer.data[0].customer_type,
    is_active !== undefined ? is_active : existingCustomer.data[0].is_active,
    notes !== undefined ? notes : existingCustomer.data[0].notes,
    id
  ];

  const result = await executeQuery(query, params);

  if (!result.success) {
    return res.status(500).json({
      success: false,
      message: 'خطا در بروزرسانی مشتری',
      error: result.error
    });
  }

  // دریافت مشتری بروزرسانی شده
  const updatedCustomer = await executeQuery(
    'SELECT * FROM customers WHERE id = ?',
    [id]
  );

  return res.status(200).json({
    success: true,
    message: 'مشتری با موفقیت بروزرسانی شد',
    data: updatedCustomer.success ? updatedCustomer.data[0] : null
  });
}

// حذف مشتری
async function deleteCustomer(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: 'شناسه مشتری الزامی است'
    });
  }

  // بررسی وجود مشتری
  const existingCustomer = await executeQuery(
    'SELECT * FROM customers WHERE id = ?',
    [id]
  );

  if (!existingCustomer.success || existingCustomer.data.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'مشتری یافت نشد'
    });
  }

  // بررسی استفاده در فاکتورها
  const invoiceCheck = await executeQuery(
    'SELECT COUNT(*) as count FROM invoices WHERE customer_id = ?',
    [id]
  );

  if (invoiceCheck.success && invoiceCheck.data[0]?.count > 0) {
    return res.status(400).json({
      success: false,
      message: 'این مشتری در فاکتورها استفاده شده و قابل حذف نیست'
    });
  }

  const result = await executeQuery(
    'DELETE FROM customers WHERE id = ?',
    [id]
  );

  if (!result.success) {
    return res.status(500).json({
      success: false,
      message: 'خطا در حذف مشتری',
      error: result.error
    });
  }

  return res.status(200).json({
    success: true,
    message: 'مشتری با موفقیت حذف شد'
  });
}
