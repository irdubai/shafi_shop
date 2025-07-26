// =============================================================================
//                          Validation Library
//                       کتابخانه اعتبارسنجی جامع
// =============================================================================

// =============================================================================
//                           Core Validator Class
// =============================================================================

export class Validator {
  constructor(data, rules, messages = {}) {
    this.data = data;
    this.rules = rules;
    this.messages = messages;
    this.errors = {};
    this.passed = false;
  }

  // اجرای اعتبارسنجی
  validate() {
    this.errors = {};

    for (const field in this.rules) {
      const value = this.getValue(field);
      const fieldRules = this.parseRules(this.rules[field]);

      for (const rule of fieldRules) {
        if (!this.validateRule(field, value, rule)) {
          if (!this.errors[field]) {
            this.errors[field] = [];
          }
          this.errors[field].push(this.getErrorMessage(field, rule));
          break; // متوقف کردن اعتبارسنجی پس از اولین خطا
        }
      }
    }

    this.passed = Object.keys(this.errors).length === 0;
    return this;
  }

  // دریافت مقدار فیلد
  getValue(field) {
    const keys = field.split('.');
    let value = this.data;

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return undefined;
      }
    }

    return value;
  }

  // پارس کردن قوانین
  parseRules(rules) {
    if (typeof rules === 'string') {
      return rules.split('|').map(rule => {
        const [name, ...params] = rule.split(':');
        return {
          name: name.trim(),
          params: params.length > 0 ? params.join(':').split(',').map(p => p.trim()) : []
        };
      });
    }

    if (Array.isArray(rules)) {
      return rules.map(rule => {
        if (typeof rule === 'string') {
          const [name, ...params] = rule.split(':');
          return {
            name: name.trim(),
            params: params.length > 0 ? params.join(':').split(',').map(p => p.trim()) : []
          };
        }
        return rule;
      });
    }

    return [];
  }

  // اعتبارسنجی قانون
  validateRule(field, value, rule) {
    const methodName = `validate${rule.name.charAt(0).toUpperCase() + rule.name.slice(1)}`;
    
    if (typeof this[methodName] === 'function') {
      return this[methodName](value, rule.params, field);
    }

    // بررسی validator های سفارشی
    if (ValidationRules[rule.name]) {
      return ValidationRules[rule.name](value, rule.params, field, this.data);
    }

    throw new Error(`Validation rule "${rule.name}" not found`);
  }

  // دریافت پیام خطا
  getErrorMessage(field, rule) {
    const messageKey = `${field}.${rule.name}`;
    
    if (this.messages[messageKey]) {
      return this.interpolateMessage(this.messages[messageKey], field, rule.params);
    }

    const globalMessageKey = rule.name;
    if (this.messages[globalMessageKey]) {
      return this.interpolateMessage(this.messages[globalMessageKey], field, rule.params);
    }

    return this.getDefaultMessage(field, rule);
  }

  // پیام پیش‌فرض
  getDefaultMessage(field, rule) {
    const messages = {
      required: `${field} الزامی است`,
      string: `${field} باید متن باشد`,
      number: `${field} باید عدد باشد`,
      email: `${field} باید ایمیل معتبر باشد`,
      min: `${field} باید حداقل ${rule.params[0]} کاراکتر باشد`,
      max: `${field} باید حداکثر ${rule.params[0]} کاراکتر باشد`,
      between: `${field} باید بین ${rule.params[0]} تا ${rule.params[1]} کاراکتر باشد`,
      numeric: `${field} باید عدد باشد`,
      integer: `${field} باید عدد صحیح باشد`,
      phone: `${field} باید شماره تلفن معتبر باشد`,
      nationalId: `${field} باید کد ملی معتبر باشد`,
      url: `${field} باید آدرس اینترنتی معتبر باشد`,
      date: `${field} باید تاریخ معتبر باشد`,
      boolean: `${field} باید true یا false باشد`,
      array: `${field} باید آرایه باشد`,
      object: `${field} باید شی باشد`,
      confirmed: `${field} با تایید آن مطابقت ندارد`,
      unique: `${field} قبلاً استفاده شده است`,
      exists: `${field} انتخاب شده معتبر نیست`,
      regex: `فرمت ${field} نامعتبر است`,
      in: `${field} انتخاب شده معتبر نیست`,
      notIn: `${field} انتخاب شده مجاز نیست`
    };

    return messages[rule.name] || `${field} نامعتبر است`;
  }

  // جایگذاری پارامترها در پیام
  interpolateMessage(message, field, params) {
    return message
      .replace(':field', field)
      .replace(':min', params[0])
      .replace(':max', params[0])
      .replace(':value', params[0]);
  }

  // بررسی موفقیت
  passes() {
    return this.passed;
  }

  // بررسی شکست
  fails() {
    return !this.passed;
  }

  // دریافت خطاها
  getErrors() {
    return this.errors;
  }

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
  phone: 'phone',
  nationalId: 'nationalId'
};

