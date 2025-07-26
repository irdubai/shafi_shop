// =====================================================
// API مدیریت پرداخت‌ها
// =====================================================

import { executeQuery, executeTransaction } from '../lib/db.js';

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
        return await getPayments(req, res);
      case 'POST':
        return await createPayment(req, res);
      case 'PUT':
        return await updatePayment(req, res);
      case 'DELETE':
        return await deletePayment(req, res);
      default:
        return res.status(405).json({
          success: false,
          message: 'Method not allowed'
        });
    }
  } catch (error) {
    console.error('Payments API Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}

// دریافت لیست پرداخت‌ها
async function getPayments(req, res) {
  const { 
    search, 
    payment_type, 
    status, 
    customer_id, 
    invoice_id,
    date_from, 
    date_to, 
    limit = 100, 
    offset = 0 
  } = req.query;

  let query = `
    SELECT 
      p.id, p.date, p.customer_id, p.invoice_id, p.amount, p.currency,
      p.payment_type, p.reference_number, p.status, p.description,
      p.created_at, p.updated_at,
      c.name as customer_name, c.company as customer_company,
      i.invoice_number
    FROM payments p
    LEFT JOIN customers c ON p.customer_id = c.id
    LEFT JOIN invoices i ON p.invoice_id = i.id
    WHERE 1=1
  `;
  const params = [];

  // فیلتر جستجو
  if (search) {
    query += ` AND (c.name LIKE ? OR c.company LIKE ? OR p.reference_number LIKE ? OR i.invoice_number LIKE ?)`;
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  // فیلتر نوع پرداخت
  if (payment_type && payment_type !== 'all') {
    query += ` AND p.payment_type = ?`;
    params.push(payment_type);
  }

  // فیلتر وضعیت
  if (status && status !== 'all') {
    query += ` AND p.status = ?`;
    params.push(status);
  }

  // فیلتر مشتری
  if (customer_id) {
    query += ` AND p.customer_id = ?`;
    params.push(customer_id);
  }

  // فیلتر فاکتور
  if (invoice_id) {
    query += ` AND p.invoice_id = ?`;
    params.push(invoice_id);
  }

  // فیلتر تاریخ
  if (date_from) {
    query += ` AND p.date >= ?`;
    params.push(date_from);
  }

  if (date_to) {
    query += ` AND p.date <= ?`;
    params.push(date_to);
  }

  query += ` ORDER BY p.date DESC, p.created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), parseInt(offset));

  const result = await executeQuery(query, params);

  if (!result.success) {
    return res.status(500).json({
      success: false,
      message: 'خطا در دریافت لیست پرداخت‌ها',
      error: result.error
    });
  }

  // دریافت خلاصه پرداخت‌ها
  const summaryResult = await executeQuery(`
    SELECT 
      payment_type,
      SUM(CASE WHEN status = 'confirmed' THEN amount ELSE 0 END) as confirmed_amount,
      SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount,
      COUNT(*) as total_count
    FROM payments
    ${date_from ? 'WHERE date >= ?' : ''}
    ${date_to ? (date_from ? 'AND date <= ?' : 'WHERE date <= ?') : ''}
    GROUP BY payment_type
  `, date_from && date_to ? [date_from, date_to] : date_from ? [date_from] : date_to ? [date_to] : []);

  return res.status(200).json({
    success: true,
    data: result.data,
    summary: summaryResult.success ? summaryResult.data : [],
    pagination: {
      limit: parseInt(limit),
      offset: parseInt(offset),
      total: result.data.length
    }
  });
}

// ایجاد پرداخت جدید
async function createPayment(req, res) {
  const {
    date,
    customer_id,
    invoice_id,
    amount,
    currency = 'AED',
    payment_type,
    reference_number,
    status = 'confirmed',
    description
  } = req.body;

  // اعتبارسنجی
  if (!date || !customer_id || !amount || !payment_type) {
    return res.status(400).json({
      success: false,
      message: 'تاریخ، مشتری، مبلغ و نوع پرداخت الزامی است'
    });
  }

  if (parseFloat(amount) <= 0) {
    return res.status(400).json({
      success: false,
      message: 'مبلغ باید بزرگتر از صفر باشد'
    });
  }

  // بررسی وجود مشتری
  const customerCheck = await executeQuery(
    'SELECT id FROM customers WHERE id = ?',
    [customer_id]
  );

  if (!customerCheck.success || customerCheck.data.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'مشتری یافت نشد'
    });
  }

  // بررسی وجود فاکتور (در صورت ارسال)
  let invoiceData = null;
  if (invoice_id) {
    const invoiceCheck = await executeQuery(
      'SELECT id, total, paid_amount, remaining FROM invoices WHERE id = ? AND customer_id = ?',
      [invoice_id, customer_id]
    );

    if (!invoiceCheck.success || invoiceCheck.data.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'فاکتور یافت نشد یا متعلق به مشتری دیگری است'
      });
    }

    invoiceData = invoiceCheck.data[0];

    // بررسی عدم تجاوز از مانده فاکتور
    if (parseFloat(amount) > parseFloat(invoiceData.remaining)) {
      return res.status(400).json({
        success: false,
        message: 'مبلغ پرداخت نمی‌تواند بیشتر از مانده فاکتور باشد'
      });
    }
  }

  const queries = [];

  // ایجاد پرداخت
  queries.push({
    query: `
      INSERT INTO payments (
        date, customer_id, invoice_id, amount, currency, payment_type,
        reference_number, status, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    params: [
      date, customer_id, invoice_id, parseFloat(amount), currency,
      payment_type, reference_number, status, description
    ]
  });

  // بروزرسانی مانده فاکتور (اگر پرداخت تایید شده باشد)
  if (invoice_id && status === 'confirmed') {
    const newPaidAmount = parseFloat(invoiceData.paid_amount) + parseFloat(amount);
    const newRemaining = parseFloat(invoiceData.total) - newPaidAmount;
    const newStatus = newRemaining <= 0 ? 'paid' : 'confirmed';

    queries.push({
      query: `
        UPDATE invoices SET
          paid_amount = ?, remaining = ?, status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      params: [newPaidAmount, newRemaining, newStatus, invoice_id]
    });
  }

  const result = await executeTransaction(queries);

  if (!result.success) {
    return res.status(500).json({
      success: false,
      message: 'خطا در ایجاد پرداخت',
      error: result.error
    });
  }

  return res.status(201).json({
    success: true,
    message: 'پرداخت با موفقیت ثبت شد'
  });
}

// بروزرسانی پرداخت
async function updatePayment(req, res) {
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({
      success: false,
      message: 'شناسه پرداخت الزامی است'
    });
  }

  // بررسی وجود پرداخت
  const existingPayment = await executeQuery(
    'SELECT * FROM payments WHERE id = ?',
    [id]
  );

  if (!existingPayment.success || existingPayment.data.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'پرداخت یافت نشد'
    });
  }

  const currentPayment = existingPayment.data[0];
  const {
    date,
    amount,
    currency,
    payment_type,
    reference_number,
    status,
    description
  } = req.body;

  // اعتبارسنجی مبلغ
  if (amount !== undefined && parseFloat(amount) <= 0) {
    return res.status(400).json({
      success: false,
      message: 'مبلغ باید بزرگتر از صفر باشد'
    });
  }

  const queries = [];

  // بروزرسانی پرداخت
  queries.push({
    query: `
      UPDATE payments SET
        date = ?, amount = ?, currency = ?, payment_type = ?,
        reference_number = ?, status = ?, description = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    params: [
      date || currentPayment.date,
      amount !== undefined ? parseFloat(amount) : currentPayment.amount,
      currency || currentPayment.currency,
      payment_type || currentPayment.payment_type,
      reference_number !== undefined ? reference_number : currentPayment.reference_number,
      status || currentPayment.status,
      description !== undefined ? description : currentPayment.description,
      id
    ]
  });

  // اگر فاکتور مرتبط داشته و وضعیت یا مبلغ تغییر کرده، مانده فاکتور را بروزرسانی کن
  if (currentPayment.invoice_id && (status !== undefined || amount !== undefined)) {
    // محاسبه مجدد مانده فاکتور
    const recalculateQuery = `
      UPDATE invoices i
      SET 
        paid_amount = (
          SELECT COALESCE(SUM(amount), 0) 
          FROM payments 
          WHERE invoice_id = i.id AND status = 'confirmed'
        ),
        remaining = total - (
          SELECT COALESCE(SUM(amount), 0) 
          FROM payments 
          WHERE invoice_id = i.id AND status = 'confirmed'
        ),
        status = CASE 
          WHEN total - (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE invoice_id = i.id AND status = 'confirmed') <= 0 
          THEN 'paid' 
          ELSE 'confirmed' 
        END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    queries.push({
      query: recalculateQuery,
      params: [currentPayment.invoice_id]
    });
  }

  const result = await executeTransaction(queries);

  if (!result.success) {
    return res.status(500).json({
      success: false,
      message: 'خطا در بروزرسانی پرداخت',
      error: result.error
    });
  }

  return res.status(200).json({
    success: true,
    message: 'پرداخت با موفقیت بروزرسانی شد'
  });
}

// حذف پرداخت
async function deletePayment(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: 'شناسه پرداخت الزامی است'
    });
  }

  // بررسی وجود پرداخت
  const existingPayment = await executeQuery(
    'SELECT * FROM payments WHERE id = ?',
    [id]
  );

  if (!existingPayment.success || existingPayment.data.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'پرداخت یافت نشد'
    });
  }

  const payment = existingPayment.data[0];
  const queries = [];

  // حذف پرداخت
  queries.push({
    query: 'DELETE FROM payments WHERE id = ?',
    params: [id]
  });

  // بروزرسانی مانده فاکتور
  if (payment.invoice_id) {
    const recalculateQuery = `
      UPDATE invoices i
      SET 
        paid_amount = (
          SELECT COALESCE(SUM(amount), 0) 
          FROM payments 
          WHERE invoice_id = i.id AND status = 'confirmed' AND id != ?
        ),
        remaining = total - (
          SELECT COALESCE(SUM(amount), 0) 
          FROM payments 
          WHERE invoice_id = i.id AND status = 'confirmed' AND id != ?
        ),
        status = CASE 
          WHEN total - (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE invoice_id = i.id AND status = 'confirmed' AND id != ?) <= 0 
          THEN 'paid' 
          ELSE 'confirmed' 
        END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    queries.push({
      query: recalculateQuery,
      params: [id, id, id, payment.invoice_id]
    });
  }

  const result = await executeTransaction(queries);

  if (!result.success) {
    return res.status(500).json({
      success: false,
      message: 'خطا در حذف پرداخت',
      error: result.error
    });
  }

  return res.status(200).json({
    success: true,
    message: 'پرداخت با موفقیت حذف شد'
  });
}
