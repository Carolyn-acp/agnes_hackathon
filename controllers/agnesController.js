const agnesService = require('../services/agnesService');
const fs = require('fs');
const path = require('path');

const normalizeTripPlanForView = (tripPlan) => {
  if (Array.isArray(tripPlan?.days)) {
    return tripPlan;
  }

  return null;
};

const calculateDays = (startDate, endDate) => {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return '';
  }

  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  return String(Math.round((end - start) / millisecondsPerDay) + 1);
};

const renderAgnes = (res, options = {}) => {
  res.render('agnes', {
    title: 'Agnes AI',
    country: '',
    city: '',
    destination: '',
    budget: '',
    days: '',
    places: '',
    startDate: '',
    endDate: '',
    travelDates: '',
    tripPlan: null,
    packingList: null,
    textPrompt: '',
    imagePrompt: '',
    textResult: '',
    imageResult: '',
    error: '',
    ...options,
    tripPlan: options.tripPlan ? normalizeTripPlanForView(options.tripPlan) : options.tripPlan || null,
    packingList: options.packingList || null
  });
};

exports.showAgnes = (req, res) => {
  renderAgnes(res);
};

exports.generateTrip = async (req, res) => {
  const country = req.body.country && req.body.country.trim();
  const city = req.body.city && req.body.city.trim();
  const destination = [city, country].filter(Boolean).join(', ') || (req.body.destination && req.body.destination.trim());
  const budget = req.body.budget && req.body.budget.trim();
  const places = req.body.places && req.body.places.trim();
  const startDate = req.body.startDate && req.body.startDate.trim();
  const endDate = req.body.endDate && req.body.endDate.trim();
  const days = startDate && endDate ? calculateDays(startDate, endDate) : '';
  const travelDates = startDate && endDate ? `${startDate} to ${endDate}` : '';

  if (!destination || !budget || !days || !startDate || !endDate) {
    renderAgnes(res, {
      country,
      city,
      destination,
      budget,
      days,
      places,
      startDate,
      endDate,
      travelDates,
      error: 'Enter a country, city, budget, start date, and end date.'
    });
    return;
  }

  try {
    const tripPlan = await agnesService.generateTripPlan({
      destination,
      budget,
      days,
      places,
      travelDates,
    });

    const packingList = await agnesService.generatePackingList({
      destination,
      travelDates,
      days,
      tripPlan
    });

    // Create a data directory if it doesn't exist
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Generate a unique filename and write the JSON file
    const sanitizedDest = destination.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileName = `itinerary_${sanitizedDest}_${Date.now()}.json`;
    const filePath = path.join(dataDir, fileName);

    const itineraryData = {
      destination,
      travelDates,
      tripPlan,
      packingList
    };
    fs.writeFileSync(filePath, JSON.stringify(itineraryData, null, 2));

    renderAgnes(res, {
      country,
      city,
      destination,
      budget,
      days,
      places,
      startDate,
      endDate,
      travelDates,
      tripPlan,
      packingList
    });
  } catch (error) {
    renderAgnes(res, {
      country,
      city,
      destination,
      budget,
      days,
      places,
      startDate,
      endDate,
      travelDates,
      error: error.message
    });
  }
};

exports.generateText = async (req, res) => {
  const textPrompt = req.body.prompt && req.body.prompt.trim();

  if (!textPrompt) {
    renderAgnes(res, {
      error: 'Enter a text prompt first.'
    });
    return;
  }

  try {
    const textResult = await agnesService.generateText(textPrompt);

    renderAgnes(res, {
      textPrompt,
      textResult
    });
  } catch (error) {
    renderAgnes(res, {
      textPrompt,
      error: error.message
    });
  }
};

exports.generateImage = async (req, res) => {
  const imagePrompt = req.body.prompt && req.body.prompt.trim();

  if (!imagePrompt) {
    renderAgnes(res, {
      error: 'Enter an image prompt first.'
    });
    return;
  }

  try {
    const imageResult = await agnesService.generateImage(imagePrompt);

    renderAgnes(res, {
      imagePrompt,
      imageResult
    });
  } catch (error) {
    renderAgnes(res, {
      imagePrompt,
      error: error.message
    });
  }
};