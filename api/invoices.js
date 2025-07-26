// =====================================================
// API مدیریت فاکتورها
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
        return await getInvoices(req, res);
      case 'POST':
        return await createInvoice(req, res);
      case 'PUT':
        return await updateInvoice(req, res);
      case 'DELETE':
        return await deleteInvoice(req, res);
      default:
        return res.status(405).json({
          success: false,
          message: 'Method not allowed'
        });
    }
  } catch (error) {
    console.error('Invoices API Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}

// دریافت لیست فاکتورها
async function getInvoices(req, res) {
  const { 
    search, 
    type, 
    status, 
    customer_id, 
    date_from, 
    date_to, 
    limit = 100, 
    offset = 0 
  } = req.query;

  let query = `
    SELECT 
      i.id, i.invoice_number, i.date, i.type, i.status, i.customer_id,
      i.currency, i.subtotal, i.discount, i.tax, i.total, 
      i.paid_amount, i.remaining, i.description, i.created_at, i.updated_at,
      c.name as customer_name, c.company as customer_company
    FROM invoices i
    LEFT JOIN customers c ON i.customer_id = c.id
    WHERE 1=1
  `;
  const params = [];

  // فیلتر جستجو
  if (search) {
    query += ` AND (i.invoice_number LIKE ? OR c.name LIKE ? OR c.company LIKE ?)`;
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  // فیلتر نوع فاکتور
  if (type && type !== 'all') {
    query += ` AND i.type = ?`;
    params.push(type);
  }

  // فیلتر وضعیت
  if (status && status !== 'all') {
    query += ` AND i.status = ?`;
    params.push(status);
  }

  // فیلتر مشتری
  if (customer_id) {
    query += ` AND i.customer_id = ?`;
    params.push(customer_id);
  }

  // فیلتر تاریخ
  if (date_from) {
    query += ` AND i.date >= ?`;
    params.push(date_from);
  }

  if (date_to) {
    query += ` AND i.date <= ?`;
    params.push(date_to);
  }

  query += ` ORDER BY i.created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), parseInt(offset));

  const result = await executeQuery(query, params);

  if (!result.success) {
    return res.status(500).json({
      success: false,
      message: 'خطا در دریافت لیست فاکتورها',
      error: result.error
    });
  }

  // دریافت آیتم‌های هر فاکتور
  for (const invoice of result.data) {
    const itemsResult = await executeQuery(`
      SELECT 
        ii.id, ii.product_id, ii.product_name, ii.quantity,
        ii.unit_price, ii.total_price, ii.description,
        p.unit as product_unit
      FROM invoice_items ii
      LEFT JOIN products p ON ii.product_id = p.id
      WHERE ii.invoice_id = ?
      ORDER BY ii.id
    `, [invoice.id]);

    invoice.items = itemsResult.success ? itemsResult.data : [];
  }

  return res.status(200).json({
    success: true,
    data: result.data
  });
}

// ایجاد فاکتور جدید
async function createInvoice(req, res) {
  const {
    invoice_number,
    date,
    type,
    status = 'draft',
    customer_id,
    currency = 'AED',
    items = [],
    discount = 0,
    tax = 0,
    description
  } = req.body;

  // اعتبارسنجی
  if (!invoice_number || !date || !type) {
    return res.status(400).json({
      success: false,
      message: 'شماره فاکتور، تاریخ و نوع الزامی است'
    });
  }

  if (items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'حداقل یک آیتم برای فاکتور الزامی است'
    });
  }

  // بررسی تکراری نبودن شماره فاکتور
  const existingInvoice = await executeQuery(
    'SELECT id FROM invoices WHERE invoice_number = ?',
    [invoice_number]
  );

  if (existingInvoice.success && existingInvoice.data.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'شماره فاکتور تکراری است'
    });
  }

  // محاسبه مجاميع
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const total = subtotal - parseFloat(discount) + parseFloat(tax);

  const queries = [];

  // ایجاد فاکتور
  queries.push({
    query: `
      INSERT INTO invoices (
        invoice_number, date, type, status, customer_id, currency,
        subtotal, discount, tax, total, remaining, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    params: [
      invoice_number, date, type, status, customer_id, currency,
      subtotal, parseFloat(discount), parseFloat(tax), total, total, description
    ]
  });

  const result = await executeTransaction(queries);

  if (!result.success) {
    return res.status(500).json({
      success: false,
      message: 'خطا در ایجاد فاکتور',
      error: result.error
    });
  }

  // دریافت ID فاکتور ایجاد شده
  const invoiceResult = await executeQuery(
    'SELECT id FROM invoices WHERE invoice_number = ?',
    [invoice_number]
  );

  if (!invoiceResult.success || invoiceResult.data.length === 0) {
    return res.status(500).json({
      success: false,
      message: 'خطا در دریافت شناسه فاکتور'
    });
  }

  const invoiceId = invoiceResult.data[0].id;

  // اضافه کردن آیتم‌ها
  const itemQueries = [];
  for (const item of items) {
    itemQueries.push({
      query: `
        INSERT INTO invoice_items (
          invoice_id, product_id, product_name, quantity, unit_price, total_price, description
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      params: [
        invoiceId, item.product_id, item.product_name, 
        parseFloat(item.quantity), parseFloat(item.unit_price),
        parseFloat(item.quantity) * parseFloat(item.unit_price),
        item.description || ''
      ]
    });

    // بروزرسانی موجودی کالا (فقط برای فروش و خرید)
    if ((type === 'sale' || type === 'sale_return') && item.product_id) {
      const stockChange = type === 'sale' ? -parseFloat(item.quantity) : parseFloat(item.quantity);
      itemQueries.push({
        query: 'UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?',
        params: [stockChange, item.product_id]
      });
    } else if ((type === 'purchase' || type === 'purchase_return') && item.product_id) {
      const stockChange = type === 'purchase' ? parseFloat(item.quantity) : -parseFloat(item.quantity);
      itemQueries.push({
        query: 'UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?',
        params: [stockChange, item.product_id]
      });
    }
  }

  const itemsResult = await executeTransaction(itemQueries);

  if (!itemsResult.success) {
    // حذف فاکتور در صورت خطا در آیتم‌ها
    await executeQuery('DELETE FROM invoices WHERE id = ?', [invoiceId]);
    
    return res.status(500).json({
      success: false,
      message: 'خطا در ایجاد آیتم‌های فاکتور',
      error: itemsResult.error
    });
  }

  // دریافت فاکتور کامل
  const completeInvoice = await getCompleteInvoice(invoiceId);

  return res.status(201).json({
    success: true,
    message: 'فاکتور با موفقیت ایجاد شد',
    data: completeInvoice
  });
}

// بروزرسانی فاکتور
async function updateInvoice(req, res) {
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({
      success: false,
      message: 'شناسه فاکتور الزامی است'
    });
  }

  // بررسی وجود فاکتور
  const existingInvoice = await executeQuery(
    'SELECT * FROM invoices WHERE id = ?',
    [id]
  );

  if (!existingInvoice.success || existingInvoice.data.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'فاکتور یافت نشد'
    });
  }

  const currentInvoice = existingInvoice.data[0];

  // بررسی قابلیت ویرایش
  if (currentInvoice.status === 'paid') {
    return res.status(400).json({
      success: false,
      message: 'فاکتور پرداخت شده قابل ویرایش نیست'
    });
  }

  const {
    invoice_number,
    date,
    type,
    status,
    customer_id,
    currency,
    items = [],
    discount,
    tax,
    description
  } = req.body;

  // بررسی تکراری نبودن شماره فاکتور
  if (invoice_number && invoice_number !== currentInvoice.invoice_number) {
    const duplicateCheck = await executeQuery(
      'SELECT id FROM invoices WHERE invoice_number = ? AND id != ?',
      [invoice_number, id]
    );

    if (duplicateCheck.success && duplicateCheck.data.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'شماره فاکتور تکراری است'
      });
    }
  }

  // محاسبه مجاميع جدید
  const subtotal = items.length > 0 ? 
    items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0) :
    currentInvoice.subtotal;
  
  const finalDiscount = discount !== undefined ? parseFloat(discount) : currentInvoice.discount;
  const finalTax = tax !== undefined ? parseFloat(tax) : currentInvoice.tax;
  const total = subtotal - finalDiscount + finalTax;

  const queries = [];

  // بروزرسانی فاکتور
  queries.push({
    query: `
      UPDATE invoices SET
        invoice_number = ?, date = ?, type = ?, status = ?, customer_id = ?,
        currency = ?, subtotal = ?, discount = ?, tax = ?, total = ?,
        remaining = ?, description = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    params: [
      invoice_number || currentInvoice.invoice_number,
      date || currentInvoice.date,
      type || currentInvoice.type,
      status || currentInvoice.status,
      customer_id || currentInvoice.customer_id,
      currency || currentInvoice.currency,
      subtotal, finalDiscount, finalTax, total,
      total - currentInvoice.paid_amount,
      description !== undefined ? description : currentInvoice.description,
      id
    ]
  });

  // اگر آیتم‌های جدید ارسال شده، آیتم‌های قدیمی را حذف و جدید را اضافه کن
  if (items.length > 0) {
    // حذف آیتم‌های قدیمی
    queries.push({
      query: 'DELETE FROM invoice_items WHERE invoice_id = ?',
      params: [id]
    });
  }

  const result = await executeTransaction(queries);

  if (!result.success) {
    return res.status(500).json({
      success: false,
      message: 'خطا در بروزرسانی فاکتور',
      error: result.error
    });
  }

  // اضافه کردن آیتم‌های جدید
  if (items.length > 0) {
    const itemQueries = [];
    for (const item of items) {
      itemQueries.push({
        query: `
          INSERT INTO invoice_items (
            invoice_id, product_id, product_name, quantity, unit_price, total_price, description
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        params: [
          id, item.product_id, item.product_name,
          parseFloat(item.quantity), parseFloat(item.unit_price),
          parseFloat(item.quantity) * parseFloat(item.unit_price),
          item.description || ''
        ]
      });
    }

    const itemsResult = await executeTransaction(itemQueries);
    if (!itemsResult.success) {
      return res.status(500).json({
        success: false,
        message: 'خطا در بروزرسانی آیتم‌های فاکتور',
        error: itemsResult.error
      });
    }
  }

  // دریافت فاکتور بروزرسانی شده
  const updatedInvoice = await getCompleteInvoice(id);

  return res.status(200).json({
    success: true,
    message: 'فاکتور با موفقیت بروزرسانی شد',
    data: updatedInvoice
  });
}

// حذف فاکتور
async function deleteInvoice(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: 'شناسه فاکتور الزامی است'
    });
  }

  // بررسی وجود فاکتور
  const existingInvoice = await executeQuery(
    'SELECT * FROM invoices WHERE id = ?',
    [id]
  );

  if (!existingInvoice.success || existingInvoice.data.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'فاکتور یافت نشد'
    });
  }

  const invoice = existingInvoice.data[0];

  // بررسی قابلیت حذف
  if (invoice.status === 'paid') {
    return res.status(400).json({
      success: false,
      message: 'فاکتور پرداخت شده قابل حذف نیست'
    });
  }

  // بررسی پرداخت‌های مرتبط
  const paymentsCheck = await executeQuery(
    'SELECT COUNT(*) as count FROM payments WHERE invoice_id = ?',
    [id]
  );

  if (paymentsCheck.success && paymentsCheck.data[0]?.count > 0) {
    return res.status(400).json({
      success: false,
      message: 'این فاکتور دارای پرداخت است و قابل حذف نیست'
    });
  }

  const result = await executeQuery(
    'DELETE FROM invoices WHERE id = ?',
    [id]
  );

  if (!result.success) {
    return res.status(500).json({
      success: false,
      message: 'خطا در حذف فاکتور',
      error: result.error
    });
  }

  return res.status(200).json({
    success: true,
    message: 'فاکتور با موفقیت حذف شد'
  });
}

// تابع کمکی برای دریافت فاکتور کامل
async function getCompleteInvoice(invoiceId) {
  const invoiceResult = await executeQuery(`
    SELECT 
      i.*, c.name as customer_name, c.company as customer_company
    FROM invoices i
    LEFT JOIN customers c ON i.customer_id = c.id
    WHERE i.id = ?
  `, [invoiceId]);

  if (!invoiceResult.success || invoiceResult.data.length === 0) {
    return null;
  }

  const invoice = invoiceResult.data[0];

  // دریافت آیتم‌ها
  const itemsResult = await executeQuery(`
    SELECT 
      ii.*, p.unit as product_unit
    FROM invoice_items ii
    LEFT JOIN products p ON ii.product_id = p.id
    WHERE ii.invoice_id = ?
    ORDER BY ii.id
  `, [invoiceId]);

  invoice.items = itemsResult.success ? itemsResult.data : [];

  return invoice;
}
