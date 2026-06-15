const apiBase = () => process.env.AGNES_API_BASE || 'https://apihub.agnes-ai.com/v1';

const getApiKey = () => process.env.AGNES_API_KEY || process.env.AGNES_TOKEN;

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

const postToAgnes = async (path, payload) => {
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
    throw new Error(data.error?.message || data.message || 'Agnes API request failed');
  }

  return data;
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
  const prompt = `
You are a Research Agent and Weather Agent for a travel itinerary app.

User inputs:
- Destination: ${destination}
- Budget: ${budget}
- Number of days: ${parsedDays}
- Travel dates: ${travelDates || 'Not provided'}
- Places user wants to visit: ${places || 'Not provided'}

Rules:
- Return exactly ${parsedDays} day objects in the "days" array.
- If the user asks for 5 days, return Day 1, Day 2, Day 3, Day 4, and Day 5 as separate objects.
- The user-selected places are high priority.
- Include every place from "Places user wants to visit" somewhere in the itinerary.
- If there are insufficient user-selected places to fill ${parsedDays} days, recommend additional attractions nearby that match the destination, budget, and travel style.
- Clearly label every attraction as either "user-selected" or "AI-recommended".
- Keep activities realistic for travel time and budget.
- Weather must be based on destination and travel dates. If dates are not exact enough for a real forecast, provide a seasonal estimate and say it is an estimate.

Return ONLY valid JSON with this exact shape:
{
  "days": [
    {
      "day": 1,
      "title": "Short day title",
      "weather": "Weather for this day based on the destination and dates.",
      "activities": ["Morning activity", "Afternoon activity", "Evening activity"],
      "attractions": [
        { "name": "Place name", "source": "user-selected" },
        { "name": "Nearby recommended place", "source": "AI-recommended" }
      ],
      "budgetNote": "Short budget note for this day."
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
