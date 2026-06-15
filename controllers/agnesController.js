const agnesService = require('../services/agnesService');
const itineraryModel = require('../models/itineraryModel');

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
    textPrompt: '',
    imagePrompt: '',
    textResult: '',
    imageResult: '',
    savedItinerary: null,
    error: '',
    ...options,
    tripPlan: options.tripPlan ? normalizeTripPlanForView(options.tripPlan) : options.tripPlan || null
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
    const savedItinerary = itineraryModel.create({
      input: {
        country,
        city,
        destination,
        budget,
        days,
        places: places ? places.split(/\r?\n|,/).map((place) => place.trim()).filter(Boolean) : [],
        startDate,
        endDate,
        travelDates
      },
      tripPlan
    });

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
      savedItinerary
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

exports.listItineraries = (req, res) => {
  res.render('itineraries', {
    title: 'Saved itineraries',
    itineraries: itineraryModel.getAll()
  });
};

exports.showItinerary = (req, res) => {
  const itinerary = itineraryModel.getById(req.params.id);

  if (!itinerary) {
    res.status(404).render('404', {
      title: 'Itinerary not found'
    });
    return;
  }

  res.render('itinerary', {
    title: 'Saved itinerary',
    itinerary
  });
};
