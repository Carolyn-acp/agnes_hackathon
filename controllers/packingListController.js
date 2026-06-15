const agnesService = require('../services/agnesService');

exports.showPackingList = (req, res) => {
  res.render('packingList', {
    title: 'Custom Packing List',
    location: '',
    weather: '',
    activities: '',
    packingList: null,
    error: null
  });
};

exports.generatePackingList = async (req, res) => {
  const location = req.body.location && req.body.location.trim();
  const weather = req.body.weather && req.body.weather.trim();
  const activities = req.body.activities && req.body.activities.trim();

  if (!location || !weather || !activities) {
    return res.render('packingList', {
      title: 'Custom Packing List',
      location,
      weather,
      activities,
      packingList: null,
      error: 'Please provide a location, weather, and activities.'
    });
  }

  try {
    const packingList = await agnesService.generateCustomPackingList({ location, weather, activities });

    res.render('packingList', {
      title: 'Custom Packing List',
      location,
      weather,
      activities,
      packingList,
      error: null
    });
  } catch (error) {
    res.render('packingList', {
      title: 'Custom Packing List',
      location,
      weather,
      activities,
      packingList: null,
      error: error.message
    });
  }
};