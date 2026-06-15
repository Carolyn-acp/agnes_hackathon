const wardrobeService = require('../services/wardrobeService');

exports.generateOutfits = async (req, res) => {
  const style = req.body.style && req.body.style.trim();
  const days = Number.parseInt(req.body.days, 10);
  const variationOffset = Number.parseInt(req.body.variationOffset, 10) || 0;
  const wardrobeItems = Array.isArray(req.body.items) ? req.body.items : [];

  if (!wardrobeItems.length) {
    res.status(400).json({
      error: 'Add clear wardrobe photos or typed clothing descriptions first.'
    });
    return;
  }

  try {
    const outfits = await wardrobeService.generateOutfits({
      style,
      days,
      wardrobeItems,
      variationOffset
    });

    res.json({ outfits });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

exports.analyzePhoto = async (req, res) => {
  const imageDataUrl = req.body.imageDataUrl && req.body.imageDataUrl.trim();

  if (!imageDataUrl) {
    res.status(400).json({
      error: 'Upload a clothing photo first.'
    });
    return;
  }

  try {
    const analysis = await wardrobeService.analyzeClothingPhoto(imageDataUrl);
    res.json({ analysis });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
