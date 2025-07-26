// =============================================================================
//                             API Dashboard
//                        داشبورد و آمار کلی سیستم
// =============================================================================

export default async function handler(req, res) {
  // تنظیم CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    switch (req.method) {
      case 'GET':
        return await handleGetDashboard(req, res);
      case 'POST':
        return await handleUpdateDashboard(req, res);
      default:
        return res.status(405).json({ 
          success: false, 
          message: 'Method not allowed' 
        });
    }
  } catch (error) {
    console.error('Dashboard API Error:', error);
    return res.status(500).json({
      success: false,
      message: 'خطا در بارگذاری داشبورد',
      error: error.message
    });
  }
}

// =============================================================================
//                         GET - دریافت اطلاعات داشبورد
// =============================================================================

async function handleGetDashboard(req, res) {
  const { section, period, from, to } = req.query;

  try {
    let dashboardData;

    switch (section) {
      case 'overview':
        dashboardData = await getOverviewData(period);
        break;
      case 'financial':
        dashboardData = await getFinancialData(period, from, to);
        break;
      case 'customers':
        dashboardData = await getCustomersData(period);
        break;
      case 'products':
        dashboardData = await getProductsData(period);
        break;
      case 'charts':
        dashboardData = await getChartsData(period, from, to);
        break;
      case 'recent':
        dashboardData = await getRecentActivities();
        break;
      default:
        dashboardData = await getCompleteDashboard(period);
    }

    return res.status(200).json({
      success: true,
      data: dashboardData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get Dashboard Error:', error);
    return res.status(500).json({
      success: false,
      message: 'خطا در دریافت اطلاعات داشبورد'
    });
  }
}

// =============================================================================
//                        POST - بروزرسانی تنظیمات داشبورد
// =============================================================================

async function handleUpdateDashboard(req, res) {
  const { action, settings, widgets, layout } = req.body;

  try {
    let result;

    switch (action) {
      case 'save-layout':
        result = await saveDashboardLayout(layout);
        break;
      case 'update-settings':
        result = await updateDashboardSettings(settings);
        break;
      case 'toggle-widget':
        result = await toggleWidget(widgets);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'عمل درخواستی نامعتبر'
        });
    }

    return res.status(200).json({
      success: true,
      message: 'تنظیمات داشبورد بروزرسانی شد',
      data: result
    });

  } catch (error) {
    console.error('Update Dashboard Error:', error);
    return res.status(500).json({
      success: false,
      message: 'خطا در بروزرسانی داشبورد'
    });
  }
}

// =============================================================================
//                            توابع داده‌های داشبورد
// =============================================================================

// داده‌های کلی سیستم
async function getOverviewData(period = 'month') {
  const today = new Date();
  const stats = calculatePeriodStats(period, today);

  return {
    totalSales: {
      value: 1250000,
      change: +15.5,
      currency: 'USD',
      previous: 1085000
    },
    totalInvoices: {
      value: 156,
      change: +8.2,
      previous: 144
    },
    totalCustomers: {
      value: 89,
      change: +12.4,
      previous: 79
    },
    totalProducts: {
      value: 234,
      change: +3.1,
      previous: 227
    },
    totalExpenses: {
      value: 450000,
      change: -5.2,
      currency: 'USD',
      previous: 475000
    },
    netProfit: {
      value: 800000,
      change: +22.8,
      currency: 'USD',
      previous: 651000
    },
    pendingPayments: {
      value: 125000,
      count: 23,
      currency: 'USD'
    },
    lowStockProducts: {
      value: 12,
      critical: 3
    }
  };
}

