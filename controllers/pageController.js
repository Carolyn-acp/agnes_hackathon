exports.showHome = (req, res) => {
  res.render('home', {
    title: 'Wonder Wardrobe'
  });
};

exports.showWardrobe = (req, res) => {
  res.render('wardrobe', {
    title: 'Wardrobe'
  });
};
