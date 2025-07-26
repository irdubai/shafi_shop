// =============================================================================
//                          API Currency Management
//                         مدیریت ارز و تبدیل ارز
// =============================================================================

export default async function handler(req, res) {
  // تنظیم CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    switch (req.method) {
      case 'GET':
        return await handleGetCurrency(req, res);
      case 'POST':
        return await handleUpdateRates(req, res);
      case 'PUT':
        return await handleConvertCurrency(req, res);
      default:
        return res.status(405).json({ 
          success: false, 
          message: 'Method not allowed' 
        });
    }
  } catch (error) {
    console.error('Currency API Error:', error);
    return res.status(500).json({
      success: false,
      message: 'خطا در پردازش درخواست ارز',
      error: error.message
    });
  }
}

// =============================================================================
//                              GET - دریافت نرخ ارز
// =============================================================================

async function handleGetCurrency(req, res) {
  const { action, from, to, amount } = req.query;

  try {
    if (action === 'rates') {
      // دریافت نرخ‌های ارز
      const rates = await getCurrencyRates();
      return res.status(200).json({
        success: true,
        data: rates,
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'convert' && from && to && amount) {
      // تبدیل ارز
      const result = await convertCurrency(from, to, parseFloat(amount));
      return res.status(200).json({
        success: true,
        data: result
      });
    }

    if (action === 'list') {
      // لیست ارزهای پشتیبانی شده
      const currencies = getSupportedCurrencies();
      return res.status(200).json({
        success: true,
        data: currencies
      });
    }

    return res.status(400).json({
      success: false,
      message: 'پارامترهای درخواست نامعتبر'
    });

  } catch (error) {
    console.error('Get Currency Error:', error);
    return res.status(500).json({
      success: false,
      message: 'خطا در دریافت اطلاعات ارز'
    });
  }
}

// =============================================================================
//                           POST - بروزرسانی نرخ ارز
// =============================================================================

async function handleUpdateRates(req, res) {
  const { rates, source } = req.body;

  try {
    if (!rates || typeof rates !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'نرخ‌های ارز نامعتبر'
      });
    }

    // بروزرسانی نرخ‌ها
    const updatedRates = await updateCurrencyRates(rates, source);

    return res.status(200).json({
      success: true,
      message: 'نرخ‌های ارز با موفقیت بروزرسانی شد',
      data: updatedRates
    });

  } catch (error) {
    console.error('Update Rates Error:', error);
    return res.status(500).json({
      success: false,
      message: 'خطا در بروزرسانی نرخ‌های ارز'
    });
  }
}

// =============================================================================
//                             PUT - تبدیل ارز
// =============================================================================

async function handleConvertCurrency(req, res) {
  const { from, to, amount, date } = req.body;

  try {
    if (!from || !to || !amount) {
      return res.status(400).json({
        success: false,
        message: 'پارامترهای تبدیل ارز ناقص'
      });
    }

    const result = await convertCurrency(from, to, amount, date);

    return res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Convert Currency Error:', error);
    return res.status(500).json({
      success: false,
      message: 'خطا در تبدیل ارز'
    });
  }
}

// =============================================================================
//                              توابع کمکی ارز
// =============================================================================

// دریافت نرخ‌های ارز فعلی
async function getCurrencyRates() {
  // نرخ‌های پیش‌فرض (معمولاً از API خارجی دریافت می‌شود)
  const defaultRates = {
    USD: 1.0,      // دلار آمریکا (پایه)
    EUR: 0.85,     // یورو
    IRR: 42000,    // ریال ایران
    AED: 3.67,     // درهم امارات
    TRY: 27.5,     // لیره ترکیه
    GBP: 0.73,     // پوند انگلیس
    JPY: 149.5,    // ین ژاپن
    CAD: 1.36,     // دلار کانادا
    AUD: 1.52,     // دلار استرالیا
    CHF: 0.88,     // فرانک سوئیس
    CNY: 7.24,     // یوان چین
    SAR: 3.75,     // ریال عربستان
    QAR: 3.64,     // ریال قطر
    KWD: 0.31,     // دینار کویت
    BHD: 0.377,    // دینار بحرین
    OMR: 0.385     // ریال عمان
  };

  try {
    // تلاش برای دریافت نرخ‌های به‌روز از API
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    if (response.ok) {
      const data = await response.json();
      return {
        ...defaultRates,
        ...data.rates,
        lastUpdated: new Date().toISOString(),
        source: 'exchangerate-api'
      };
    }
  } catch (error) {
    console.log('Using default rates due to API error:', error.message);
  }

  return {
    ...defaultRates,
    lastUpdated: new Date().toISOString(),
    source: 'default'
  };
}

