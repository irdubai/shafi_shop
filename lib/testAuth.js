import { registerUser, loginUser } from './lib/auth.js';
(async () => {
  try {
    await registerUser({
      username: 'test1',
      password: 'strongPa$$123',       email: 'test1@example.com',       fullName: 'تست اول',       confirmPassword: 'strongPa$$123'
    });
    const result = await loginUser('test1', 'strongPa$$123');
    console.log('ورود موفق', result);
  } catch (e) {
    console.error(e);
  }
})();

اگر سؤالی درباره routeنویسی یا ساختار کلی داشتی، همینجا بنویس!
