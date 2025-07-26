// =============================================================================
//                            Backend Utilities
//                         ابزارهای کمکی Backend
// =============================================================================

import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import fs from 'fs/promises';
import path from 'path';

// =============================================================================
//                              Date & Time Utils
// =============================================================================

export const DateUtils = {
  // تبدیل تاریخ میلادی به شمسی
  gregorianToPersian: (date) => {
    const persianDate = new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date(date));
    
    return persianDate.replace(/\//g, '/');
  },

  // تبدیل تاریخ شمسی به میلادی (تقریبی)
  persianToGregorian: (persianDate) => {
    // این تابع نیاز به کتابخانه تخصصی دارد
    // فعلاً یک تبدیل ساده انجام می‌دهد
    const [year, month, day] = persianDate.split('/');
    const gregorianYear = parseInt(year) + 621;
    return new Date(gregorianYear, parseInt(month) - 1, parseInt(day));
  },

  // فرمت زمان فارسی
  formatPersianDateTime: (date) => {
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Tehran'
    };
    
    return new Intl.DateTimeFormat('fa-IR', options).format(new Date(date));
  },

  // محاسبه اختلاف روزها
  daysBetween: (date1, date2) => {
    const diffTime = Math.abs(new Date(date2) - new Date(date1));
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },

  // شروع و پایان روز
  startOfDay: (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  },

  endOfDay: (date) => {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  },

  // محاسبه سن
  calculateAge: (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  },

  // بررسی معتبر بودن تاریخ
  isValidDate: (dateString) => {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  }
};

// =============================================================================
//                              String Utils
// =============================================================================

export const StringUtils = {
  // تولید ID تصادفی
  generateId: (length = 8) => {
    return crypto.randomBytes(length).toString('hex');
  },

  // تولید کد تایید
  generateVerificationCode: (length = 6) => {
    return Math.floor(Math.pow(10, length - 1) + Math.random() * 9 * Math.pow(10, length - 1)).toString();
  },

  // پاک‌سازی متن
  sanitizeString: (str) => {
    if (!str) return '';
    return str.toString().trim().replace(/[<>]/g, '');
  },

  // تبدیل به slug
  slugify: (text) => {
    if (!text) return '';
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  },

  // بررسی خالی بودن
  isEmpty: (value) => {
    return value === null || 
           value === undefined || 
           value === '' || 
           (Array.isArray(value) && value.length === 0) ||
           (typeof value === 'object' && Object.keys(value).length === 0);
  },

  // حذف HTML tags
  stripHtml: (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '');
  },

  // کوتاه کردن متن
  truncate: (text, length = 100, suffix = '...') => {
    if (!text || text.length <= length) return text;
    return text.substring(0, length).trim() + suffix;
  },

  // تبدیل اعداد فارسی به انگلیسی
  persianToEnglishNumbers: (str) => {
    if (!str) return '';
    const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    const englishNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    
    let result = str.toString();
    for (let i = 0; i < persianNumbers.length; i++) {
      result = result.replace(new RegExp(persianNumbers[i], 'g'), englishNumbers[i]);
    }
    return result;
  },

  // تبدیل اعداد انگلیسی به فارسی
  englishToPersianNumbers: (str) => {
    if (!str) return '';
    const englishNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    
    let result = str.toString();
    for (let i = 0; i < englishNumbers.length; i++) {
      result = result.replace(new RegExp(englishNumbers[i], 'g'), persianNumbers[i]);
    }
    return result;
  }
};

// =============================================================================
//                              Number Utils
// =============================================================================

