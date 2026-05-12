const express = require('express');
const router = express.Router();

const { authenticate, authorize } = require('../middlewares/auth');
const inventoryController = require('../controllers/inventoryController');

// Note: Inventory is protected. Vendors can manage only their own items.

router.get('/', authenticate, inventoryController.getInventory);
router.get('/:id', authenticate, inventoryController.getInventoryItem);

router.post('/', authenticate, authorize('vendor', 'admin'), inventoryController.createInventoryItem);
router.put('/:id', authenticate, authorize('vendor', 'admin'), inventoryController.updateInventoryItem);
router.delete('/:id', authenticate, authorize('vendor', 'admin'), inventoryController.deleteInventoryItem);

module.exports = router;

