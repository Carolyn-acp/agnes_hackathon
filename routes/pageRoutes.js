const express = require('express');
const agnesController = require('../controllers/agnesController');
const locationController = require('../controllers/locationController');
const pageController = require('../controllers/pageController');
const wardrobeController = require('../controllers/wardrobeController');

const router = express.Router();

router.get('/', pageController.showHome);
router.get('/items', pageController.listItems);
router.post('/items', pageController.createItem);
router.get('/wardrobe', pageController.showWardrobe);
router.post('/wardrobe/analyze-photo', wardrobeController.analyzePhoto);
router.post('/wardrobe/outfits', wardrobeController.generateOutfits);
router.get('/agnes', agnesController.showAgnes);
router.post('/agnes/trip', agnesController.generateTrip);
router.post('/agnes/text', agnesController.generateText);
router.post('/agnes/image', agnesController.generateImage);
router.get('/api/countries', locationController.listCountries);
router.get('/api/cities', locationController.listCities);

module.exports = router;
