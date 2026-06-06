const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, authorize } = require('../middlewares/auth');

router.post('/login', authController.login);
router.post('/register', authController.register);
router.get('/me', authenticate, authController.getMe);
router.get('/users', authenticate, authorize('admin'), authController.getAllUsers);
router.post('/users', authenticate, authorize('admin'), authController.createUser);
router.put('/users/:id', authenticate, authorize('admin'), authController.updateUser);
router.delete('/users/:id', authenticate, authorize('admin'), authController.deleteUser);

module.exports = router;
