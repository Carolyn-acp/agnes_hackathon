const itemModel = require('../models/itemModel');

exports.showHome = (req, res) => {
  res.render('home', {
    title: 'Agnes Hackathon',
    itemCount: itemModel.getAll().length
  });
};

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
