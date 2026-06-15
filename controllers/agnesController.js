const agnesService = require('../services/agnesService');
const budgetService = require('../services/budgetService');

const trim = (value) => (value || '').toString().trim();

const renderAgnes = (res, options = {}) => {
  res.render('agnes', {
    title: 'Agnes AI',
    country: '',
    city: '',
    destination: '',
    budget: '',
    travelDates: '',
    weatherNotes: '',
    wardrobe: '',
    tripPlan: null,
    budgetPlan: null,
    textPrompt: '',
    imagePrompt: '',
    textResult: '',
    imageResult: '',
    visualError: '',
    error: '',
    ...options
  });
};

exports.showAgnes = (req, res) => {
  renderAgnes(res);
};

exports.generateTrip = async (req, res) => {
  const country = trim(req.body.country);
  const city = trim(req.body.city);
  const destination = [city, country].filter(Boolean).join(', ') || trim(req.body.destination);
  const budget = trim(req.body.budget);
  const travelDates = trim(req.body.travelDates);
  const weatherNotes = trim(req.body.weatherNotes);
  const wardrobe = trim(req.body.wardrobe);

  if (!destination || !budget) {
    renderAgnes(res, {
      country,
      city,
      destination,
      budget,
      travelDates,
      weatherNotes,
      wardrobe,
      error: 'Enter at least a destination and budget.'
    });
    return;
  }

  try {
    const tripPlan = await agnesService.generateTripPlan({
      destination,
      budget,
      travelDates,
      weatherNotes,
      wardrobe
    });
    const budgetPlan = budgetService.createBudgetPlan({
      budget,
      travelDates,
      itinerary: tripPlan.itinerary
    });

    let imageResult = '';
    let visualError = '';

    if (tripPlan.outfitPrompt) {
      try {
        imageResult = await agnesService.generateImage(tripPlan.outfitPrompt);
      } catch (error) {
        visualError = error.message;
      }
    }

    renderAgnes(res, {
      country,
      city,
      destination,
      budget,
      travelDates,
      weatherNotes,
      wardrobe,
      tripPlan,
      budgetPlan,
      imageResult,
      visualError
    });
  } catch (error) {
    renderAgnes(res, {
      country,
      city,
      destination,
      budget,
      travelDates,
      weatherNotes,
      wardrobe,
      error: error.message
    });
  }
};

exports.generateText = async (req, res) => {
  const textPrompt = trim(req.body.prompt);

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
  const imagePrompt = trim(req.body.prompt);

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