// تبدیل ارز
async function convertCurrency(from, to, amount, date = null) {
  if (from === to) {
    return {
      from,
      to,
      amount,
      result: amount,
      rate: 1,
      date: date || new Date().toISOString()
    };
  }

  const rates = await getCurrencyRates();
  
  if (!rates[from] || !rates[to]) {
    throw new Error('ارز مورد نظر پشتیبانی نمی‌شود');
  }

  // تبدیل از ارز مبدا به USD سپس به ارز مقصد
  const fromRate = rates[from];
  const toRate = rates[to];
  const usdAmount = amount / fromRate;
  const result = usdAmount * toRate;
  const rate = toRate / fromRate;

  return {
    from,
    to,
    amount,
    result: parseFloat(result.toFixed(4)),
    rate: parseFloat(rate.toFixed(6)),
    date: date || new Date().toISOString(),
    calculation: {
      step1: `${amount} ${from} = ${usdAmount.toFixed(4)} USD`,
      step2: `${usdAmount.toFixed(4)} USD = ${result.toFixed(4)} ${to}`,
      rate: `1 ${from} = ${rate.toFixed(6)} ${to}`
    }
  };
}

// بروزرسانی نرخ‌های ارز
async function updateCurrencyRates(newRates, source = 'manual') {
  try {
    const currentRates = await getCurrencyRates();
    const updatedRates = {
      ...currentRates,
      ...newRates,
      lastUpdated: new Date().toISOString(),
      source: source
    };

    // در پروژه واقعی، اینجا در دیتابیس ذخیره می‌شود
    console.log('Updated rates:', updatedRates);

    return updatedRates;
  } catch (error) {
    throw new Error('خطا در بروزرسانی نرخ‌های ارز');
  }
}

// لیست ارزهای پشتیبانی شده
function getSupportedCurrencies() {
  return [
    { code: 'USD', name: 'دلار آمریکا', symbol: '$', flag: '🇺🇸' },
    { code: 'EUR', name: 'یورو', symbol: '€', flag: '🇪🇺' },
    { code: 'IRR', name: 'ریال ایران', symbol: '﷼', flag: '🇮🇷' },
    { code: 'AED', name: 'درهم امارات', symbol: 'د.إ', flag: '🇦🇪' },
    { code: 'TRY', name: 'لیره ترکیه', symbol: '₺', flag: '🇹🇷' },
    { code: 'GBP', name: 'پوند انگلیس', symbol: '£', flag: '🇬🇧' },
    { code: 'JPY', name: 'ین ژاپن', symbol: '¥', flag: '🇯🇵' },
    { code: 'CAD', name: 'دلار کانادا', symbol: 'C$', flag: '🇨🇦' },
    { code: 'AUD', name: 'دلار استرالیا', symbol: 'A$', flag: '🇦🇺' },
    { code: 'CHF', name: 'فرانک سوئیس', symbol: 'CHF', flag: '🇨🇭' },
    { code: 'CNY', name: 'یوان چین', symbol: '¥', flag: '🇨🇳' },
    { code: 'SAR', name: 'ریال عربستان', symbol: '﷼', flag: '🇸🇦' },
    { code: 'QAR', name: 'ریال قطر', symbol: '﷼', flag: '🇶🇦' },
    { code: 'KWD', name: 'دینار کویت', symbol: 'د.ك', flag: '🇰🇼' },
    { code: 'BHD', name: 'دینار بحرین', symbol: '.د.ب', flag: '🇧🇭' },
    { code: 'OMR', name: 'ریال عمان', symbol: '﷼', flag: '🇴🇲' }
  ];
}
