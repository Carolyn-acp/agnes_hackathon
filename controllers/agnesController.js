const agnesService = require('../services/agnesService');

const renderAgnes = (res, options = {}) => {
  res.render('agnes', {
    title: 'Agnes AI',
    textPrompt: '',
    imagePrompt: '',
    textResult: '',
    imageResult: '',
    error: '',
    ...options
  });
};

exports.showAgnes = (req, res) => {
  renderAgnes(res);
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
