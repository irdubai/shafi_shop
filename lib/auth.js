// =============================================================================
//                        Authentication Library
//                     کتابخانه احراز هویت و امنیت
// =============================================================================

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { createRepository } from './database.js';

// =============================================================================
//                           Authentication Config
// =============================================================================

const AUTH_CONFIG = {
  JWT_SECRET: process.env.JWT_SECRET || 'shafi-accounting-super-secret-key-2024',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS) || 12,
  MAX_LOGIN_ATTEMPTS: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,
  LOCK_TIME: parseInt(process.env.LOCK_TIME) || 15 * 60 * 1000, // 15 minutes
  PASSWORD_MIN_LENGTH: 6,
  PASSWORD_REQUIRE_SPECIAL: false
};

// =============================================================================
//                              JWT Manager
// =============================================================================

export class JWTManager {
  // تولید Access Token
  static generateAccessToken(payload) {
    return jwt.sign(
      {
        ...payload,
        type: 'access',
        iat: Math.floor(Date.now() / 1000)
      },
      AUTH_CONFIG.JWT_SECRET,
      { 
        expiresIn: AUTH_CONFIG.JWT_EXPIRES_IN,
        issuer: 'shafi-accounting',
        audience: 'shafi-app'
      }
    );
  }

  // تولید Refresh Token
  static generateRefreshToken(payload) {
    return jwt.sign(
      {
        userId: payload.userId,
        type: 'refresh',
        iat: Math.floor(Date.now() / 1000)
      },
      AUTH_CONFIG.JWT_SECRET,
      { 
        expiresIn: AUTH_CONFIG.JWT_REFRESH_EXPIRES_IN,
        issuer: 'shafi-accounting',
        audience: 'shafi-app'
      }
    );
  }

  // تولید جفت توکن
  static generateTokenPair(payload) {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
      expiresIn: AUTH_CONFIG.JWT_EXPIRES_IN
    };
  }

  // تایید توکن
  static verifyToken(token, options = {}) {
    try {
      const decoded = jwt.verify(token, AUTH_CONFIG.JWT_SECRET, {
        issuer: 'shafi-accounting',
        audience: 'shafi-app',
        ...options
      });

      // بررسی نوع توکن
      if (options.requiredType && decoded.type !== options.requiredType) {
        throw new Error('نوع توکن نامعتبر');
      }

      return {
        valid: true,
        payload: decoded,
        error: null
      };
    } catch (error) {
      return {
        valid: false,
        payload: null,
        error: error.message
      };
    }
  }

  // رمزگشایی توکن بدون تایید
  static decodeToken(token) {
    try {
      return jwt.decode(token);
    } catch {
      return null;
    }
  }

  // بررسی انقضای توکن
  static isTokenExpired(token) {
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) return true;
    
    return Date.now() >= decoded.exp * 1000;
  }

  // تجدید توکن
  static async refreshTokens(refreshToken) {
    const verification = this.verifyToken(refreshToken, { requiredType: 'refresh' });
    
    if (!verification.valid) {
      throw new Error('توکن تجدید نامعتبر');
    }

    const userRepo = createRepository('users');
    const user = await userRepo.findById(verification.payload.userId);
    
    if (!user || !user.is_active) {
      throw new Error('کاربر یافت نشد یا غیرفعال است');
    }

    return this.generateTokenPair({
      userId: user.id,
      username: user.username,
      role: user.role
    });
  }
}

// =============================================================================
//                            Password Manager
// =============================================================================

export class PasswordManager {
  // هش کردن رمز عبور
  static async hashPassword(password) {
    if (!password) {
      throw new Error('رمز عبور نمی‌تواند خالی باشد');
    }

    return await bcrypt.hash(password, AUTH_CONFIG.BCRYPT_ROUNDS);
  }

  // مقایسه رمز عبور
  static async verifyPassword(password, hashedPassword) {
    if (!password || !hashedPassword) {
      return false;
    }

    return await bcrypt.compare(password, hashedPassword);
  }

