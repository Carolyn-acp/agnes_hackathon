const express = require('express');
const pageController = require('../controllers/pageController');

const router = express.Router();

router.get('/', pageController.showHome);
router.get('/items', pageController.listItems);
router.post('/items', pageController.createItem);

module.exports = router;
