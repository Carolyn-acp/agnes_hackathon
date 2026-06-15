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

exports.generateImage = async (prompt) => {
  const data = await postToAgnes(process.env.AGNES_IMAGE_ENDPOINT || '/images/generations', {
    model: process.env.AGNES_IMAGE_MODEL || 'agnes-image-2.1-flash',
    prompt
  });

  const firstImage = data.data?.[0] || data.images?.[0] || data.output?.[0] || {};

  return firstImage.url || firstImage.image_url || firstImage.b64_json || data.url || '';
};
