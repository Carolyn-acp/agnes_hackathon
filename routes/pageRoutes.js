const express = require('express');
const agnesController = require('../controllers/agnesController');
const budgetController = require('../controllers/budgetController');
const locationController = require('../controllers/locationController');
const pageController = require('../controllers/pageController');

const router = express.Router();

router.get('/', pageController.showHome);
router.get('/agnes', agnesController.showAgnes);
router.post('/agnes/trip', agnesController.generateTrip);
router.get('/itineraries', agnesController.listItineraries);
router.get('/itineraries/:id', agnesController.showItinerary);
router.post('/agnes/text', agnesController.generateText);
router.post('/agnes/image', agnesController.generateImage);
router.get('/budget', budgetController.showBudget);
router.post('/budget/plan', budgetController.createBudgetPlan);
router.get('/api/countries', locationController.listCountries);
router.get('/api/cities', locationController.listCities);

module.exports = router;
