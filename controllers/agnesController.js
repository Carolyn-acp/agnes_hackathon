const agnesService = require('../services/agnesService');

const renderAgnes = (res, options = {}) => {
  res.render('agnes', {
    title: 'Agnes AI',
    destination: '',
    budget: '',
    travelDates: '',
    weatherNotes: '',
    wardrobe: '',
    tripPlan: null,
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
  const destination = req.body.destination && req.body.destination.trim();
  const budget = req.body.budget && req.body.budget.trim();
  const travelDates = req.body.travelDates && req.body.travelDates.trim();
  const weatherNotes = req.body.weatherNotes && req.body.weatherNotes.trim();
  const wardrobe = req.body.wardrobe && req.body.wardrobe.trim();

  if (!destination || !budget) {
    renderAgnes(res, {
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
      destination,
      budget,
      travelDates,
      weatherNotes,
      wardrobe,
      tripPlan,
      imageResult,
      visualError
    });
  } catch (error) {
    renderAgnes(res, {
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