  // تولید رمز عبور تصادفی
  static generateRandomPassword(length = 12) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    return password;
  }

  // بررسی قدرت رمز عبور
  static analyzePasswordStrength(password) {
    if (!password) {
      return { score: 0, level: 'very-weak', feedback: ['رمز عبور خالی است'] };
    }

    let score = 0;
    const feedback = [];

    // طول رمز عبور
    if (password.length >= 12) {
      score += 3;
    } else if (password.length >= 8) {
      score += 2;
    } else if (password.length >= 6) {
      score += 1;
    } else {
      feedback.push('رمز عبور باید حداقل 6 کاراکتر باشد');
    }

    // حروف کوچک
    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('حداقل یک حرف کوچک استفاده کنید');
    }

    // حروف بزرگ
    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('حداقل یک حرف بزرگ استفاده کنید');
    }

    // اعداد
    if (/[0-9]/.test(password)) {
      score += 1;
    } else {
      feedback.push('حداقل یک عدد استفاده کنید');
    }

    // کاراکترهای خاص
    if (/[^A-Za-z0-9]/.test(password)) {
      score += 1;
    } else if (AUTH_CONFIG.PASSWORD_REQUIRE_SPECIAL) {
      feedback.push('حداقل یک کاراکتر خاص استفاده کنید');
    }

    // عدم تکرار
    if (!/(.)\1{2,}/.test(password)) {
      score += 1;
    } else {
      feedback.push('از تکرار کاراکتر اجتناب کنید');
    }

    // الگوهای رایج
    const commonPatterns = [
      /123456/,
      /password/i,
      /qwerty/i,
      /admin/i
    ];

    const hasCommonPattern = commonPatterns.some(pattern => pattern.test(password));
    if (!hasCommonPattern) {
      score += 1;
    } else {
      feedback.push('از الگوهای رایج اجتناب کنید');
    }

    // تعیین سطح قدرت
    const levels = {
      0: 'very-weak',
      1: 'very-weak',
      2: 'weak',
      3: 'weak',
      4: 'medium',
      5: 'medium',
      6: 'strong',
      7: 'strong',
      8: 'very-strong',
      9: 'very-strong'
    };

    return {
      score,
      level: levels[Math.min(score, 9)],
      feedback: feedback.length > 0 ? feedback : ['رمز عبور قوی است']
    };
  }

  // اعتبارسنجی رمز عبور
  static validatePassword(password) {
    const errors = [];

    if (!password) {
      errors.push('رمز عبور الزامی است');
      return { valid: false, errors };
    }

    if (password.length < AUTH_CONFIG.PASSWORD_MIN_LENGTH) {
      errors.push(`رمز عبور باید حداقل ${AUTH_CONFIG.PASSWORD_MIN_LENGTH} کاراکتر باشد`);
    }

    if (AUTH_CONFIG.PASSWORD_REQUIRE_SPECIAL && !/[^A-Za-z0-9]/.test(password)) {
      errors.push('رمز عبور باید شامل حداقل یک کاراکتر خاص باشد');
    }

    const strength = this.analyzePasswordStrength(password);
    if (strength.level === 'very-weak') {
      errors.push('رمز عبور بسیار ضعیف است');
    }

    return {
      valid: errors.length === 0,
      errors,
      strength
    };
  }
}

// =============================================================================
//                              User Manager
// =============================================================================

export class UserManager {
  constructor() {
    this.userRepo = createRepository('users');
    this.loginAttempts = new Map(); // در پروژه واقعی از Redis استفاده شود
  }

  // ثبت نام کاربر
  async registerUser(userData) {
    const { username, email, password, fullName, role = 'user' } = userData;

    // اعتبارسنجی ورودی‌ها
    const validation = await this.validateUserData({ username, email, password, fullName });
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }

    // بررسی تکراری نبودن
    const existingUser = await this.userRepo.findOne({ username });
    if (existingUser) {
      throw new Error('نام کاربری قبلاً استفاده شده است');
    }

    const existingEmail = await this.userRepo.findOne({ email });
    if (existingEmail) {
      throw new Error('ایمیل قبلاً ثبت شده است');
    }

    // هش کردن رمز عبور
    const hashedPassword = await PasswordManager.hashPassword(password);

    // ایجاد کاربر
    const newUser = await this.userRepo.create({
      username,
      email,
      password: hashedPassword,
      full_name: fullName,
      role,
      is_active: true
    });

    // حذف رمز عبور از پاسخ
    delete newUser.password;