// اعتبارسنجی ورود
export const loginValidation = {
  username: 'required|string|min:3',
  password: 'required|string|min:6'
};

// اعتبارسنجی تغییر رمز عبور
export const changePasswordValidation = {
  currentPassword: 'required|string',
  newPassword: 'required|strongPassword|min:8',
  confirmPassword: 'required|confirmed:newPassword'
};

// اعتبارسنجی مشتری
export const customerValidation = {
  name: 'required|string|min:2|max:100',
  company: 'string|max:100',
  email: 'email',
  phone: 'phone',
  mobile: 'phone',
  nationalId: 'nationalId',
  customerType: 'required|in:individual,company',
  creditLimit: 'numeric|min:0',
  paymentTerms: 'integer|min:0|max:365'
};

// اعتبارسنجی محصول
export const productValidation = {
  name: 'required|string|min:2|max:200',
  sku: 'string|max:50',
  categoryId: 'integer|exists:product_categories,id',
  purchasePrice: 'numeric|min:0',
  sellingPrice: 'numeric|min:0',
  stockQuantity: 'integer|min:0',
  minStockLevel: 'integer|min:0',
  maxStockLevel: 'integer|min:0',
  taxRate: 'numeric|min:0|max:100',
  discountRate: 'numeric|min:0|max:100'
};

// اعتبارسنجی فاکتور
export const invoiceValidation = {
  customerId: 'required|integer|exists:customers,id',
  invoiceDate: 'required|date',
  dueDate: 'date|afterToday',
  currencyCode: 'required|string|exists:currencies,code',
  status: 'in:draft,sent,paid,overdue,cancelled',
  paymentMethod: 'string|max:50',
  items: 'required|array|min:1',
  'items.*.productId': 'required|integer|exists:products,id',
  'items.*.quantity': 'required|numeric|min:0.001',
  'items.*.unitPrice': 'required|numeric|min:0'
};

// اعتبارسنجی پرداخت
export const paymentValidation = {
  invoiceId: 'integer|exists:invoices,id',
  paymentDate: 'required|date',
  amount: 'required|numeric|min:0.01',
  currencyCode: 'required|string|exists:currencies,code',
  paymentMethod: 'required|in:cash,card,bank,check,online',
  referenceNumber: 'string|max:100',
  checkNumber: 'string|max:50',
  checkDate: 'date'
};

// اعتبارسنجی چک
export const checkValidation = {
  checkNumber: 'required|string|max:50',
  bankName: 'required|string|max:100',
  amount: 'required|numeric|min:0.01',
  currencyCode: 'required|string|exists:currencies,code',
  issueDate: 'required|date',
  dueDate: 'required|date|afterToday',
  checkType: 'required|in:received,issued',
  status: 'in:pending,deposited,cleared,bounced,cancelled',
  drawerName: 'string|max:100',
  drawerNationalId: 'nationalId'
};

// =============================================================================
//                           Helper Functions
// =============================================================================

// تابع اصلی اعتبارسنجی
export const validate = (data, rules, messages = {}) => {
  const validator = new Validator(data, rules, messages);
  return validator.validate();
};

// اعتبارسنجی سریع
export const quickValidate = (data, rules) => {
  const validator = validate(data, rules);
  return {
    passes: validator.passes(),
    errors: validator.getErrors(),
    firstError: validator.getFirstError()
  };
};

// اعتبارسنجی آسنکرون
export const validateAsync = async (data, rules, messages = {}) => {
  const validator = new Validator(data, rules, messages);
  
  // اجرای قوانین آسنکرون
  for (const field in rules) {
    const value = validator.getValue(field);
    const fieldRules = validator.parseRules(rules[field]);

    for (const rule of fieldRules) {
      if (ValidationRules[rule.name] && ValidationRules[rule.name].constructor.name === 'AsyncFunction') {
        const isValid = await ValidationRules[rule.name](value, rule.params, field, data);
        if (!isValid) {
          if (!validator.errors[field]) {
            validator.errors[field] = [];
          }
          validator.errors[field].push(validator.getErrorMessage(field, rule));
          break;
        }
      }
    }
  }

  validator.passed = Object.keys(validator.errors).length === 0;
  return validator;
};

// اعتبارسنجی فیلد واحد
export const validateField = (value, rules, fieldName = 'field') => {
  const data = { [fieldName]: value };
  const validationRules = { [fieldName]: rules };
  const validator = validate(data, validationRules);
  
  return {
    passes: validator.passes(),
    errors: validator.getErrors()[fieldName] || [],
    firstError: validator.getFirstError(fieldName)
  };
};

