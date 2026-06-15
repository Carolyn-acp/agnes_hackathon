const locationService = require('../services/locationService');

exports.listCountries = async (req, res) => {
  try {
    const countries = await locationService.getCountries(req.query.q || '');

    res.json({ countries });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.listCities = async (req, res) => {
  const country = req.query.country && req.query.country.trim();

  if (!country) {
    res.status(400).json({ error: 'Country is required' });
    return;
  }

  try {
    const cities = await locationService.getCities(country);

    res.json({ cities });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
