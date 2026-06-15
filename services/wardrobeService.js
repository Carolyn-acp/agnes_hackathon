const agnesService = require('./agnesService');

const styleProfiles = {
  street: 'street style: relaxed, graphic, layered, sneaker-friendly',
  downtown: 'downtown: sleek, black-forward, textured, sharp, city-ready',
  coquette: 'coquette: soft, romantic, fitted, ribbons, pearls, ballet flats',
  fancy: 'fancy: polished, elevated, glossy, dressy, refined accessories',
  minimal: 'minimal: clean, neutral, structured, quiet luxury',
  sporty: 'sporty chic: athletic, comfortable, fresh, practical, polished',
  'old-money': 'old money: classic, tailored, preppy, refined',
  y2k: 'Y2K: playful, shiny, nostalgic, fitted tops, mini accessories'
};

const typeAliases = {
  outer: 'outerwear',
  outerwear: 'outerwear',
  jacket: 'outerwear',
  coat: 'outerwear',
  shoe: 'shoes',
  shoes: 'shoes',
  bag: 'accessory',
  accessory: 'accessory',
  accessories: 'accessory',
  top: 'top',
  shirt: 'top',
  bottom: 'bottom',
  pants: 'bottom',
  skirt: 'bottom',
  dress: 'dress',
  fashion: 'fashion item',
  'fashion item': 'fashion item'
};

const outfitTypeOrder = ['accessory', 'outerwear', 'top', 'dress', 'bottom', 'shoes', 'fashion item'];

const typeOrderIndex = (type) => {
  const index = outfitTypeOrder.indexOf(type);
  return index === -1 ? outfitTypeOrder.length : index;
};

const clampDays = (days) => {
  if (!Number.isFinite(days)) {
    return 3;
  }

  return Math.min(Math.max(days, 1), 14);
};

const normalizeType = (type) => {
  const normalized = String(type || 'fashion item').toLowerCase().trim();
  return typeAliases[normalized] || normalized;
};

const cleanItems = (items) => items
  .filter((item) => item && item.id && item.name)
  .slice(0, 60)
  .map((item) => ({
    id: String(item.id).slice(0, 80),
    name: String(item.name).slice(0, 120),
    type: normalizeType(item.type).slice(0, 40),
    color: String(item.color || '').slice(0, 40),
    source: String(item.source || '').slice(0, 40),
    styleTags: Array.isArray(item.styleTags) ? item.styleTags.slice(0, 8).map((tag) => String(tag).slice(0, 40)) : []
  }));

const parseJson = (text) => {
  const cleaned = text.replace(/```json|```/g, '').trim();
  const firstBracket = cleaned.indexOf('[');
  const lastBracket = cleaned.lastIndexOf(']');

  if (firstBracket >= 0 && lastBracket > firstBracket) {
    return JSON.parse(cleaned.slice(firstBracket, lastBracket + 1));
  }

  return JSON.parse(cleaned);
};

const fallbackOutfits = ({ days, wardrobeItems, styleDescription, variationOffset }) => {
  const additions = [
    {
      name: 'simple jewelry',
      reason: 'Adds polish without overpowering the uploaded pieces.'
    },
    {
      name: 'small bag',
      reason: 'Keeps the outfit practical and visually complete.'
    },
    {
      name: 'matching shoes',
      reason: 'Completes the silhouette if no uploaded shoes fit the look.'
    },
    {
      name: 'hair accessory',
      reason: 'Adds a style-specific finishing detail.'
    }
  ];

  return Array.from({ length: days }, (_, index) => {
    const start = (index + variationOffset) % wardrobeItems.length;
    const selected = wardrobeItems
      .slice(start)
      .concat(wardrobeItems.slice(0, start))
      .reduce((chosen, item) => {
        if (chosen.some((selectedItem) => selectedItem.type === item.type)) {
          return chosen;
        }

        return chosen.concat(item);
      }, [])
      .slice(0, Math.min(5, wardrobeItems.length));

    return {
      day: index + 1,
      title: `Day ${index + 1} outfit`,
      selectedItemIds: selected.map((item) => item.id),
      additionalItems: [additions[(index + variationOffset) % additions.length]],
      stylingNote: `A ${styleDescription} combination using the wardrobe items provided.`
    };
  });
};

const uniqueValidIds = (ids, validIds) => {
  if (!Array.isArray(ids)) {
    return [];
  }

  return [...new Set(ids.map((id) => String(id)).filter((id) => validIds.has(id)))];
};

const fillMissingSelection = ({ selectedIds, items, day, variationOffset }) => {
  if (selectedIds.length) {
    return selectedIds;
  }

  const start = (day - 1 + variationOffset) % items.length;

  return items
    .slice(start)
    .concat(items.slice(0, start))
    .slice(0, Math.min(5, items.length))
    .map((item) => item.id);
};

const enforceOnePerCategory = (ids, itemMap) => {
  const selectedTypes = new Set();

  return ids.filter((id) => {
    const item = itemMap.get(id);

    if (!item) {
      return false;
    }

    if (selectedTypes.has(item.type)) {
      return false;
    }

    selectedTypes.add(item.type);
    return true;
  });
};

const completeCategorySelection = ({ selectedIds, items, itemMap, day, variationOffset }) => {
  const deduped = enforceOnePerCategory(selectedIds, itemMap);
  const selectedTypes = new Set(deduped.map((id) => itemMap.get(id)?.type).filter(Boolean));
  const start = (day - 1 + variationOffset) % items.length;
  const rotatedItems = items.slice(start).concat(items.slice(0, start));

  return rotatedItems.reduce((ids, item) => {
    if (selectedTypes.has(item.type)) {
      return ids;
    }

    selectedTypes.add(item.type);
    return ids.concat(item.id);
  }, deduped);
};