// بررسی قدرت رمز عبور
export const checkPasswordStrength = (password) => {
  const result = {
    score: 0,
    level: 'very-weak',
    feedback: [],
    color: '#ff4757'
  };

  if (!password) {
    result.feedback.push('رمز عبور خالی است');
    return result;
  }

  // طول رمز عبور
  if (password.length >= 12) result.score += 3;
  else if (password.length >= 8) result.score += 2;
  else if (password.length >= 6) result.score += 1;
  else result.feedback.push('رمز عبور باید حداقل 6 کاراکتر باشد');

  // حروف کوچک
  if (/[a-z]/.test(password)) result.score += 1;
  else result.feedback.push('حداقل یک حرف کوچک استفاده کنید');

  // حروف بزرگ
  if (/[A-Z]/.test(password)) result.score += 1;
  else result.feedback.push('حداقل یک حرف بزرگ استفاده کنید');

  // اعداد
  if (/[0-9]/.test(password)) result.score += 1;
  else result.feedback.push('حداقل یک عدد استفاده کنید');

  // کاراکترهای خاص
  if (/[^A-Za-z0-9]/.test(password)) result.score += 1;
  else result.feedback.push('حداقل یک کاراکتر خاص استفاده کنید');

  // عدم تکرار
  if (!/(.)\1{2,}/.test(password)) result.score += 1;
  else result.feedback.push('از تکرار کاراکتر اجتناب کنید');

  // تعیین سطح و رنگ
  if (result.score <= 2) {
    result.level = 'very-weak';
    result.color = '#ff4757';
  } else if (result.score <= 4) {
    result.level = 'weak';
    result.color = '#ff6b35';
  } else if (result.score <= 6) {
    result.level = 'medium';
    result.color = '#f39c12';
  } else if (result.score <= 8) {
    result.level = 'strong';
    result.color = '#2ecc71';
  } else {
    result.level = 'very-strong';
    result.color = '#27ae60';
  }

  if (result.feedback.length === 0) {
    result.feedback.push('رمز عبور قوی است');
  }

  return result;
};

// بررسی همزمان چند اعتبارسنجی
export const validateMultiple = (validations) => {
  const results = {};
  let allPassed = true;

  for (const [key, { data, rules, messages }] of Object.entries(validations)) {
    const validator = validate(data, rules, messages || {});
    results[key] = {
      passes: validator.passes(),
      errors: validator.getErrors(),
      firstError: validator.getFirstError()
    };

    if (!validator.passes()) {
      allPassed = false;
    }
  }

  return {
    allPassed,
    results
  };
};

// اعتبارسنجی بر اساس شرط
export const conditionalValidate = (data, rules, condition) => {
  if (!condition(data)) {
    return { passes: () => true, getErrors: () => ({}) };
  }
  
  return validate(data, rules);
};

// =============================================================================
//                           Persian Messages
// =============================================================================

export const persianMessages = {
  required: ':field الزامی است',
  string: ':field باید متن باشد',
  numeric: ':field باید عدد باشد',
  integer: ':field باید عدد صحیح باشد',
  email: ':field باید ایمیل معتبر باشد',
  min: ':field باید حداقل :min کاراکتر باشد',
  max: ':field باید حداکثر :max کاراکتر باشد',
  between: ':field باید بین :min تا :max کاراکتر باشد',
  phone: ':field باید شماره تلفن معتبر باشد',
  nationalId: ':field باید کد ملی معتبر باشد',
  url: ':field باید آدرس اینترنتی معتبر باشد',
  date: ':field باید تاریخ معتبر باشد',
  boolean: ':field باید true یا false باشد',
  array: ':field باید آرایه باشد',
  object: ':field باید شی باشد',
  confirmed: ':field با تایید آن مطابقت ندارد',
  unique: ':field قبلاً استفاده شده است',
  exists: ':field انتخاب شده معتبر نیست',
  regex: 'فرمت :field نامعتبر است',
  in: ':field انتخاب شده معتبر نیست',
  notIn: ':field انتخاب شده مجاز نیست',
  strongPassword: ':field باید شامل حروف بزرگ، کوچک، عدد و کاراکتر خاص باشد',
  afterToday: ':field باید تاریخی در آینده باشد',
  beforeToday: ':field باید تاریخی در گذشته باشد',
  file: ':field باید فایل معتبر باشد',
  image: ':field باید تصویر معتبر باشد',
  maxFileSize: ':field نباید بیشتر از :max کیلوبایت باشد'
};

// =============================================================================
//                              Export Default
// =============================================================================

export default {
  Validator,
  ValidationRules,
  validate,
  quickValidate,
  validateAsync,
  validateField,
  checkPasswordStrength,
  validateMultiple,
  conditionalValidate,
  registerValidation,
  loginValidation,
  changePasswordValidation,
  customerValidation,
  productValidation,
  invoiceValidation,
  paymentValidation,
  checkValidation,
  persianMessages
};
