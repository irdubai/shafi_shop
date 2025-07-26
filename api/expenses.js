// =====================================================
// API مدیریت هزینه‌ها
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
        return await getExpenses(req, res);
      case 'POST':
        return await createExpense(req, res);
      case 'PUT':
        return await updateExpense(req, res);
      case 'DELETE':
        return await deleteExpense(req, res);
      default:
        return res.status(405).json({
          success: false,
          message: 'Method not allowed'
        });
    }
  } catch (error) {
    console.error('Expenses API Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}

// دریافت لیست هزینه‌ها
async function getExpenses(req, res) {
  const { 
    search, 
    category, 
    payment_method, 
    date_from, 
    date_to, 
    limit = 100, 
    offset = 0 
  } = req.query;

  let query = `
    SELECT 
      id, date, description, amount, currency, category, 
      payment_method, notes, created_at, updated_at
    FROM expenses 
    WHERE 1=1
  `;
  const params = [];

  // فیلتر جستجو
  if (search) {
    query += ` AND description LIKE ?`;
    params.push(`%${search}%`);
  }

  // فیلتر دسته‌بندی
  if (category && category !== 'all') {
    query += ` AND category = ?`;
    params.push(category);
  }

  // فیلتر روش پرداخت
  if (payment_method && payment_method !== 'all') {
    query += ` AND payment_method = ?`;
    params.push(payment_method);
  }

  // فیلتر تاریخ
  if (date_from) {
    query += ` AND date >= ?`;
    params.push(date_from);
  }

  if (date_to) {
    query += ` AND date <= ?`;
    params.push(date_to);
  }

  query += ` ORDER BY date DESC, created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), parseInt(offset));

  const result = await executeQuery(query, params);

  if (!result.success) {
    return res.status(500).json({
      success: false,
      message: 'خطا در دریافت لیست هزینه‌ها',
      error: result.error
    });
  }

  // دریافت تعداد کل
  let countQuery = `SELECT COUNT(*) as total FROM expenses WHERE 1=1`;
  const countParams = [];
  
  if (search) {
    countQuery += ` AND description LIKE ?`;
    countParams.push(`%${search}%`);
  }
  
  if (category && category !== 'all') {
    countQuery += ` AND category = ?`;
    countParams.push(category);
  }
  
  if (payment_method && payment_method !== 'all') {
    countQuery += ` AND payment_method = ?`;
    countParams.push(payment_method);
  }
  
  if (date_from) {
    countQuery += ` AND date >= ?`;
    countParams.push(date_from);
  }
  
  if (date_to) {
    countQuery += ` AND date <= ?`;
    countParams.push(date_to);
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

// ایجاد هزینه جدید
async function createExpense(req, res) {
  const {
    date,
    description,
    amount,
    currency = 'AED',
    category,
    payment_method,
    notes
  } = req.body;

  // اعتبارسنجی
  if (!date || !description || !amount || !category || !payment_method) {
    return res.status(400).json({
      success: false,
      message: 'تاریخ، شرح، مبلغ، دسته‌بندی و روش پرداخت الزامی است'
    });
  }

  if (parseFloat(amount) <= 0) {
    return res.status(400).json({
      success: false,
      message: 'مبلغ باید بزرگتر از صفر باشد'
    });
  }

  const query = `
    INSERT INTO expenses (
      date, description, amount, currency, category, payment_method, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    date, description, parseFloat(amount), currency, category, payment_method, notes
  ];

  const result = await executeQuery(query, params);

  if (!result.success) {
    return res.status(500).json({
      success: false,
      message: 'خطا در ایجاد هزینه جدید',
      error: result.error
    });
  }

  // دریافت هزینه ایجاد شده
  const newExpense = await executeQuery(
    'SELECT * FROM expenses WHERE id = ?',
    [result.insertId]
  );

  return res.status(201).json({
    success: true,
    message: 'هزینه با موفقیت ایجاد شد',
    data: newExpense.success ? newExpense.data[0] : null
  });
}

// بروزرسانی هزینه
async function updateExpense(req, res) {
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({
      success: false,
      message: 'شناسه هزینه الزامی است'
    });
  }

  // بررسی وجود هزینه
  const existingExpense = await executeQuery(
    'SELECT * FROM expenses WHERE id = ?',
    [id]
  );

  if (!existingExpense.success || existingExpense.data.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'هزینه یافت نشد'
    });
  }

  const {
    date,
    description,
    amount,
    currency,
    category,
    payment_method,
    notes
  } = req.body;

  const current = existingExpense.data[0];

  // اعتبارسنجی مبلغ
  if (amount !== undefined && parseFloat(amount) <= 0) {
    return res.status(400).json({
      success: false,
      message: 'مبلغ باید بزرگتر از صفر باشد'
    });
  }

  const query = `
    UPDATE expenses SET
      date = ?, description = ?, amount = ?, currency = ?, category = ?,
      payment_method = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  const params = [
    date || current.date,
    description || current.description,
    amount !== undefined ? parseFloat(amount) : current.amount,
    currency || current.currency,
    category || current.category,
    payment_method || current.payment_method,
    notes !== undefined ? notes : current.notes,
    id
  ];

  const result = await executeQuery(query, params);

  if (!result.success) {
    return res.status(500).json({
      success: false,
      message: 'خطا در بروزرسانی هزینه',
      error: result.error
    });
  }

  // دریافت هزینه بروزرسانی شده
  const updatedExpense = await executeQuery(
    'SELECT * FROM expenses WHERE id = ?',
    [id]
  );

  return res.status(200).json({
    success: true,
    message: 'هزینه با موفقیت بروزرسانی شد',
    data: updatedExpense.success ? updatedExpense.data[0] : null
  });
}

// حذف هزینه
async function deleteExpense(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: 'شناسه هزینه الزامی است'
    });
  }

  // بررسی وجود هزینه
  const existingExpense = await executeQuery(
    'SELECT * FROM expenses WHERE id = ?',
    [id]
  );

  if (!existingExpense.success || existingExpense.data.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'هزینه یافت نشد'
    });
  }

  const result = await executeQuery(
    'DELETE FROM expenses WHERE id = ?',
    [id]
  );

  if (!result.success) {
    return res.status(500).json({
      success: false,
      message: 'خطا در حذف هزینه',
      error: result.error
    });
  }

  return res.status(200).json({
    success: true,
    message: 'هزینه با موفقیت حذف شد'
  });
}
