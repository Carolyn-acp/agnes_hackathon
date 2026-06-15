exports.showHome = (req, res) => {
  res.render('home', {
    title: 'Agnes Hackathon'
  });
};

exports.showWardrobe = (req, res) => {
  res.render('wardrobe', {
    title: 'Wardrobe'
  });
};
