// =============================================================================
//                           API Authentication
//                            احراز هویت و امنیت
// =============================================================================

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

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
      case 'POST':
        return await handleAuth(req, res);
      case 'GET':
        return await handleVerifyToken(req, res);
      case 'PUT':
        return await handleChangePassword(req, res);
      case 'DELETE':
        return await handleLogout(req, res);
      default:
        return res.status(405).json({ 
          success: false, 
          message: 'Method not allowed' 
        });
    }
  } catch (error) {
    console.error('Auth API Error:', error);
    return res.status(500).json({
      success: false,
      message: 'خطا در احراز هویت',
      error: error.message
    });
  }
}

// =============================================================================
//                            POST - ورود و ثبت‌نام
// =============================================================================

async function handleAuth(req, res) {
  const { action, username, password, email, fullName } = req.body;

  try {
    if (action === 'login') {
      return await handleLogin(req, res);
    }
    
    if (action === 'register') {
      return await handleRegister(req, res);
    }

    if (action === 'forgot-password') {
      return await handleForgotPassword(req, res);
    }

    return res.status(400).json({
      success: false,
      message: 'عمل درخواستی نامعتبر'
    });

  } catch (error) {
    console.error('Auth Action Error:', error);
    return res.status(500).json({
      success: false,
      message: 'خطا در پردازش درخواست'
    });
  }
}

// ورود کاربر
async function handleLogin(req, res) {
  const { username, password, rememberMe } = req.body;

  try {
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'نام کاربری و رمز عبور الزامی است'
      });
    }

    // جستجوی کاربر
    const user = await findUserByUsername(username);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'نام کاربری یا رمز عبور اشتباه است'
      });
    }

    // بررسی رمز عبور
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'نام کاربری یا رمز عبور اشتباه است'
      });
    }

    // تولید JWT Token
    const tokenExpiry = rememberMe ? '30d' : '24h';
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username,
        role: user.role 
      },
      process.env.JWT_SECRET || 'shafi-accounting-secret-key-2024',
      { expiresIn: tokenExpiry }
    );

    // بروزرسانی آخرین ورود
    await updateLastLogin(user.id);

    return res.status(200).json({
      success: true,
      message: 'ورود موفقیت‌آمیز',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          lastLogin: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({
      success: false,
      message: 'خطا در ورود به سیستم'
    });
  }
}

// ثبت‌نام کاربر جدید
async function handleRegister(req, res) {
  const { username, password, email, fullName, confirmPassword } = req.body;

  try {
    // اعتبارسنجی ورودی‌ها
    const validation = validateRegistration({ username, password, email, fullName, confirmPassword });
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    // بررسی وجود کاربر
    const existingUser = await findUserByUsername(username);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'نام کاربری قبلاً استفاده شده است'
      });
    }

    const existingEmail = await findUserByEmail(email);
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: 'ایمیل قبلاً ثبت شده است'
      });
    }

    // هش کردن رمز عبور
    const hashedPassword = await bcrypt.hash(password, 12);

    // ایجاد کاربر جدید
    const newUser = await createUser({
      username,
      password: hashedPassword,
      email,
      fullName,
      role: 'user',
      createdAt: new Date().toISOString(),
      isActive: true
    });

    // تولید JWT Token
    const token = jwt.sign(
      { 
        userId: newUser.id, 
        username: newUser.username,
        role: newUser.role 
      },
      process.env.JWT_SECRET || 'shafi-accounting-secret-key-2024',
      { expiresIn: '24h' }
    );

    return res.status(201).json({
      success: true,
      message: 'حساب کاربری با موفقیت ایجاد شد',
      data: {
        token,
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          fullName: newUser.fullName,
          role: newUser.role
        }
      }
    });

  } catch (error) {
    console.error('Register Error:', error);
    return res.status(500).json({
      success: false,
      message: 'خطا در ایجاد حساب کاربری'
    });
  }
}

// فراموشی رمز عبور
async function handleForgotPassword(req, res) {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'ایمیل الزامی است'
      });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      // به دلایل امنیتی، همیشه پیام موفقیت نمایش داده می‌شود
      return res.status(200).json({
        success: true,
        message: 'در صورت وجود حساب کاربری، لینک بازیابی ارسال شد'
      });
    }

    // تولید کد بازیابی
    const resetCode = generateResetCode();
    const resetExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 دقیقه

    // ذخیره کد بازیابی
    await saveResetCode(user.id, resetCode, resetExpiry);

    // ارسال ایمیل (در پروژه واقعی)
    console.log(`Reset code for ${email}: ${resetCode}`);

    return res.status(200).json({
      success: true,
      message: 'کد بازیابی ارسال شد',
      data: {
        resetCode: resetCode // فقط برای تست - در production حذف شود
      }
    });

  } catch (error) {
    console.error('Forgot Password Error:', error);
    return res.status(500).json({
      success: false,
      message: 'خطا در بازیابی رمز عبور'
    });
  }
}

// =============================================================================
//                           GET - تایید توکن
// =============================================================================

