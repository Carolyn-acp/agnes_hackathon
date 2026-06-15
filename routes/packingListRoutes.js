const express = require('express');
const packingListController = require('../controllers/packingListController');

const router = express.Router();

router.get('/', packingListController.showPackingList);
router.post('/', packingListController.generatePackingList);

module.exports = router;