const budgetService = require('../services/budgetService');

const renderBudget = (res, options = {}) => {
  res.render('budget', {
    title: 'Budget Planner',
    destination: '',
    budget: '',
    travelDates: '',
    days: '',
    itineraryText: '',
    budgetPlan: null,
    error: '',
    ...options
  });
};

const parseItineraryJson = (itineraryJson) => {
  if (!itineraryJson) {
    return '';
  }

  try {
    const days = JSON.parse(itineraryJson);

    if (!Array.isArray(days)) {
      return '';
    }

    return days
      .map((day) => {
        const activities = Array.isArray(day.activities) ? day.activities.join(', ') : day.activities || '';
        const attractions = Array.isArray(day.attractions)
          ? day.attractions.map((attraction) => attraction.name).filter(Boolean).join(', ')
          : '';

        return [
          `Day ${day.day || ''}: ${day.title || ''}`.trim(),
          activities,
          attractions,
          day.budgetNote ? `Budget note: ${day.budgetNote}` : ''
        ]
          .filter(Boolean)
          .join(', ');
      })
      .join('\n');
  } catch (error) {
    return '';
  }
};

exports.showBudget = (req, res) => {
  renderBudget(res);
};

exports.createBudgetPlan = (req, res) => {
  const destination = req.body.destination && req.body.destination.trim();
  const budget = req.body.budget && req.body.budget.trim();
  const travelDates = req.body.travelDates && req.body.travelDates.trim();
  const days = req.body.days && req.body.days.trim();
  const itineraryText =
    (req.body.itineraryText && req.body.itineraryText.trim()) ||
    parseItineraryJson(req.body.itineraryJson);

  if (!budget || !itineraryText) {
    renderBudget(res, {
      destination,
      budget,
      travelDates,
      days,
      itineraryText,
      error: 'Enter a budget and itinerary so the planner can split spending by day.'
    });
    return;
  }

  const budgetPlan = budgetService.createBudgetPlan({
    budget,
    travelDates,
    days,
    itinerary: itineraryText
  });

  renderBudget(res, {
    destination,
    budget,
    travelDates,
    days,
    itineraryText,
    budgetPlan
  });
};
