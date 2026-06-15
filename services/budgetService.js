const DEFAULT_DAYS = 3;

const CATEGORY_WEIGHTS = {
  food: 0.32,
  transport: 0.16,
  activities: 0.26,
  shopping: 0.16,
  buffer: 0.1
};

const parseMoney = (budget) => {
  const text = String(budget || '');
  const match = text.match(/(?:[$€£¥]\s*)?(\d[\d,]*(?:\.\d+)?)/);
  const amount = match ? Number(match[1].replace(/,/g, '')) : 0;
  const currencyMatch = text.match(/[$€£¥]|SGD|USD|EUR|GBP|JPY|MYR|IDR|THB|KRW/i);
  const currency = currencyMatch ? currencyMatch[0].toUpperCase() : '$';

  return {
    amount: Number.isFinite(amount) ? amount : 0,
    currency
  };
};

const parseTripDays = ({ budget, travelDates, itinerary, days }) => {
  const providedDays = Number(days);

  if (Number.isInteger(providedDays) && providedDays > 0) {
    return providedDays;
  }

  const combined = `${budget || ''} ${travelDates || ''} ${itinerary || ''}`;
  const explicitDays = combined.match(/(\d+)\s*(?:days?|d)\b/i);

  if (explicitDays) {
    return Math.max(1, Number(explicitDays[1]));
  }

  const dayLabels = itinerary ? itinerary.match(/\bday\s+\d+\b/gi) : null;

  if (dayLabels?.length) {
    return Math.max(1, new Set(dayLabels.map((label) => label.toLowerCase())).size);
  }

  return DEFAULT_DAYS;
};

const money = (amount, currency) => {
  const rounded = Math.round(amount);

  if (currency === '$') {
    return `$${rounded}`;
  }

  return `${currency} ${rounded}`;
};

const splitLines = (text) =>
  String(text || '')
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

const extractDayText = (itinerary, dayNumber, totalDays) => {
  const text = String(itinerary || '');
  const current = new RegExp(`(?:^|\\n|\\b)(Day\\s*${dayNumber}\\b[\\s\\S]*?)(?=\\n?\\s*Day\\s*${dayNumber + 1}\\b|$)`, 'i');
  const match = text.match(current);

  if (match) {
    return match[1].trim();
  }

  const lines = splitLines(text);
  const sliceSize = Math.ceil(lines.length / totalDays) || 1;

  return lines.slice((dayNumber - 1) * sliceSize, dayNumber * sliceSize).join(' ');
};

const placeType = (place) => {
  const lower = place.toLowerCase();

  if (/market|mall|shop|boutique|district|street|bazaar|souvenir/.test(lower)) return 'shopping';
  if (/station|airport|train|bus|taxi|metro|subway|ferry/.test(lower)) return 'transport';
  if (/museum|gallery|temple|shrine|palace|park|tour|garden|landmark|observation|show|class/.test(lower)) return 'activities';
  if (/cafe|restaurant|bar|food|dinner|lunch|breakfast|brunch|dessert|hawker|ramen|sushi|snack|meal|tea|coffee/.test(lower)) return 'food';

  return 'activities';
};

const extractPlaces = (dayText) => {
  const candidates = dayText
    .replace(/Agent\s+\d+[^:]*:/gi, '')
    .split(/(?:,|;|\s+-\s+|\s+→\s+|\s+then\s+|\s+and\s+)/i)
    .map((part) => part.replace(/\b(Day\s+\d+|morning|afternoon|evening|night)\b:?/gi, '').trim())
    .filter((part) => part.length >= 4 && part.length <= 70)
    .filter((part) => !/budget|weather|outfit|pack|wear/i.test(part));

  return candidates.slice(0, 4);
};

const dayFocusMultiplier = (dayText) => {
  const lower = dayText.toLowerCase();

  return {
    food: /food|restaurant|cafe|dinner|lunch|brunch|market/.test(lower) ? 1.15 : 1,
    shopping: /shop|mall|market|boutique|souvenir|district/.test(lower) ? 1.25 : 1,
    activities: /museum|tour|ticket|show|class|palace|landmark|theme/.test(lower) ? 1.2 : 1,
    transport: /airport|station|train|taxi|day trip|ferry/.test(lower) ? 1.2 : 1,
    buffer: 1
  };
};

const allocateCategories = (dailyBudget, dayText, currency) => {
  const multipliers = dayFocusMultiplier(dayText);
  const weighted = Object.entries(CATEGORY_WEIGHTS).map(([key, value]) => [
    key,
    value * multipliers[key]
  ]);
  const totalWeight = weighted.reduce((sum, [, value]) => sum + value, 0);

  return Object.fromEntries(
    weighted.map(([key, value]) => [key, money((dailyBudget * value) / totalWeight, currency)])
  );
};

const createPlaceGuidance = (places, categoryAmounts, currency) => {
  if (!places.length) {
    return [
      {
        place: 'Main activity block',
        guidance: `Keep entry tickets, snacks, and local transport under ${money(categoryAmounts.activityRaw, currency)}.`
      }
    ];
  }

  return places.map((place) => {
    const type = placeType(place);
    const raw = categoryAmounts[`${type}Raw`] || categoryAmounts.activityRaw;
    const perPlace = raw / Math.max(1, places.filter((item) => placeType(item) === type).length);

    return {
      place,
      guidance: `Aim for ${money(perPlace, currency)} or less here; count it under ${type}.`
    };
  });
};

exports.createBudgetPlan = ({ budget, travelDates, itinerary, days }) => {
  const { amount, currency } = parseMoney(budget);
  const tripDays = parseTripDays({ budget, travelDates, itinerary, days });
  const dailyBase = amount > 0 ? amount / tripDays : 0;
  const totalBuffer = dailyBase * CATEGORY_WEIGHTS.buffer * tripDays;

  const dayPlans = Array.from({ length: tripDays }, (_, index) => {
    const dayNumber = index + 1;
    const dayText = extractDayText(itinerary, dayNumber, tripDays);
    const categories = allocateCategories(dailyBase, dayText, currency);
    const rawCategories = {
      foodRaw: dailyBase * CATEGORY_WEIGHTS.food,
      transportRaw: dailyBase * CATEGORY_WEIGHTS.transport,
      activitiesRaw: dailyBase * CATEGORY_WEIGHTS.activities,
      shoppingRaw: dailyBase * CATEGORY_WEIGHTS.shopping,
      bufferRaw: dailyBase * CATEGORY_WEIGHTS.buffer,
      activityRaw: dailyBase * CATEGORY_WEIGHTS.activities
    };

    return {
      day: dayNumber,
      title: `Day ${dayNumber}`,
      dailyLimit: money(dailyBase, currency),
      categories,
      places: createPlaceGuidance(extractPlaces(dayText), rawCategories, currency),
      tip: dayText
        ? 'Book fixed-price activities first, then use the remaining food and shopping caps as flexible spend.'
        : 'Use this as a daily envelope and move unused money into the next day.'
    };
  });

  return {
    totalBudget: amount > 0 ? money(amount, currency) : budget || 'Not set',
    days: tripDays,
    dailyAverage: money(dailyBase, currency),
    emergencyBuffer: money(totalBuffer, currency),
    summary: `Plan around ${money(dailyBase, currency)} per day, including a built-in ${money(totalBuffer, currency)} trip buffer for emergencies, weather changes, or outfit-related purchases.`,
    dayPlans
  };
};
