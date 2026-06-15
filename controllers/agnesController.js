const agnesService = require('../services/agnesService');

const normalizeTripPlanForView = (tripPlan) => {
  if (Array.isArray(tripPlan?.days)) {
    return tripPlan;
  }

  return null;
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
    travelDates: '',
    tripPlan: null,
    textPrompt: '',
    imagePrompt: '',
    textResult: '',
    imageResult: '',
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
  const days = req.body.days && req.body.days.trim();
  const places = req.body.places && req.body.places.trim();
  const travelDates = req.body.travelDates && req.body.travelDates.trim();

  if (!destination || !budget || !days) {
    renderAgnes(res, {
      country,
      city,
      destination,
      budget,
      days,
      places,
      travelDates,
      error: 'Enter a country, city, budget, and number of days.'
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

    renderAgnes(res, {
      country,
      city,
      destination,
      budget,
      days,
      places,
      travelDates,
      tripPlan
    });
  } catch (error) {
    renderAgnes(res, {
      country,
      city,
      destination,
      budget,
      days,
      places,
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
