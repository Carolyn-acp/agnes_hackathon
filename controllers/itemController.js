const itemModel = require('../models/itemModel');
const agnesService = require('../services/agnesService');

exports.listItems = (req, res) => {
  res.render('items', {
    title: 'Items',
    items: itemModel.getAll()
  });
};

exports.createItem = (req, res) => {
  const name = req.body.name && req.body.name.trim();

  if (name) {
    itemModel.create({ name });
  }

  res.redirect('/items');
};

exports.generatePackingList = async (req, res) => {
  const destination = req.body.destination && req.body.destination.trim();
  const plan = req.body.plan && req.body.plan.trim();

  if (destination) {
    try {
      const prompt = `You are a travel assistant. Create a packing list for a trip to ${destination}. The trip plan includes: ${plan || 'General sightseeing'}. Return ONLY a comma-separated list of items to pack, with no additional text, bullet points, or formatting.`;
      const textResult = await agnesService.generateText(prompt);
      
      const generatedItems = textResult.split(',').map(item => item.trim()).filter(Boolean);
      generatedItems.forEach(name => itemModel.create({ name }));
    } catch (error) {
      console.error('Failed to generate packing list:', error.message);
    }
  }

  res.redirect('/items');
};