    return newUser;
  }

  // ورود کاربر
  async loginUser(credentials) {
    const { username, password, rememberMe = false } = credentials;

    if (!username || !password) {
      throw new Error('نام کاربری و رمز عبور الزامی است');
    }

    // بررسی محدودیت تلاش ورود
    await this.checkLoginAttempts(username);

    // یافتن کاربر
    const user = await this.userRepo.findOne({ username });
    
    if (!user) {
      await this.recordFailedAttempt(username);
      throw new Error('نام کاربری یا رمز عبور اشتباه است');
    }

    if (!user.is_active) {
      throw new Error('حساب کاربری غیرفعال است');
    }

    // بررسی رمز عبور
    const isValidPassword = await PasswordManager.verifyPassword(password, user.password);
    
    if (!isValidPassword) {
      await this.recordFailedAttempt(username);
      throw new Error('نام کاربری یا رمز عبور اشتباه است');
    }

    // پاک کردن تلاش‌های ناموفق
    this.clearFailedAttempts(username);

    // بروزرسانی آخرین ورود
    await this.userRepo.update(user.id, { last_login: new Date().toISOString() });

    // تولید توکن‌ها
    const tokens = JWTManager.generateTokenPair({
      userId: user.id,
      username: user.username,
      role: user.role
    });

    // تنظیم مدت اعتبار بر اساس remember me
    if (rememberMe) {
      tokens.expiresIn = AUTH_CONFIG.JWT_REFRESH_EXPIRES_IN;
    }

    // حذف رمز عبور از پاسخ
    delete user.password;

    return {
      user,
      tokens
    };
  }

  // تغییر رمز عبور
  async changePassword(userId, oldPassword, newPassword) {
    const user = await this.userRepo.findById(userId);
    
    if (!user) {
      throw new Error('کاربر یافت نشد');
    }

    // بررسی رمز عبور قدیمی
    const isValidOldPassword = await PasswordManager.verifyPassword(oldPassword, user.password);
    
    if (!isValidOldPassword) {
      throw new Error('رمز عبور فعلی اشتباه است');
    }

    // اعتبارسنجی رمز عبور جدید
    const passwordValidation = PasswordManager.validatePassword(newPassword);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.errors.join(', '));
    }

    // هش کردن رمز عبور جدید
    const hashedNewPassword = await PasswordManager.hashPassword(newPassword);

    // بروزرسانی رمز عبور
    await this.userRepo.update(userId, { password: hashedNewPassword });

    return { success: true, message: 'رمز عبور با موفقیت تغییر کرد' };
  }

  // بازنشانی رمز عبور
  async resetPassword(token, newPassword) {
    // تایید توکن بازنشانی
    const verification = JWTManager.verifyToken(token, { requiredType: 'reset' });
    
    if (!verification.valid) {
      throw new Error('توکن بازنشانی نامعتبر یا منقضی شده');
    }

    // اعتبارسنجی رمز عبور جدید
    const passwordValidation = PasswordManager.validatePassword(newPassword);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.errors.join(', '));
    }

    // هش کردن رمز عبور جدید
    const hashedPassword = await PasswordManager.hashPassword(newPassword);

    // بروزرسانی رمز عبور
    await this.userRepo.update(verification.payload.userId, { password: hashedPassword });

    return { success: true, message: 'رمز عبور با موفقیت بازنشانی شد' };
  }

  // ایجاد توکن بازنشانی
  async createResetToken(email) {
    const user = await this.userRepo.findOne({ email });
    
    if (!user) {
      // به دلایل امنیتی، همیشه موفقیت گزارش می‌شود
      return { success: true, message: 'در صورت وجود حساب، ایمیل ارسال شد' };
    }

    const resetToken = jwt.sign(
      {
        userId: user.id,
        type: 'reset',
        iat: Math.floor(Date.now() / 1000)
      },
      AUTH_CONFIG.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // در پروژه واقعی، ایمیل ارسال می‌شود
    console.log(`Reset token for ${email}: ${resetToken}`);

    return {
      success: true,
      message: 'لینک بازنشانی ارسال شد',
      resetToken // فقط برای تست
    };
  }

  // اعتبارسنجی داده‌های کاربر
  async validateUserData({ username, email, password, fullName }) {
    const errors = [];

    // نام کاربری
    if (!username) {
      errors.push('نام کاربری الزامی است');
    } else if (username.length < 3) {
      errors.push('نام کاربری باید حداقل 3 کاراکتر باشد');
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      errors.push('نام کاربری فقط می‌تواند شامل حروف، اعداد و خط تیره باشد');
    }

    // ایمیل
    if (!email) {
      errors.push('ایمیل الزامی است');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('فرمت ایمیل نامعتبر است');
    }

    // نام کامل
    if (!fullName) {
      errors.push('نام کامل الزامی است');
    } else if (fullName.length < 2) {
      errors.push('نام کامل باید حداقل 2 کاراکتر باشد');
    }

    // رمز عبور
    const passwordValidation = PasswordManager.validatePassword(password);
    if (!passwordValidation.valid) {
      errors.push(...passwordValidation.errors);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // بررسی محدودیت تلاش ورود
  async checkLoginAttempts(username) {
    const attempts = this.loginAttempts.get(username);
    
    if (attempts && attempts.count >= AUTH_CONFIG.MAX_LOGIN_ATTEMPTS) {
      const lockEndTime = attempts.lockedUntil;
      
      if (Date.now() < lockEndTime) {
        const remainingTime = Math.ceil((lockEndTime - Date.now()) / 1000 / 60);
        throw new Error(`حساب قفل شده است. ${remainingTime} دقیقه دیگر تلاش کنید`);
      } else {
        // قفل منقضی شده، پاک کردن
        this.loginAttempts.delete(username);
      }
    }
  }

  // ثبت تلاش ناموفق
  async recordFailedAttempt(username) {
    const attempts = this.loginAttempts.get(username) || { count: 0, lockedUntil: null };
    
    attempts.count++;
    
    if (attempts.count >= AUTH_CONFIG.MAX_LOGIN_ATTEMPTS) {
      attempts.lockedUntil = Date.now() + AUTH_CONFIG.LOCK_TIME;
    }
    
    this.loginAttempts.set(username, attempts);
  }

  // پاک کردن تلاش‌های ناموفق
  clearFailedAttempts(username) {
    this.loginAttempts.delete(username);
  }

  // دریافت اطلاعات کاربر
  async getUserInfo(userId) {
    const user = await this.userRepo.findById(userId);
    
    if (!user) {
      throw new Error('کاربر یافت نشد');
    }

    // حذف رمز عبور
    delete user.password;

    return user;
  }

  // بروزرسانی پروفایل
  async updateProfile(userId, profileData) {
    const { fullName, email, phone, address } = profileData;
    
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new Error('کاربر یافت نشد');
    }

    // بررسی تکراری نبودن ایمیل
    if (email && email !== user.email) {
      const existingEmail = await this.userRepo.findOne({ email });
      if (existingEmail) {
        throw new Error('ایمیل قبلاً استفاده شده است');
      }
    }

    const updateData = {};
    if (fullName) updateData.full_name = fullName;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;

    const updatedUser = await this.userRepo.update(userId, updateData);
    delete updatedUser.password;

    return updatedUser;
  }
}

// =============================================================================
//                           Session Manager
// =============================================================================

export class SessionManager {
  constructor() {
    this.activeSessions = new Map(); // در پروژه واقعی از Redis استفاده شود
  }

  // ایجاد session
  async createSession(userId, deviceInfo = {}) {
    const sessionId = crypto.randomUUID();
    const session = {
      id: sessionId,
      userId,
      deviceInfo,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      isActive: true
    };

    this.activeSessions.set(sessionId, session);
    return session;
  }

  // دریافت session
  async getSession(sessionId) {
    return this.activeSessions.get(sessionId);
  }

  // بروزرسانی فعالیت session
  async updateActivity(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.lastActivity = Date.now();
      this.activeSessions.set(sessionId, session);
    }
  }

  // حذف session
  async destroySession(sessionId) {
    return this.activeSessions.delete(sessionId);
  }

  // دریافت همه session های کاربر
  async getUserSessions(userId) {
    const sessions = [];
    for (const session of this.activeSessions.values()) {
      if (session.userId === userId && session.isActive) {
        sessions.push(session);
      }
    }
    return sessions;
  }

  // حذف همه session های کاربر
  async destroyUserSessions(userId) {
    let destroyed = 0;
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (session.userId === userId) {
        this.activeSessions.delete(sessionId);
        destroyed++;
      }
    }
    return destroyed;
  }

  // پاک‌سازی session های منقضی
  async cleanupExpiredSessions(maxAge = 24 * 60 * 60 * 1000) { // 24 hours
    const now = Date.now();
    let cleaned = 0;

    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (now - session.lastActivity > maxAge) {
        this.activeSessions.delete(sessionId);
        cleaned++;
      }
    }

    return cleaned;
  }
}

