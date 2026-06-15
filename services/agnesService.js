const apiBase = () => process.env.AGNES_API_BASE || 'https://apihub.agnes-ai.com/v1';

const getApiKey = () => process.env.AGNES_API_KEY || process.env.AGNES_TOKEN;

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

exports.generateTripPlan = async ({ destination, budget, travelDates, weatherNotes, wardrobe }) => {
  const prompt = `
You are a multi-agent travel stylist. Build a practical trip plan from the user inputs.

User inputs:
- Destination: ${destination}
- Budget: ${budget}
- Travel dates: ${travelDates || 'Not provided'}
- Weather notes from user: ${weatherNotes || 'Not provided'}
- Wardrobe owned by user: ${wardrobe || 'Not provided'}

Return ONLY valid JSON with this exact shape:
{
  "itinerary": "Agent 1 Research Agent: concise day-by-day itinerary.",
  "weather": "Agent 2 Weather Agent: visible weather expectations for each activity, including temperature, rain, humidity, and comfort advice. If exact live weather is unavailable, say it is an AI estimate and recommend checking a live forecast before leaving.",
  "wardrobe": "Agent 3 Wardrobe Agent: what clothes from the user's wardrobe fit the destination and weather.",
  "packing": "Agent 4 Packing Agent: packing checklist.",
  "spending": "Agent 5 Spending Agent: budget optimization plan.",
  "outfitPrompt": "Agent 6 Visual Agent: a detailed image-generation prompt for daily outfit previews."
}
`;

  const text = await exports.generateText(prompt);
  const cleaned = text.replace(/```json|```/g, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    return {
      itinerary: text,
      weather: 'Weather was not returned in the expected format. Try again, or add clearer destination and date details.',
      wardrobe: '',
      packing: '',
      spending: '',
      outfitPrompt: `Travel outfit preview for ${destination}, suitable for ${weatherNotes || 'the expected weather'}.`
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
