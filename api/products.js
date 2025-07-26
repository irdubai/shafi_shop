// =====================================================
// API مدیریت کالاها
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
        return await getProducts(req, res);
      case 'POST':
        return await createProduct(req, res);
      case 'PUT':
        return await updateProduct(req, res);
      case 'DELETE':
        return await deleteProduct(req, res);
      default:
        return res.status(405).json({
          success: false,
          message: 'Method not allowed'
        });
    }
  } catch (error) {
    console.error('Products API Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}

// دریافت لیست کالاها
async function getProducts(req, res) {
  const { search, category, stock_status, limit = 100, offset = 0 } = req.query;

  let query = `
    SELECT 
      id, product_code, name, price, currency, unit, stock_quantity,
      category, min_stock, storage_location, is_active, description,
      created_at, updated_at
    FROM products 
    WHERE 1=1
  `;
  const params = [];

  // فیلتر جستجو
  if (search) {
    query += ` AND (name LIKE ? OR product_code LIKE ? OR category LIKE ?)`;
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  // فیلتر دسته‌بندی
  if (category && category !== 'all') {
    query += ` AND category = ?`;
    params.push(category);
  }

  // فیلتر وضعیت موجودی
  if (stock_status) {
    switch (stock_status) {
      case 'low_stock':
        query += ` AND stock_quantity <= min_stock AND stock_quantity > 0`;
        break;
      case 'out_of_stock':
        query += ` AND stock_quantity = 0`;
        break;
      case 'in_stock':
        query += ` AND stock_quantity > min_stock`;
        break;
    }
  }

  query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), parseInt(offset));

  const result = await executeQuery(query, params);

  if (!result.success) {
    return res.status(500).json({
      success: false,
      message: 'خطا در دریافت لیست کالاها',
      error: result.error
    });
  }

  // دریافت تعداد کل
  let countQuery = `SELECT COUNT(*) as total FROM products WHERE 1=1`;
  const countParams = [];
  
  if (search) {
    countQuery += ` AND (name LIKE ? OR product_code LIKE ? OR category LIKE ?)`;
    const searchTerm = `%${search}%`;
    countParams.push(searchTerm, searchTerm, searchTerm);
  }
  
  if (category && category !== 'all') {
    countQuery += ` AND category = ?`;
    countParams.push(category);
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

// ایجاد کالای جدید
async function createProduct(req, res) {
  const {
    product_code,
    name,
    price,
    currency = 'AED',
    unit,
    stock_quantity = 0,
    category,
    min_stock = 0,
    storage_location,
    is_active = true,
    description
  } = req.body;

  // اعتبارسنجی
  if (!product_code || !name || !price || !unit) {
    return res.status(400).json({
      success: false,
      message: 'کد کالا، نام، قیمت و واحد الزامی است'
    });
  }

  // بررسی تکراری نبودن کد کالا
  const existingProduct = await executeQuery(
    'SELECT id FROM products WHERE product_code = ?',
    [product_code]
  );

  if (existingProduct.success && existingProduct.data.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'کد کالا تکراری است'
    });
  }

  const query = `
    INSERT INTO products (
      product_code, name, price, currency, unit, stock_quantity,
      category, min_stock, storage_location, is_active, description
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    product_code, name, parseFloat(price), currency, unit,
    parseInt(stock_quantity), category, parseInt(min_stock),
    storage_location, is_active, description
  ];

  const result = await executeQuery(query, params);

  if (!result.success) {
    return res.status(500).json({
      success: false,
      message: 'خطا در ایجاد کالای جدید',
      error: result.error
    });
  }

  // دریافت کالای ایجاد شده
  const newProduct = await executeQuery(
    'SELECT * FROM products WHERE id = ?',
    [result.insertId]
  );

  return res.status(201).json({
    success: true,
    message: 'کالا با موفقیت ایجاد شد',
    data: newProduct.success ? newProduct.data[0] : null
  });
}

// بروزرسانی کالا
async function updateProduct(req, res) {
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({
      success: false,
      message: 'شناسه کالا الزامی است'
    });
  }

  // بررسی وجود کالا
  const existingProduct = await executeQuery(
    'SELECT * FROM products WHERE id = ?',
    [id]
  );

  if (!existingProduct.success || existingProduct.data.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'کالا یافت نشد'
    });
  }

  const {
    product_code,
    name,
    price,
    currency,
    unit,
    stock_quantity,
    category,
    min_stock,
    storage_location,
    is_active,
    description
  } = req.body;

  // بررسی تکراری نبودن کد کالا اگر تغییر کرده باشد
  if (product_code && product_code !== existingProduct.data[0].product_code) {
    const duplicateCheck = await executeQuery(
      'SELECT id FROM products WHERE product_code = ? AND id != ?',
      [product_code, id]
    );

    if (duplicateCheck.success && duplicateCheck.data.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'کد کالا تکراری است'
      });
    }
  }

  const query = `
    UPDATE products SET
      product_code = ?, name = ?, price = ?, currency = ?, unit = ?,
      stock_quantity = ?, category = ?, min_stock = ?, storage_location = ?,
      is_active = ?, description = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  const current = existingProduct.data[0];
  const params = [
    product_code || current.product_code,
    name || current.name,
    price !== undefined ? parseFloat(price) : current.price,
    currency || current.currency,
    unit || current.unit,
    stock_quantity !== undefined ? parseInt(stock_quantity) : current.stock_quantity,
    category || current.category,
    min_stock !== undefined ? parseInt(min_stock) : current.min_stock,
    storage_location || current.storage_location,
    is_active !== undefined ? is_active : current.is_active,
    description !== undefined ? description : current.description,
    id
  ];

  const result = await executeQuery(query, params);

  if (!result.success) {
    return res.status(500).json({
      success: false,
      message: 'خطا در بروزرسانی کالا',
      error: result.error
    });
  }

  // دریافت کالای بروزرسانی شده
  const updatedProduct = await executeQuery(
    'SELECT * FROM products WHERE id = ?',
    [id]
  );

  return res.status(200).json({
    success: true,
    message: 'کالا با موفقیت بروزرسانی شد',
    data: updatedProduct.success ? updatedProduct.data[0] : null
  });
}

// حذف کالا
async function deleteProduct(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: 'شناسه کالا الزامی است'
    });
  }

  // بررسی وجود کالا
  const existingProduct = await executeQuery(
    'SELECT * FROM products WHERE id = ?',
    [id]
  );

  if (!existingProduct.success || existingProduct.data.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'کالا یافت نشد'
    });
  }

  // بررسی استفاده در فاکتورها
  const invoiceItemCheck = await executeQuery(
    'SELECT COUNT(*) as count FROM invoice_items WHERE product_id = ?',
    [id]
  );

  if (invoiceItemCheck.success && invoiceItemCheck.data[0]?.count > 0) {
    return res.status(400).json({
      success: false,
      message: 'این کالا در فاکتورها استفاده شده و قابل حذف نیست'
    });
  }

  const result = await executeQuery(
    'DELETE FROM products WHERE id = ?',
    [id]
  );

  if (!result.success) {
    return res.status(500).json({
      success: false,
      message: 'خطا در حذف کالا',
      error: result.error
    });
  }

  return res.status(200).json({
    success: true,
    message: 'کالا با موفقیت حذف شد'
  });
}