export const NumberUtils = {
  // فرمت‌دهی عدد با کاما
  formatNumber: (number, locale = 'fa-IR') => {
    if (isNaN(number)) return '0';
    return new Intl.NumberFormat(locale).format(number);
  },

  // فرمت‌دهی ارز
  formatCurrency: (amount, currency = 'IRR', locale = 'fa-IR') => {
    if (isNaN(amount)) return '0';
    
    const currencySymbols = {
      IRR: 'ریال',
      USD: '$',
      EUR: '€',
      AED: 'د.إ'
    };

    const formatted = new Intl.NumberFormat(locale).format(amount);
    return `${formatted} ${currencySymbols[currency] || currency}`;
  },

  // تبدیل عدد به کلمه فارسی
  numberToWords: (number) => {
    if (number === 0) return 'صفر';
    
    const ones = [
      '', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه',
      'ده', 'یازده', 'دوازده', 'سیزده', 'چهارده', 'پانزده', 'شانزده',
      'هفده', 'هجده', 'نوزده'
    ];
    
    const tens = [
      '', '', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود'
    ];
    
    const hundreds = [
      '', 'یکصد', 'دویست', 'سیصد', 'چهارصد', 'پانصد', 'ششصد', 'هفتصد', 'هشتصد', 'نهصد'
    ];

    // پیاده‌سازی ساده برای اعداد کمتر از 1000
    if (number < 20) {
      return ones[number];
    } else if (number < 100) {
      return tens[Math.floor(number / 10)] + (number % 10 !== 0 ? ' و ' + ones[number % 10] : '');
    } else if (number < 1000) {
      return hundreds[Math.floor(number / 100)] + 
             (number % 100 !== 0 ? ' و ' + this.numberToWords(number % 100) : '');
    }
    
    return number.toString(); // برای اعداد بزرگتر
  },

  // بررسی عدد صحیح
  isInteger: (value) => {
    return Number.isInteger(Number(value));
  },

  // بررسی عدد مثبت
  isPositive: (value) => {
    return Number(value) > 0;
  },

  // محدود کردن عدد در بازه
  clamp: (number, min, max) => {
    return Math.min(Math.max(number, min), max);
  },

  // رند کردن با دقت مشخص
  roundTo: (number, decimals = 2) => {
    const factor = Math.pow(10, decimals);
    return Math.round(number * factor) / factor;
  }
};

// =============================================================================
//                              File Utils
// =============================================================================

