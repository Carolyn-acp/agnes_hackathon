const itemModel = require('../models/itemModel');

exports.showHome = (req, res) => {
  res.render('home', {
    title: 'Agnes Hackathon',
    itemCount: itemModel.getAll().length
  });
};
