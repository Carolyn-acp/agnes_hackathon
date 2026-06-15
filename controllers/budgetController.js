const budgetService = require('../services/budgetService');
const itineraryModel = require('../models/itineraryModel');

const itineraryToText = (itinerary) => {
  if (!itinerary?.tripPlan?.days) {
    return '';
  }

  return itinerary.tripPlan.days
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
};

const renderBudget = (res, options = {}) => {
  res.render('budget', {
    title: 'Budget Planner',
    itineraries: itineraryModel.getAll(),
    selectedItineraryId: '',
    selectedItinerary: null,
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

exports.showBudget = (req, res) => {
  const selectedItinerary = req.query.itineraryId
    ? itineraryModel.getById(req.query.itineraryId)
    : null;

  renderBudget(res, selectedItinerary
    ? {
        selectedItineraryId: selectedItinerary.id,
        selectedItinerary,
        destination: selectedItinerary.input.destination,
        budget: selectedItinerary.input.budget,
        travelDates: selectedItinerary.input.travelDates,
        days: selectedItinerary.input.days,
        itineraryText: itineraryToText(selectedItinerary)
      }
    : {});
};

exports.createBudgetPlan = (req, res) => {
  const selectedItineraryId = req.body.itineraryId && req.body.itineraryId.trim();
  const selectedItinerary = selectedItineraryId ? itineraryModel.getById(selectedItineraryId) : null;
  const destination = selectedItinerary?.input.destination || '';
  const budget = selectedItinerary?.input.budget || '';
  const travelDates = selectedItinerary?.input.travelDates || '';
  const days = selectedItinerary?.input.days || '';
  const itineraryText = itineraryToText(selectedItinerary);

  if (!selectedItinerary || !budget || !itineraryText) {
    renderBudget(res, {
      selectedItineraryId,
      selectedItinerary,
      destination,
      budget,
      travelDates,
      days,
      itineraryText,
      error: 'Choose a saved itinerary so the planner can split spending by day.'
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
    selectedItineraryId,
    selectedItinerary,
    destination,
    budget,
    travelDates,
    days,
    itineraryText,
    budgetPlan
  });
};