// =============================================================================
//                           Permission Manager
// =============================================================================

export class PermissionManager {
  // تعریف نقش‌ها و دسترسی‌ها
  static ROLES = {
    admin: {
      name: 'مدیر سیستم',
      permissions: ['*'] // دسترسی کامل
    },
    accountant: {
      name: 'حسابدار',
      permissions: [
        'invoices:read',
        'invoices:create',
        'invoices:update',
        'invoices:delete',
        'customers:read',
        'customers:create',
        'customers:update',
        'products:read',
        'products:create',
        'products:update',
        'payments:read',
        'payments:create',
        'reports:read'
      ]
    },
    user: {
      name: 'کاربر عادی',
      permissions: [
        'invoices:read',
        'customers:read',
        'products:read',
        'reports:read'
      ]
    }
  };

  // بررسی دسترسی
  static hasPermission(userRole, permission) {
    const role = this.ROLES[userRole];
    if (!role) return false;

    // دسترسی کامل برای admin
    if (role.permissions.includes('*')) return true;

    // بررسی دسترسی مشخص
    return role.permissions.includes(permission);
  }

  // بررسی چندین دسترسی
  static hasAnyPermission(userRole, permissions) {
    return permissions.some(permission => this.hasPermission(userRole, permission));
  }

  // بررسی همه دسترسی‌ها
  static hasAllPermissions(userRole, permissions) {
    return permissions.every(permission => this.hasPermission(userRole, permission));
  }