export const FileUtils = {
  // بررسی وجود فایل
  exists: async (filePath) => {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  },

  // ایجاد پوشه
  ensureDir: async (dirPath) => {
    try {
      await fs.mkdir(dirPath, { recursive: true });
      return true;
    } catch (error) {
      console.error('Error creating directory:', error);
      return false;
    }
  },

  // خواندن فایل JSON
  readJson: async (filePath) => {
    try {
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading JSON file:', error);
      return null;
    }
  },

  // نوشتن فایل JSON
  writeJson: async (filePath, data) => {
    try {
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error('Error writing JSON file:', error);
      return false;
    }
  },

  // دریافت اطلاعات فایل
  getFileInfo: async (filePath) => {
    try {
      const stats = await fs.stat(filePath);
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory()
      };
    } catch (error) {
      console.error('Error getting file info:', error);
      return null;
    }
  },

  // دریافت پسوند فایل
  getExtension: (fileName) => {
    return path.extname(fileName).toLowerCase();
  },

  // بررسی نوع فایل
  isImageFile: (fileName) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    return imageExtensions.includes(FileUtils.getExtension(fileName));
  },

  // تولید نام فایل منحصر به فرد
  generateUniqueFileName: (originalName) => {
    const extension = path.extname(originalName);
    const baseName = path.basename(originalName, extension);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${baseName}_${timestamp}_${random}${extension}`;
  }
};

// =============================================================================
//                              Array Utils
// =============================================================================

export const ArrayUtils = {
  // حذف تکراری‌ها
  unique: (array) => {
    return [...new Set(array)];
  },

  // گروه‌بندی بر اساس کلید
  groupBy: (array, key) => {
    return array.reduce((groups, item) => {
      const group = item[key];
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {});
  },

  // مرتب‌سازی بر اساس کلید
  sortBy: (array, key, direction = 'asc') => {
    return array.sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];
      
      if (direction === 'desc') {
        return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
      }
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    });
  },

  // تقسیم آرایه به قطعات
  chunk: (array, size) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  },

  // اختلاف دو آرایه
  difference: (arr1, arr2) => {
    return arr1.filter(item => !arr2.includes(item));
  },

  // اشتراک دو آرایه
  intersection: (arr1, arr2) => {
    return arr1.filter(item => arr2.includes(item));
  },

  // تصادفی کردن آرایه
  shuffle: (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  },

  // انتخاب تصادفی
  sample: (array, count = 1) => {
    const shuffled = ArrayUtils.shuffle(array);
    return count === 1 ? shuffled[0] : shuffled.slice(0, count);
  }
};

// =============================================================================
//                              Object Utils
// =============================================================================

export const ObjectUtils = {
  // کپی عمیق
  deepClone: (obj) => {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => ObjectUtils.deepClone(item));
    
    const cloned = {};
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = ObjectUtils.deepClone(obj[key]);
      }
    }
    return cloned;
  },

  // ادغام عمیق
  deepMerge: (target, source) => {
    const result = { ...target };
    
    for (let key in source) {
      if (source.hasOwnProperty(key)) {
        if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
          result[key] = ObjectUtils.deepMerge(result[key] || {}, source[key]);
        } else {
          result[key] = source[key];
        }
      }
    }
    
    return result;
  },

  // دریافت مقدار تودرتو
  get: (obj, path, defaultValue = undefined) => {
    const keys = path.split('.');
    let result = obj;
    
    for (let key of keys) {
      if (result === null || result === undefined || !result.hasOwnProperty(key)) {
        return defaultValue;
      }
      result = result[key];
    }
    
    return result;
  },

  // تنظیم مقدار تودرتو
  set: (obj, path, value) => {
    const keys = path.split('.');
    const lastKey = keys.pop();
    let current = obj;
    
    for (let key of keys) {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[lastKey] = value;
    return obj;
  },

  // حذف کلیدهای null و undefined
  removeEmpty: (obj) => {
    const cleaned = {};
    
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        if (value !== null && value !== undefined) {
          if (typeof value === 'object' && !Array.isArray(value)) {
            const cleanedValue = ObjectUtils.removeEmpty(value);
            if (Object.keys(cleanedValue).length > 0) {
              cleaned[key] = cleanedValue;
            }
          } else {
            cleaned[key] = value;
          }
        }
      }
    }
    
    return cleaned;
  },

  // انتخاب کلیدهای مشخص
  pick: (obj, keys) => {
    const picked = {};
    keys.forEach(key => {
      if (obj.hasOwnProperty(key)) {
        picked[key] = obj[key];
      }
    });
    return picked;
  },

  // حذف کلیدهای مشخص
  omit: (obj, keys) => {
    const omitted = { ...obj };
    keys.forEach(key => {
      delete omitted[key];
    });
    return omitted;
  }
};

// =============================================================================
//                            Validation Utils
// =============================================================================

export const ValidationUtils = {
  // بررسی ایمیل
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // بررسی شماره تلفن ایران
  isValidIranPhone: (phone) => {
    const phoneRegex = /^(\+98|0)?9\d{9}$/;
    return phoneRegex.test(phone.replace(/[\s-]/g, ''));
  },

  // بررسی کد ملی ایران
  isValidNationalId: (nationalId) => {
    if (!nationalId || nationalId.length !== 10) return false;
    if (/^(\d)\1{9}$/.test(nationalId)) return false;
    
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(nationalId[i]) * (10 - i);
    }
    
    const remainder = sum % 11;
    const checkDigit = parseInt(nationalId[9]);
    
    return (remainder < 2 && checkDigit === remainder) || 
           (remainder >= 2 && checkDigit === 11 - remainder);
  },

  // بررسی قدرت رمز عبور
  getPasswordStrength: (password) => {
    if (!password) return { score: 0, level: 'very-weak' };
    
    let score = 0;
    const feedback = [];
    
    // طول رمز عبور
    if (password.length >= 8) score += 2;
    else if (password.length >= 6) score += 1;
    else feedback.push('رمز عبور باید حداقل 8 کاراکتر باشد');
    
    // حروف کوچک
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('حداقل یک حرف کوچک استفاده کنید');
    
    // حروف بزرگ
    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('حداقل یک حرف بزرگ استفاده کنید');
    
    // اعداد
    if (/[0-9]/.test(password)) score += 1;
    else feedback.push('حداقل یک عدد استفاده کنید');
    
    // کاراکترهای خاص
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    else feedback.push('حداقل یک کاراکتر خاص استفاده کنید');
    
    const levels = {
      0: 'very-weak',
      1: 'weak',
      2: 'weak',
      3: 'medium',
      4: 'strong',
      5: 'very-strong',
      6: 'very-strong'
    };
    
    return {
      score,
      level: levels[score],
      feedback
    };
  },

  // بررسی URL
  isValidUrl: (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
};

// =============================================================================
//                            Crypto Utils
// =============================================================================

export const CryptoUtils = {
  // هش MD5
  md5: (data) => {
    return crypto.createHash('md5').update(data).digest('hex');
  },

  // هش SHA256
  sha256: (data) => {
    return crypto.createHash('sha256').update(data).digest('hex');
  },

  // تولید salt تصادفی
  generateSalt: (length = 16) => {
    return crypto.randomBytes(length).toString('hex');
  },

  // رمزگذاری AES
  encrypt: (text, key) => {
    const algorithm = 'aes-256-cbc';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, key);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  },

  // رمزگشایی AES
  decrypt: (encryptedData, key) => {
    const algorithm = 'aes-256-cbc';
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipher(algorithm, key);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  },

  // تولید UUID
  generateUUID: () => {
    return crypto.randomUUID();
  }
};

// =============================================================================
//                            Error Utils
// =============================================================================

export const ErrorUtils = {
  // ایجاد خطای سفارشی
  createError: (message, code = 500, details = null) => {
    const error = new Error(message);
    error.statusCode = code;
    error.details = details;
    return error;
  },

  // لاگ خطا
  logError: (error, context = {}) => {
    const errorLog = {
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      statusCode: error.statusCode,
      context
    };
    
    console.error('Error Log:', JSON.stringify(errorLog, null, 2));
    
    // در پروژه واقعی، اینجا به سرویس لاگ ارسال می‌شود
    return errorLog;
  },

  // مدیریت خطای async
  asyncHandler: (fn) => {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }
};

// =============================================================================
//                            Response Utils
// =============================================================================

export const ResponseUtils = {
  // پاسخ موفق
  success: (res, data = null, message = 'Operation successful', statusCode = 200) => {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  },

  // پاسخ خطا
  error: (res, message = 'Internal server error', statusCode = 500, details = null) => {
    return res.status(statusCode).json({
      success: false,
      message,
      details,
      timestamp: new Date().toISOString()
    });
  },

  // پاسخ اعتبارسنجی
  validationError: (res, errors) => {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
      timestamp: new Date().toISOString()
    });
  },

  // پاسخ احراز هویت
  authError: (res, message = 'Authentication required') => {
    return res.status(401).json({
      success: false,
      message,
      timestamp: new Date().toISOString()
    });
  },

  // پاسخ دسترسی
  accessError: (res, message = 'Access denied') => {
    return res.status(403).json({
      success: false,
      message,
      timestamp: new Date().toISOString()
    });
  },

  // پاسخ یافت نشد
  notFound: (res, message = 'Resource not found') => {
    return res.status(404).json({
      success: false,
      message,
      timestamp: new Date().toISOString()
    });
  }
};

// Export همه utilities
export default {
  DateUtils,
  StringUtils,
  NumberUtils,
  FileUtils,
  ArrayUtils,
  ObjectUtils,
  ValidationUtils,
  CryptoUtils,
  ErrorUtils,
  ResponseUtils
};