// داده‌های مالی
async function getFinancialData(period = 'month', from, to) {
  return {
    revenue: {
      total: 1250000,
      byMethod: {
        cash: 750000,
        card: 400000,
        bank: 100000
      },
      currency: 'USD'
    },
    expenses: {
      total: 450000,
      categories: [
        { name: 'خرید کالا', amount: 300000, percentage: 66.7 },
        { name: 'اجاره', amount: 80000, percentage: 17.8 },
        { name: 'حقوق', amount: 50000, percentage: 11.1 },
        { name: 'سایر', amount: 20000, percentage: 4.4 }
      ],
      currency: 'USD'
    },
    profitLoss: {
      gross: 950000,
      net: 800000,
      margin: 64.0,
      currency: 'USD'
    },
    cashFlow: {
      inflow: 1250000,
      outflow: 450000,
      net: 800000,
      currency: 'USD'
    },
    accountsReceivable: {
      total: 125000,
      overdue: 35000,
      current: 90000,
      currency: 'USD'
    },
    accountsPayable: {
      total: 75000,
      overdue: 15000,
      current: 60000,
      currency: 'USD'
    }
  };
}

// داده‌های مشتریان
async function getCustomersData(period = 'month') {
  return {
    totalCustomers: 89,
    newCustomers: 12,
    activeCustomers: 67,
    topCustomers: [
      { id: 1, name: 'شرکت آلفا', totalSales: 150000, invoices: 15 },
      { id: 2, name: 'شرکت بتا', totalSales: 120000, invoices: 12 },
      { id: 3, name: 'شرکت گاما', totalSales: 95000, invoices: 10 },
      { id: 4, name: 'شرکت دلتا', totalSales: 87000, invoices: 8 },
      { id: 5, name: 'شرکت اپسیلون', totalSales: 76000, invoices: 9 }
    ],
    customersByRegion: [
      { region: 'تهران', count: 35, percentage: 39.3 },
      { region: 'اصفهان', count: 18, percentage: 20.2 },
      { region: 'شیراز', count: 15, percentage: 16.9 },
      { region: 'مشهد', count: 12, percentage: 13.5 },
      { region: 'سایر', count: 9, percentage: 10.1 }
    ],
    customerGrowth: {
      thisMonth: 12,
      lastMonth: 8,
      growthRate: 50.0
    }
  };
}

// داده‌های محصولات
async function getProductsData(period = 'month') {
  return {
    totalProducts: 234,
    newProducts: 8,
    activeProducts: 198,
    topSellingProducts: [
      { id: 1, name: 'محصول A', sold: 145, revenue: 87000 },
      { id: 2, name: 'محصول B', sold: 132, revenue: 79200 },
      { id: 3, name: 'محصول C', sold: 98, revenue: 58800 },
      { id: 4, name: 'محصول D', sold: 87, revenue: 52200 },
      { id: 5, name: 'محصول E', sold: 76, revenue: 45600 }
    ],
    productsByCategory: [
      { category: 'الکترونیک', count: 78, percentage: 33.3 },
      { category: 'پوشاک', count: 65, percentage: 27.8 },
      { category: 'خانه و آشپزخانه', count: 45, percentage: 19.2 },
      { category: 'ورزش', count: 32, percentage: 13.7 },
      { category: 'سایر', count: 14, percentage: 6.0 }
    ],
    inventoryStatus: {
      inStock: 198,
      lowStock: 12,
      outOfStock: 5,
      total: 234
    },
    productPerformance: {
      averageSales: 45.2,
      topPerformer: 'محصول A',
      worstPerformer: 'محصول Z'
    }
  };
}

// داده‌های نمودارها
async function getChartsData(period = 'month', from, to) {
  return {
    salesChart: {
      type: 'line',
      data: {
        labels: ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور'],
        datasets: [
          {
            label: 'فروش',
            data: [850000, 920000, 1100000, 1250000, 1180000, 1320000],
            borderColor: '#007bff',
            backgroundColor: 'rgba(0, 123, 255, 0.1)'
          }
        ]
      }
    },
    expenseChart: {
      type: 'bar',
      data: {
        labels: ['خرید کالا', 'اجاره', 'حقوق', 'تبلیغات', 'سایر'],
        datasets: [
          {
            label: 'هزینه‌ها',
            data: [300000, 80000, 50000, 15000, 20000],
            backgroundColor: [
              '#dc3545',
              '#ffc107',
              '#28a745',
              '#17a2b8',
              '#6c757d'
            ]
          }
        ]
      }
    },
    profitChart: {
      type: 'doughnut',
      data: {
        labels: ['سود خالص', 'هزینه‌ها'],
        datasets: [
          {
            data: [800000, 450000],
            backgroundColor: ['#28a745', '#dc3545']
          }
        ]
      }
    },
    monthlyTrendChart: {
      type: 'line',
      data: {
        labels: Array.from({length: 30}, (_, i) => i + 1),
        datasets: [
          {
            label: 'فروش روزانه',
            data: generateDailyData(30),
            borderColor: '#007bff',
            fill: false
          }
        ]
      }
    }
  };
}