async function handleVerifyToken(req, res) {
  const { action } = req.query;
  const authHeader = req.headers.authorization;

  try {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'توکن احراز هویت یافت نشد'
      });
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'shafi-accounting-secret-key-2024');
      
      if (action === 'user-info') {
        const user = await findUserById(decoded.userId);
        if (!user) {
          return res.status(404).json({
            success: false,
            message: 'کاربر یافت نشد'
          });
        }

        return res.status(200).json({
          success: true,
          data: {
            id: user.id,
            username: user.username,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            lastLogin: user.lastLogin
          }
        });
      }

      return res.status(200).json({
        success: true,
        message: 'توکن معتبر است',
        data: {
          userId: decoded.userId,
          username: decoded.username,
          role: decoded.role
        }
      });

    } catch (tokenError) {
      return res.status(401).json({
        success: false,
        message: 'توکن نامعتبر یا منقضی شده'
      });
    }

  } catch (error) {
    console.error('Verify Token Error:', error);
    return res.status(500).json({
      success: false,
      message: 'خطا در تایید توکن'
    });
  }
}

// =============================================================================
//                          PUT - تغییر رمز عبور
// =============================================================================

async function handleChangePassword(req, res) {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  const authHeader = req.headers.authorization;

  try {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'توکن احراز هویت یافت نشد'
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'shafi-accounting-secret-key-2024');

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'تمام فیلدها الزامی است'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'رمز عبور جدید و تکرار آن یکسان نیست'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'رمز عبور باید حداقل 6 کاراکتر باشد'
      });
    }

    const user = await findUserById(decoded.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'کاربر یافت نشد'
      });
    }

    // بررسی رمز عبور فعلی
    const isValidCurrentPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidCurrentPassword) {
      return res.status(401).json({
        success: false,
        message: 'رمز عبور فعلی اشتباه است'
      });
    }

    // هش کردن رمز عبور جدید
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // بروزرسانی رمز عبور
    await updateUserPassword(user.id, hashedNewPassword);

    return res.status(200).json({
      success: true,
      message: 'رمز عبور با موفقیت تغییر کرد'
    });

  } catch (error) {
    console.error('Change Password Error:', error);
    return res.status(500).json({
      success: false,
      message: 'خطا در تغییر رمز عبور'
    });
  }
}

// =============================================================================
//                            DELETE - خروج
// =============================================================================

async function handleLogout(req, res) {
  try {
    // در پروژه واقعی، توکن در blacklist قرار می‌گیرد
    return res.status(200).json({
      success: true,
      message: 'خروج موفقیت‌آمیز'
    });
  } catch (error) {
    console.error('Logout Error:', error);
    return res.status(500).json({
      success: false,
      message: 'خطا در خروج از سیستم'
    });
  }
}

// =============================================================================
//                              توابع کمکی
// =============================================================================

// جستجوی کاربر بر اساس نام کاربری
async function findUserByUsername(username) {
  // در پروژه واقعی از دیتابیس استفاده می‌شود
  const defaultUsers = [
    {
      id: 1,
      username: 'admin',
      password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKUxRKJM8qLV7z.', // admin123
      email: 'admin@shafi.com',
      fullName: 'مدیر سیستم',
      role: 'admin',
      isActive: true,
      createdAt: '2024-01-01T00:00:00.000Z',
      lastLogin: null
    },
    {
      id: 2,
      username: 'user',
      password: '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
      email: 'user@shafi.com',
      fullName: 'کاربر تست',
      role: 'user',
      isActive: true,
      createdAt: '2024-01-01T00:00:00.000Z',
      lastLogin: null
    }
  ];

  return defaultUsers.find(user => user.username === username);
}

// جستجوی کاربر بر اساس ایمیل
async function findUserByEmail(email) {
  const defaultUsers = await findUserByUsername('admin');
  return defaultUsers ? [defaultUsers].find(user => user.email === email) : null;
}

// جستجوی کاربر بر اساس ID
async function findUserById(id) {
  const users = [
    await findUserByUsername('admin'),
    await findUserByUsername('user')
  ].filter(Boolean);
  
  return users.find(user => user.id === id);
}

// ایجاد کاربر جدید
async function createUser(userData) {
  // در پروژه واقعی در دیتابیس ذخیره می‌شود
  const newUser = {
    id: Date.now(),
    ...userData
  };
  
  console.log('Created new user:', { ...newUser, password: '[HIDDEN]' });
  return newUser;
}

// بروزرسانی آخرین ورود
async function updateLastLogin(userId) {
  console.log(`Updated last login for user ${userId}:`, new Date().toISOString());
}

// بروزرسانی رمز عبور
async function updateUserPassword(userId, hashedPassword) {
  console.log(`Updated password for user ${userId}`);
}

// ذخیره کد بازیابی
async function saveResetCode(userId, resetCode, expiry) {
  console.log(`Reset code for user ${userId}: ${resetCode}, expires: ${expiry}`);
}

// اعتبارسنجی ثبت‌نام
function validateRegistration({ username, password, email, fullName, confirmPassword }) {
  if (!username || !password || !email || !fullName || !confirmPassword) {
    return { isValid: false, message: 'تمام فیلدها الزامی است' };
  }

  if (username.length < 3) {
    return { isValid: false, message: 'نام کاربری باید حداقل 3 کاراکتر باشد' };
  }

  if (password.length < 6) {
    return { isValid: false, message: 'رمز عبور باید حداقل 6 کاراکتر باشد' };
  }

  if (password !== confirmPassword) {
    return { isValid: false, message: 'رمز عبور و تکرار آن یکسان نیست' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, message: 'فرمت ایمیل نامعتبر است' };
  }

  return { isValid: true };
}

// تولید کد بازیابی
function generateResetCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
