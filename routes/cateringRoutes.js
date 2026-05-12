const express = require('express');
const router = express.Router();
const cateringController = require('../controllers/cateringController');
const { authenticate, authorize } = require('../middlewares/auth');

// Public routes
router.get('/menu', cateringController.getCateringMenu);

// Protected routes
router.post('/menu', authenticate, authorize('vendor', 'admin'), cateringController.createCateringMenuItem);
router.put('/menu/:id', authenticate, authorize('vendor', 'admin'), cateringController.updateCateringMenuItem);
router.delete('/menu/:id', authenticate, authorize('vendor', 'admin'), cateringController.deleteCateringMenuItem);
router.get('/menu-draft', authenticate, cateringController.getMenuDraft);
router.post('/menu-draft', authenticate, cateringController.saveMenuDraft);
router.get('/', authenticate, cateringController.getCateringOrders);
router.post('/', authenticate, cateringController.createCateringOrder);
router.put('/:id', authenticate, cateringController.updateCateringOrder);

// Quality Check Update (Restricted access)
router.patch(
  '/:id/quality-check',
  authenticate,
  authorize('vendor', 'admin', 'supervisor'),
  cateringController.updateQualityCheck
);

module.exports = router;

