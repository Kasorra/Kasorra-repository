const express = require('express');
const router = express.Router();
const { register, login, getMe, registerValidations, loginValidations, validate } = require('../controllers/authController');
const authenticate = require('../middleware/auth');
// Public routes
router.post('/register', registerValidations, validate, register);
router.post('/login', loginValidations, validate, login);
// Protected routes
router.get('/me', authenticate, getMe);
module.exports = router;