// فعالیت‌های اخیر
async function getRecentActivities() {
  return {
    recentInvoices: [
      {
        id: 'INV-2024-001',
        customer: 'شرکت آلفا',
        amount: 25000,
        status: 'paid',
        date: '2024-01-15',
        currency: 'USD'
      },
      {
        id: 'INV-2024-002',
        customer: 'شرکت بتا',
        amount: 18500,
        status: 'pending',
        date: '2024-01-14',
        currency: 'USD'
      },
      {
        id: 'INV-2024-003',
        customer: 'شرکت گاما',
        amount: 32000,
        status: 'overdue',
        date: '2024-01-13',
        currency: 'USD'
      }
    ],
    recentPayments: [
      {
        id: 'PAY-001',
        customer: 'شرکت آلفا',
        amount: 25000,
        method: 'bank',
        date: '2024-01-15',
        currency: 'USD'
      },
      {
        id: 'PAY-002',
        customer: 'شرکت دلتا',
        amount: 15000,
        method: 'cash',
        date: '2024-01-14',
        currency: 'USD'
      }
    ],
    recentCustomers: [
      {
        id: 89,
        name: 'شرکت زتا',
        email: 'info@zeta.com',
        phone: '021-12345678',
        registeredDate: '2024-01-15'
      },
      {
        id: 88,
        name: 'شرکت اتا',
        email: 'contact@eta.com',
        phone: '021-87654321',
        registeredDate: '2024-01-14'
      }
    ],
    systemActivities: [
      {
        type: 'invoice_created',
        description: 'فاکتور جدید INV-2024-001 ایجاد شد',
        user: 'مدیر سیستم',
        timestamp: '2024-01-15T10:30:00Z'
      },
      {
        type: 'payment_received',
        description: 'پرداخت 25000 دلار دریافت شد',
        user: 'مدیر سیستم',
        timestamp: '2024-01-15T09:15:00Z'
      },
      {
        type: 'customer_added',
        description: 'مشتری جدید "شرکت زتا" اضافه شد',
        user: 'مدیر سیستم',
        timestamp: '2024-01-15T08:45:00Z'
      }
    ]
  };
}

// داشبورد کامل
async function getCompleteDashboard(period = 'month') {
  const [overview, financial, customers, products, charts, recent] = await Promise.all([
    getOverviewData(period),
    getFinancialData(period),
    getCustomersData(period),
    getProductsData(period),
    getChartsData(period),
    getRecentActivities()
  ]);

  return {
    overview,
    financial,
    customers,
    products,
    charts,
    recent,
    lastUpdated: new Date().toISOString(),
    period: period
  };
}

// =============================================================================
//                             توابع کمکی
// =============================================================================

// محاسبه آمار دوره
function calculatePeriodStats(period, date) {
  const periods = {
    today: { days: 1 },
    week: { days: 7 },
    month: { days: 30 },
    quarter: { days: 90 },
    year: { days: 365 }
  };

  return periods[period] || periods.month;
}

// تولید داده‌های روزانه
function generateDailyData(days) {
  return Array.from({length: days}, () => 
    Math.floor(Math.random() * 50000) + 20000
  );
}

// ذخیره چیدمان داشبورد
async function saveDashboardLayout(layout) {
  console.log('Saving dashboard layout:', layout);
  return { success: true, layout };
}

// بروزرسانی تنظیمات داشبورد
async function updateDashboardSettings(settings) {
  console.log('Updating dashboard settings:', settings);
  return { success: true, settings };
}

// تغییر وضعیت ویجت
async function toggleWidget(widgets) {
  console.log('Toggling widgets:', widgets);
  return { success: true, widgets };
}