  // دریافت دسترسی‌های نقش
  static getRolePermissions(userRole) {
    const role = this.ROLES[userRole];
    return role ? role.permissions : [];
  }

  // بررسی مالکیت resource
  static canAccessResource(user, resource, action = 'read') {
    // بررسی دسترسی عمومی
    const permission = `${resource}:${action}`;
    if (!this.hasPermission(user.role, permission)) {
      return false;
    }

    // قوانین خاص بر اساس نیاز
    // مثلاً کاربر عادی فقط می‌تواند رکوردهای خودش را ببیند
    if (user.role === 'user' && resource === 'invoices') {
      // اینجا باید بررسی شود که آیا فاکتور متعلق به کاربر است یا نه
      return true; // فعلاً true برمی‌گرداند
    }

    return true;
  }
}

// =============================================================================
//                              Middleware
// =============================================================================

// Middleware احراز هویت
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'توکن احراز هویت یافت نشد'
      });
    }

    const token = authHeader.substring(7);
    const verification = JWTManager.verifyToken(token, { requiredType: 'access' });

    if (!verification.valid) {
      return res.status(401).json({
        success: false,
        message: 'توکن نامعتبر یا منقضی شده'
      });
    }

    // بررسی وجود کاربر
    const userRepo = createRepository('users');
    const user = await userRepo.findById(verification.payload.userId);

    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'کاربر یافت نشد یا غیرفعال است'
      });
    }

    // اضافه کردن اطلاعات کاربر به request
    req.user = {
      id: user.id,
      username: user.username,
      role: user.role,
      fullName: user.full_name
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'خطا در احراز هویت'
    });
  }
};

// Middleware بررسی دسترسی
export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'احراز هویت مورد نیاز است'
      });
    }

    if (!PermissionManager.hasPermission(req.user.role, permission)) {
      return res.status(403).json({
        success: false,
        message: 'دسترسی مجاز نیست'
      });
    }

    next();
  };
};

// Middleware بررسی نقش
export const requireRole = (roles) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'احراز هویت مورد نیاز است'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'دسترسی مجاز نیست'
      });
    }

    next();
  };
};

// =============================================================================
//                                Export
// =============================================================================

// Singleton instances
let userManagerInstance = null;
let sessionManagerInstance = null;

export const getUserManager = () => {
  if (!userManagerInstance) {
    userManagerInstance = new UserManager();
  }
  return userManagerInstance;
};

export const getSessionManager = () => {
  if (!sessionManagerInstance) {
    sessionManagerInstance = new SessionManager();
  }
  return sessionManagerInstance;
};

export default {
  JWTManager,
  PasswordManager,
  UserManager,
  SessionManager,
  PermissionManager,
  getUserManager,
  getSessionManager,
  authenticateToken,
  requirePermission,
  requireRole,
  AUTH_CONFIG
};
