const apiBase = () => process.env.AGNES_API_BASE || 'https://apihub.agnes-ai.com/v1';

const getApiKey = () => process.env.AGNES_API_KEY || process.env.AGNES_TOKEN;

const wait = (milliseconds) => new Promise((resolve) => {
  setTimeout(resolve, milliseconds);
});

const isTransientAgnesError = (message) =>
  /upstream error|timeout|temporarily|rate limit|request failed/i.test(message || '');

const toList = (value) => {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (!value) {
    return [];
  }

  return [String(value)];
};

const splitPlaces = (places) =>
  places ? places.split(/\r?\n|,/).map((place) => place.trim()).filter(Boolean) : [];

const buildFallbackDays = ({ text, destination, budget, places, parsedDays, travelDates }) => {
  const userPlaces = splitPlaces(places);

  return Array.from({ length: parsedDays }, (_, index) => {
    const place = userPlaces[index];
    const activity = place
      ? `Visit ${place}. Label: user-selected.`
      : `Ask Agnes to recommend an additional nearby attraction in ${destination}. Label: AI-recommended.`;

    return {
      day: index + 1,
      title: `Day ${index + 1} in ${destination}`,
      weather: travelDates
        ? `Weather estimate for ${travelDates}. Check a live forecast before leaving.`
        : 'Weather estimate unavailable because exact dates were not provided.',
      activities: index === 0 && text ? [text] : [activity],
      attractions: place
        ? [{ name: place, source: 'user-selected' }]
        : [{ name: 'Nearby attraction recommendation needed', source: 'AI-recommended' }],
      budgetNote: `Budget: ${budget}`
    };
  });
};

const findDayArray = (parsed) => {
  if (Array.isArray(parsed?.days)) {
    return parsed.days;
  }

  if (Array.isArray(parsed?.itinerary)) {
    return parsed.itinerary;
  }

  if (Array.isArray(parsed?.dayByDay)) {
    return parsed.dayByDay;
  }

  if (Array.isArray(parsed)) {
    return parsed;
  }

  return [];
};

const normalizeAttractions = (day) => {
  const attractions = toList(day.attractions || day.places || day.placesIncluded);

  return attractions.map((attraction) => {
    if (typeof attraction === 'object') {
      return {
        name: attraction.name || attraction.place || attraction.title || '',
        source: attraction.source || attraction.type || attraction.label || 'AI-recommended'
      };
    }

    return {
      name: String(attraction),
      source: 'user-selected'
    };
  }).filter((attraction) => attraction.name);
};

const normalizeTripPlan = ({ parsed, text, destination, budget, places, parsedDays, travelDates }) => {
  const dayCards = findDayArray(parsed);

  if (dayCards.length > 0) {
    return {
      days: dayCards.slice(0, parsedDays).map((day, index) => ({
        day: day.day || index + 1,
        title: day.title || `Day ${index + 1}`,
        weather: day.weather || 'Weather estimate unavailable.',
        activities: toList(day.activities || day.plan || day.schedule),
        attractions: normalizeAttractions(day),
        budgetNote: day.budgetNote || ''
      }))
    };
  }

  const fallbackText = parsed?.itinerary || parsed?.research || parsed?.plan || text;

  return {
    days: buildFallbackDays({ text: fallbackText, destination, budget, places, parsedDays, travelDates })
  };
};

const postToAgnesOnce = async (path, payload) => {
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new Error('Missing AGNES_API_KEY in config.env');
  }

  const response = await fetch(`${apiBase()}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data.error?.message || data.message || 'Agnes API request failed';
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return data;
};

const postToAgnes = async (path, payload) => {
  let lastError;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await postToAgnesOnce(path, payload);
    } catch (error) {
      lastError = error;

      if (attempt === 3 || (!isTransientAgnesError(error.message) && error.status < 500)) {
        break;
      }

      await wait(500 * attempt);
    }
  }

  if (isTransientAgnesError(lastError?.message)) {
    throw new Error('Agnes is temporarily having an upstream issue. Please try Generate again in a moment.');
  }

  throw lastError;
};

exports.generateText = async (prompt) => {
  const data = await postToAgnes('/chat/completions', {
    model: process.env.AGNES_TEXT_MODEL || 'agnes-2.0-flash',
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  });

  return data.choices?.[0]?.message?.content || '';
};

exports.generateTripPlan = async ({ destination, budget, travelDates, places, days }) => {
  const parsedDays = Number.parseInt(days, 10) || 1;
  const prompt = `Create a ${parsedDays}-day itinerary for ${destination}.
Budget: ${budget}
Dates: ${travelDates || 'Not provided'}
User-selected places, high priority: ${places || 'Not provided'}

Return ONLY JSON. Rules: exactly ${parsedDays} days; include all user-selected places; add nearby AI-recommended attractions if needed; label every attraction source as "user-selected" or "AI-recommended"; include weather estimate per day based on destination and dates.

JSON shape:
{
  "days": [
    {
      "day": 1,
      "title": "Short title",
      "weather": "Weather estimate",
      "activities": ["Morning", "Afternoon", "Evening"],
      "attractions": [{ "name": "Place", "source": "user-selected" }],
      "budgetNote": "Short budget note"
    }
  ]
}
`;

  const text = await exports.generateText(prompt);
  const cleaned = text.replace(/```json|```/g, '').trim();

  try {
    const parsed = JSON.parse(cleaned);

    return normalizeTripPlan({ parsed, text, destination, budget, places, parsedDays, travelDates });
  } catch (error) {
    return {
      days: buildFallbackDays({ text, destination, budget, places, parsedDays, travelDates })
    };
  }
};

exports.generateImage = async (prompt) => {
  const data = await postToAgnes(process.env.AGNES_IMAGE_ENDPOINT || '/images/generations', {
    model: process.env.AGNES_IMAGE_MODEL || 'agnes-image-2.1-flash',
    prompt
  });

  const firstImage = data.data?.[0] || data.images?.[0] || data.output?.[0] || {};

  return firstImage.url || firstImage.image_url || firstImage.b64_json || data.url || '';
};