exports.analyzeClothingPhoto = async (imageDataUrl) => {
  const prompt = `You are a fashion AI. Analyse this clothing photo and return JSON only:
{
  "item_type": "top / bottom / dress / outer / shoes / accessory",
  "name": "specific descriptive name e.g. light wash wide-leg jeans",
  "colour": "primary colour",
  "style_tags": ["casual", "streetwear"],
  "quality": "clear / blurry / too_dark"
}
Do not say anything else. Return JSON only.`;

  const text = await agnesService.generateVisionText({
    prompt,
    imageDataUrl
  });
  const cleaned = text.replace(/```json|```/g, '').trim();
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  const parsed = JSON.parse(firstBrace >= 0 && lastBrace > firstBrace ? cleaned.slice(firstBrace, lastBrace + 1) : cleaned);

  return {
    item_type: normalizeType(parsed.item_type),
    name: String(parsed.name || 'fashion item').slice(0, 120),
    colour: String(parsed.colour || '').slice(0, 40),
    style_tags: Array.isArray(parsed.style_tags) ? parsed.style_tags.slice(0, 8).map((tag) => String(tag).slice(0, 40)) : [],
    quality: ['clear', 'blurry', 'too_dark'].includes(parsed.quality) ? parsed.quality : 'clear'
  };
};

exports.generateOutfits = async ({ style, days, wardrobeItems, variationOffset }) => {
  const outfitCount = clampDays(days);
  const items = cleanItems(wardrobeItems);

  if (!items.length) {
    throw new Error('No usable wardrobe items were provided.');
  }

  const styleDescription = styleProfiles[style] || styleProfiles.street;
  const itemList = items
    .map((item) => `- id: ${item.id}; name: ${item.name}; type: ${item.type}${item.color ? `; color: ${item.color}` : ''}${item.styleTags.length ? `; style tags: ${item.styleTags.join(', ')}` : ''}`)
    .join('\n');

  const prompt = `
You are a fashion stylist creating outfit combinations from a user's own wardrobe.

Preferred style:
${styleDescription}

Number of days and outfits required:
${outfitCount}

Variation offset:
${variationOffset}

Wardrobe items:
${itemList}

Rules:
- Make exactly ${outfitCount} outfits, one per day.
- Outfit combinations must be based ONLY on the provided wardrobe item ids.
- You may reuse the same wardrobe item ids across different days when the number of days is larger than the wardrobe size.
- Each outfit should contain a practical top-to-bottom wearable structure when available: accessory or bag, top or dress, bottom if needed, shoes.
- A single outfit cannot contain more than one item from the same category.
- Prefer one accessory or bag, one top or outer, one bottom or dress, and one pair of shoes if those categories exist.
- Put only uploaded/provided wardrobe ids in "selectedItemIds".
- Never invent clothing inside "selectedItemIds".
- If shoes, bags, or accessories are missing, recommend them only in "additionalItems".
- "additionalItems" must clearly describe that they are suggested additions, not uploaded wardrobe items.
- Keep each outfit wearable, cohesive, and visually specific.

Return ONLY valid JSON array. Each item must have this shape:
[
  {
    "day": 1,
    "title": "Short outfit name",
    "selectedItemIds": ["exact wardrobe id", "exact wardrobe id"],
    "additionalItems": [
      {
        "name": "suggested item",
        "reason": "why it matches the chosen style"
      }
    ],
    "stylingNote": "One concise sentence explaining why this works."
  }
]
`;

  let outfits;

  try {
    outfits = parseJson(await agnesService.generateText(prompt));
  } catch (error) {
    outfits = fallbackOutfits({
      days: outfitCount,
      wardrobeItems: items,
      styleDescription,
      variationOffset
    });
  }

  if (!Array.isArray(outfits)) {
    outfits = [];
  }

  if (outfits.length < outfitCount) {
    const fallback = fallbackOutfits({
      days: outfitCount,
      wardrobeItems: items,
      styleDescription,
      variationOffset
    });

    outfits = outfits.concat(fallback.slice(outfits.length));
  }

  const validIds = new Set(items.map((item) => item.id));
  const itemMap = new Map(items.map((item) => [item.id, item]));

  return outfits.slice(0, outfitCount).map((outfit, index) => ({
    day: Number.parseInt(outfit.day, 10) || index + 1,
    title: outfit.title || `Day ${index + 1} outfit`,
    selectedItemIds: completeCategorySelection({
      selectedIds: fillMissingSelection({
        selectedIds: uniqueValidIds(outfit.selectedItemIds, validIds).slice(0, 8),
        items: [...items].sort((first, second) => typeOrderIndex(first.type) - typeOrderIndex(second.type)),
        day: Number.parseInt(outfit.day, 10) || index + 1,
        variationOffset
      }),
      items: [...items].sort((first, second) => typeOrderIndex(first.type) - typeOrderIndex(second.type)),
      itemMap,
      day: Number.parseInt(outfit.day, 10) || index + 1,
      variationOffset
    }).slice(0, 7),
    additionalItems: Array.isArray(outfit.additionalItems)
      ? outfit.additionalItems.slice(0, 5).map((item) => ({
        name: String(item.name || item).slice(0, 100),
        reason: String(item.reason || 'Suggested to complete this style.').slice(0, 180)
      }))
      : [],
    stylingNote: outfit.stylingNote || ''
  }));
};
