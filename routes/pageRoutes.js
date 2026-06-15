const express = require('express');
const agnesController = require('../controllers/agnesController');
const pageController = require('../controllers/pageController');

const router = express.Router();

router.get('/', pageController.showHome);
router.get('/items', pageController.listItems);
router.post('/items', pageController.createItem);
router.get('/agnes', agnesController.showAgnes);
router.post('/agnes/text', agnesController.generateText);
router.post('/agnes/image', agnesController.generateImage);

module.exports = router;
