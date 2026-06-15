const path = require('path');
const express = require('express');
const pageRoutes = require('./routes/pageRoutes');
const packingListRoutes = require('./routes/packingListRoutes');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true, limit: '8mb' }));
app.use(express.json({ limit: '8mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', pageRoutes);
app.use('/packing-list', packingListRoutes);

app.use((req, res) => {
  res.status(404).render('404', {
    title: 'Page not found'
  });
});

module.exports = app;
