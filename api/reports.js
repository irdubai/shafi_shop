// =====================================================
// API گزارش‌ها و تحلیل‌ها
// =====================================================

import { executeQuery } from '../lib/db.js';

export default async function handler(req, res) {
  // تنظیم CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  try {
    const { type } = req.query;

    switch (type) {
      case 'dashboard':
        return await getDashboardStats(req, res);
      case 'sales':
        return await getSalesReport(req, res);
      case 'purchases':
        return await getPurchasesReport(req, res);
      case 'expenses':
        return await getExpensesReport(req, res);
      case 'customers':
        return await getCustomersReport(req, res);
      case 'products':
        return await getProductsReport(req, res);
      case 'profit_loss':
        return await getProfitLossReport(req, res);
      default:
        return res.status(400).json({
          success: false,
          message: 'نوع گزارش مشخص نشده است'
        });
    }
  } catch (error) {
    console.error('Reports API Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}

// آمار داشبورد
async function getDashboardStats(req, res) {
  try {
    // تعداد مشتریان
    const customersResult = await executeQuery(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN is_active = 1 THEN 1 END) as active
      FROM customers
    `);

    // تعداد کالاها
    const productsResult = await executeQuery(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN stock_quantity <= min_stock AND stock_quantity > 0 THEN 1 END) as low_stock,
        COUNT(CASE WHEN stock_quantity = 0 THEN 1 END) as out_of_stock
      FROM products
    `);

    // آمار فاکتورها
    const invoicesResult = await executeQuery(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN type = 'sale' THEN 1 END) as sales,
        COUNT(CASE WHEN type = 'purchase' THEN 1 END) as purchases,
        SUM(CASE WHEN type = 'sale' AND status != 'cancelled' THEN total ELSE 0 END) as total_sales,
        SUM(CASE WHEN type = 'purchase' AND status != 'cancelled' THEN total ELSE 0 END) as total_purchases
      FROM invoices
    `);

    // آمار هزینه‌ها
    const expensesResult = await executeQuery(`
      SELECT 
        COUNT(*) as total,
        SUM(amount) as total_amount
      FROM expenses
      WHERE YEAR(date) = YEAR(CURRENT_DATE)
    `);

    // فاکتورهای اخیر
    const recentInvoicesResult = await executeQuery(`
      SELECT 
        i.id, i.invoice_number, i.date, i.type, i.total, i.status,
        c.name as customer_name
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      ORDER BY i.created_at DESC
      LIMIT 5
    `);

    // کالاهای کم موجود
    const lowStockResult = await executeQuery(`
      SELECT 
        id, product_code, name, stock_quantity, min_stock, unit
      FROM products
      WHERE stock_quantity <= min_stock AND is_active = 1
      ORDER BY stock_quantity ASC
      LIMIT 5
    `);

    return res.status(200).json({
      success: true,
      data: {
        customers: customersResult.success ? customersResult.data[0] : { total: 0, active: 0 },
        products: productsResult.success ? productsResult.data[0] : { total: 0, low_stock: 0, out_of_stock: 0 },
        invoices: invoicesResult.success ? invoicesResult.data[0] : { total: 0, sales: 0, purchases: 0, total_sales: 0, total_purchases: 0 },
        expenses: expensesResult.success ? expensesResult.data[0] : { total: 0, total_amount: 0 },
        recent_invoices: recentInvoicesResult.success ? recentInvoicesResult.data : [],
        low_stock_products: lowStockResult.success ? lowStockResult.data : []
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'خطا در دریافت آمار داشبورد',
      error: error.message
    });
  }
}

// گزارش فروش
async function getSalesReport(req, res) {
  const { date_from, date_to, customer_id, product_id } = req.query;

  let query = `
    SELECT 
      i.id, i.invoice_number, i.date, i.total, i.paid_amount, i.remaining, i.status,
      c.name as customer_name, c.company as customer_company
    FROM invoices i
    LEFT JOIN customers c ON i.customer_id = c.id
    WHERE i.type = 'sale' AND i.status != 'cancelled'
  `;
  const params = [];

  if (date_from) {
    query += ` AND i.date >= ?`;
    params.push(date_from);
  }

  if (date_to) {
    query += ` AND i.date <= ?`;
    params.push(date_to);
  }

  if (customer_id) {
    query += ` AND i.customer_id = ?`;
    params.push(customer_id);
  }

  query += ` ORDER BY i.date DESC`;

  const result = await executeQuery(query, params);

  if (!result.success) {
    return res.status(500).json({
      success: false,
      message: 'خطا در دریافت گزارش فروش',
      error: result.error
    });
  }

  // محاسبه خلاصه
  const summary = {
    total_invoices: result.data.length,
    total_sales: result.data.reduce((sum, inv) => sum + parseFloat(inv.total || 0), 0),
    total_paid: result.data.reduce((sum, inv) => sum + parseFloat(inv.paid_amount || 0), 0),
    total_remaining: result.data.reduce((sum, inv) => sum + parseFloat(inv.remaining || 0), 0)
  };

  return res.status(200).json({
    success: true,
    data: {
      invoices: result.data,
      summary
    }
  });
}

// گزارش سود و زیان
async function getProfitLossReport(req, res) {
  const { date_from, date_to } = req.query;

  try {
    // درآمدها (فروش)
    let salesQuery = `
      SELECT 
        SUM(total) as total_sales,
        COUNT(*) as sales_count
      FROM invoices 
      WHERE type = 'sale' AND status != 'cancelled'
    `;
    const salesParams = [];

    if (date_from) {
      salesQuery += ` AND date >= ?`;
      salesParams.push(date_from);
    }

    if (date_to) {
      salesQuery += ` AND date <= ?`;
      salesParams.push(date_to);
    }

    // هزینه‌ها
    let expensesQuery = `
      SELECT 
        SUM(amount) as total_expenses,
        COUNT(*) as expenses_count
      FROM expenses
      WHERE 1=1
    `;
    const expensesParams = [];

    if (date_from) {
      expensesQuery += ` AND date >= ?`;
      expensesParams.push(date_from);
    }

    if (date_to) {
      expensesQuery += ` AND date <= ?`;
      expensesParams.push(date_to);
    }

    // خریدها
    let purchasesQuery = `
      SELECT 
        SUM(total) as total_purchases,
        COUNT(*) as purchases_count
      FROM invoices 
      WHERE type = 'purchase' AND status != 'cancelled'
    `;
    const purchasesParams = [];

    if (date_from) {
      purchasesQuery += ` AND date >= ?`;
      purchasesParams.push(date_from);
    }

    if (date_to) {
      purchasesQuery += ` AND date <= ?`;
      purchasesParams.push(date_to);
    }

    const [salesResult, expensesResult, purchasesResult] = await Promise.all([
      executeQuery(salesQuery, salesParams),
      executeQuery(expensesQuery, expensesParams),
      executeQuery(purchasesQuery, purchasesParams)
    ]);

    const sales = salesResult.success ? salesResult.data[0] : { total_sales: 0, sales_count: 0 };
    const expenses = expensesResult.success ? expensesResult.data[0] : { total_expenses: 0, expenses_count: 0 };
    const purchases = purchasesResult.success ? purchasesResult.data[0] : { total_purchases: 0, purchases_count: 0 };

    const totalRevenue = parseFloat(sales.total_sales || 0);
    const totalExpenses = parseFloat(expenses.total_expenses || 0) + parseFloat(purchases.total_purchases || 0);
    const netProfit = totalRevenue - totalExpenses;

    return res.status(200).json({
      success: true,
      data: {
        period: {
          from: date_from || 'ابتدا',
          to: date_to || 'انتها'
        },
        revenue: {
          sales: parseFloat(sales.total_sales || 0),
          sales_count: parseInt(sales.sales_count || 0)
        },
        costs: {
          expenses: parseFloat(expenses.total_expenses || 0),
          purchases: parseFloat(purchases.total_purchases || 0),
          total: totalExpenses,
          expenses_count: parseInt(expenses.expenses_count || 0),
          purchases_count: parseInt(purchases.purchases_count || 0)
        },
        profit: {
          gross_profit: totalRevenue,
          net_profit: netProfit,
          profit_margin: totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(2) : 0
        }
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'خطا در دریافت گزارش سود و زیان',
      error: error.message
    });
  }
}

// گزارش مشتریان
async function getCustomersReport(req, res) {
  const { customer_type, city } = req.query;

  let query = `
    SELECT 
      c.id, c.customer_code, c.name, c.company, c.phone, c.city,
      c.balance, c.currency, c.customer_type, c.is_active,
      COUNT(i.id) as invoice_count,
      SUM(CASE WHEN i.type = 'sale' AND i.status != 'cancelled' THEN i.total ELSE 0 END) as total_sales,
      SUM(CASE WHEN i.type = 'purchase' AND i.status != 'cancelled' THEN i.total ELSE 0 END) as total_purchases
    FROM customers c
    LEFT JOIN invoices i ON c.id = i.customer_id
    WHERE 1=1
  `;
  const params = [];

  if (customer_type && customer_type !== 'all') {
    query += ` AND c.customer_type = ?`;
    params.push(customer_type);
  }

  if (city && city !== 'all') {
    query += ` AND c.city = ?`;
    params.push(city);
  }

  query += ` GROUP BY c.id ORDER BY total_sales DESC`;

  const result = await executeQuery(query, params);

  if (!result.success) {
    return res.status(500).json({
      success: false,
      message: 'خطا در دریافت گزارش مشتریان',
      error: result.error
    });
  }

  return res.status(200).json({
    success: true,
    data: result.data
  });
}

// گزارش کالاها
async function getProductsReport(req, res) {
  const { category } = req.query;

  let query = `
    SELECT 
      p.id, p.product_code, p.name, p.category, p.price, p.stock_quantity,
      p.min_stock, p.unit, p.is_active,
      COALESCE(SUM(CASE WHEN i.type = 'sale' AND i.status != 'cancelled' THEN ii.quantity ELSE 0 END), 0) as sold_quantity,
      COALESCE(SUM(CASE WHEN i.type = 'sale' AND i.status != 'cancelled' THEN ii.total_price ELSE 0 END), 0) as sales_amount
    FROM products p
    LEFT JOIN invoice_items ii ON p.id = ii.product_id
    LEFT JOIN invoices i ON ii.invoice_id = i.id
    WHERE 1=1
  `;
  const params = [];

  if (category && category !== 'all') {
    query += ` AND p.category = ?`;
    params.push(category);
  }

  query += ` GROUP BY p.id ORDER BY sales_amount DESC`;

  const result = await executeQuery(query, params);

  if (!result.success) {
    return res.status(500).json({
      success: false,
      message: 'خطا در دریافت گزارش کالاها',
      error: result.error
    });
  }

  return res.status(200).json({
    success: true,
    data: result.data
  });
}

// سایر توابع گزارش...
async function getPurchasesReport(req, res) {
  // مشابه getSalesReport برای خریدها
  // ...
}

async function getExpensesReport(req, res) {
  // گزارش تفصیلی هزینه‌ها
  // ...
}
