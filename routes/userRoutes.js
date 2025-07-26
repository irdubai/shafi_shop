// routes/userRoutes.js
import express from 'express';
import { 
  getUserManager, 
  authenticateToken, 
  requirePermission 
} from '../lib/auth.js';
import { 
  validate, 
  registerValidation, 
  changePasswordValidation 
} from '../lib/validation.js';
import { ResponseUtils } from '../lib/utils.js';
import { createRepository } from '../lib/database.js';

const router = express.Router();
const userManager = getUserManager();
const userRepo = createRepository('users');

// دریافت لیست کاربران
router.get('/', 
  authenticateToken, 
  requirePermission('users:read'), 
  async (req, res) => {
    try {
      const { page = 1, limit = 10, search } = req.query;
      
      const query = userRepo.query()
        .select(['id', 'username', 'email', 'full_name', 'role', 'is_active', 'created_at']);
      
      if (search) {
        query
          .whereLike('username', `%${search}%`)
          .orWhere('full_name', 'LIKE', `%${search}%`)
          .orWhere('email', 'LIKE', `%${search}%`);
      }
      
      const result = await query.paginate(page, limit);
      ResponseUtils.success(res, result);
      
    } catch (error) {
      ResponseUtils.error(res, error.message);
    }
  }
);

// ایجاد کاربر جدید
router.post('/', 
  authenticateToken, 
  requirePermission('users:create'), 
  async (req, res) => {
    try {
      const validator = validate(req.body, registerValidation);
      
      if (validator.fails()) {
        return ResponseUtils.validationError(res, validator.getErrors());
      }
      
      const newUser = await userManager.registerUser(req.body);
      ResponseUtils.success(res, newUser, 'کاربر با موفقیت ایجاد شد', 201);
      
    } catch (error) {
      ResponseUtils.error(res, error.message, 400);
    }
  }
);

// دریافت اطلاعات کاربر
router.get('/:id', 
  authenticateToken, 
  requirePermission('users:read'), 
  async (req, res) => {
    try {
      const user = await userRepo.findById(req.params.id);
      
      if (!user) {
        return ResponseUtils.notFound(res, 'کاربر یافت نشد');
      }
      
      // حذف رمز عبور از پاسخ
      delete user.password;
      
      ResponseUtils.success(res, user);
      
    } catch (error) {
      ResponseUtils.error(res, error.message);
    }
  }
);

// تغییر رمز عبور
router.put('/:id/change-password', 
  authenticateToken, 
  async (req, res) => {
    try {
      // بررسی دسترسی
      if (req.user.id !== parseInt(req.params.id) && req.user.role !== 'admin') {
        return ResponseUtils.accessError(res, 'فقط می‌توانید رمز عبور خود را تغییر دهید');
      }
      
      const validator = validate(req.body, changePasswordValidation);
      
      if (validator.fails()) {
        return ResponseUtils.validationError(res, validator.getErrors());
      }
      
      await userManager.changePassword(
        req.params.id, 
        req.body.currentPassword, 
        req.body.newPassword
      );
      
      ResponseUtils.success(res, null, 'رمز عبور با موفقیت تغییر کرد');
      
    } catch (error) {
      ResponseUtils.error(res, error.message, 400);
    }
  }
);

export default router;
