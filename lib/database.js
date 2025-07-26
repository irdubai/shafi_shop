// ادامه کلاس Validator...

  // دریافت اولین خطا
  getFirstError(field = null) {
    if (field) {
      return this.errors[field] ? this.errors[field][0] : null;
    }

    for (const fieldName in this.errors) {
      if (this.errors[fieldName].length > 0) {
        return this.errors[fieldName][0];
      }
    }

    return null;
  }

  // =============================================================================
  //                         Validation Methods
  // =============================================================================

  // بررسی الزامی بودن
  validateRequired(value) {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return true;
  }

  // بررسی رشته
  validateString(value) {
    return typeof value === 'string';
  }

  // بررسی عدد
  validateNumeric(value) {
    return !isNaN(Number(value)) && isFinite(Number(value));
  }

  // بررسی عدد صحیح
  validateInteger(value) {
    return Number.isInteger(Number(value));
  }

  // بررسی حداقل طول
  validateMin(value, params) {
    if (typeof value === 'string') {
      return value.length >= parseInt(params[0]);
    }
    if (typeof value === 'number') {
      return value >= parseFloat(params[0]);
    }
    if (Array.isArray(value)) {
      return value.length >= parseInt(params[0]);
    }
    return false;
  }

  // بررسی حداکثر طول
  validateMax(value, params) {
    if (typeof value === 'string') {
      return value.length <= parseInt(params[0]);
    }
    if (typeof value === 'number') {
      return value <= parseFloat(params[0]);
    }
    if (Array.isArray(value)) {
      return value.length <= parseInt(params[0]);
    }
    return false;
  }

  // بررسی بازه
  validateBetween(value, params) {
    const min = parseFloat(params[0]);
    const max = parseFloat(params[1]);
    
    if (typeof value === 'string') {
      return value.length >= min && value.length <= max;
    }
    if (typeof value === 'number') {
      return value >= min && value <= max;
    }
    if (Array.isArray(value)) {
      return value.length >= min && value.length <= max;
    }
    return false;
  }

  // بررسی ایمیل
  validateEmail(value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return typeof value === 'string' && emailRegex.test(value);
  }

  // بررسی URL
  validateUrl(value) {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }

  // بررسی تاریخ
  validateDate(value) {
    const date = new Date(value);
    return !isNaN(date.getTime());
  }

  // بررسی boolean
  validateBoolean(value) {
    return typeof value === 'boolean' || value === 'true' || value === 'false' || value === 1 || value === 0;
  }

  // بررسی آرایه
  validateArray(value) {
    return Array.isArray(value);
  }

  // بررسی شی
  validateObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  // بررسی تایید
  validateConfirmed(value, params, field) {
    const confirmField = params[0] || `${field}_confirmation`;
    const confirmValue = this.getValue(confirmField);
    return value === confirmValue;
  }

  // بررسی regex
  validateRegex(value, params) {
    const pattern = new RegExp(params[0]);
    return pattern.test(value);
  }

  // بررسی در لیست
  validateIn(value, params) {
    return params.includes(String(value));
  }

  // بررسی خارج از لیست
  validateNotIn(value, params) {
    return !params.includes(String(value));
  }

  // بررسی شماره تلفن ایران
  validatePhone(value) {
    const phoneRegex = /^(\+98|0)?9\d{9}$/;
    return typeof value === 'string' && phoneRegex.test(value.replace(/[\s-]/g, ''));
  }

  // بررسی کد ملی ایران
  validateNationalId(value) {
    if (!value || typeof value !== 'string' || value.length !== 10) return false;
    if (/^(\d)\1{9}$/.test(value)) return false;
    
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(value[i]) * (10 - i);
    }
    
    const remainder = sum % 11;
    const checkDigit = parseInt(value[9]);
    
    return (remainder < 2 && checkDigit === remainder) || 
           (remainder >= 2 && checkDigit === 11 - remainder);
  }

  // بررسی کد پستی ایران
  validatePostalCode(value) {
    const postalRegex = /^\d{10}$/;
    return typeof value === 'string' && postalRegex.test(value.replace(/[\s-]/g, ''));
  }

  // بررسی شبا
  validateSheba(value) {
    if (!value || typeof value !== 'string') return false;
    const sheba = value.replace(/[\s-]/g, '').toUpperCase();
    
    if (!/^IR\d{24}$/.test(sheba)) return false;
    
    // الگوریتم IBAN
    const rearranged = sheba.substring(4) + sheba.substring(0, 4);
    const numericString = rearranged.replace(/[A-Z]/g, char => (char.charCodeAt(0) - 55).toString());
    
    return this.mod97(numericString) === 1;
  }

  // محاسبه mod97 برای IBAN
  mod97(string) {
    let checksum = string.slice(0, 2);
    let fragment;
    
    for (let offset = 2; offset < string.length; offset += 7) {
      fragment = checksum + string.substring(offset, offset + 7);
      checksum = (parseInt(fragment, 10) % 97).toString();
    }
    
    return parseInt(checksum, 10);
  }
}

// =============================================================================
//                         Validation Rules Library
// =============================================================================

export const ValidationRules = {
  // بررسی یکتا بودن (نیاز به دیتابیس)
  unique: async (value, params, field, data) => {
    // params: [table, column, except_id]
    const [table, column, exceptId] = params;
    
    // در اینجا باید از دیتابیس بررسی شود
    // فعلاً true برمی‌گرداند
    return true;
  },

  // بررسی وجود در دیتابیس
  exists: async (value, params, field, data) => {
    // params: [table, column]
    const [table, column] = params;
    
    // در اینجا باید از دیتابیس بررسی شود
    // فعلاً true برمی‌گرداند
    return true;
  },

  // بررسی قدرت رمز عبور
  strongPassword: (value) => {
    if (!value || typeof value !== 'string') return false;
    
    const hasLower = /[a-z]/.test(value);
    const hasUpper = /[A-Z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    const hasSpecial = /[^A-Za-z0-9]/.test(value);
    const isLongEnough = value.length >= 8;
    
    return hasLower && hasUpper && hasNumber && hasSpecial && isLongEnough;
  },

  // بررسی تاریخ آینده
  afterToday: (value) => {
    const date = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date > today;
  },

  // بررسی تاریخ گذشته
  beforeToday: (value) => {
    const date = new Date(value);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return date < today;
  },

  // بررسی فایل
  file: (value) => {
    return value && typeof value === 'object' && value.size !== undefined;
  },

  // بررسی تصویر
  image: (value) => {
    if (!ValidationRules.file(value)) return false;
    const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    return imageTypes.includes(value.type);
  },

  // بررسی حداکثر حجم فایل (بر حسب KB)
  maxFileSize: (value, params) => {
    if (!ValidationRules.file(value)) return false;
    const maxSize = parseInt(params[0]) * 1024; // تبدیل KB به byte
    return value.size <= maxSize;
  }
};

// =============================================================================
//                        Predefined Validation Sets
// =============================================================================

// اعتبارسنجی ثبت نام
export const registerValidation = {
  username: 'required|string|min:3|max:30|regex:^[a-zA-Z0-9_]+$',
  email: 'required|email',
  password: 'required|strongPassword|min:8',
  confirmPassword: 'required|confirmed:password',
  fullName: 'required|string|min:2|max:100',
  phone:
