const wardrobeState = {
  items: [],
  combinationIndex: 0
};

const styleProfiles = {
  street: {
    name: 'Street style',
    mood: 'relaxed, graphic, layered, and sneaker-friendly',
    formula: 'balance a strong base with one casual statement piece',
    details: ['crossbody bag', 'chunky sneakers', 'cap', 'oversized jacket']
  },
  downtown: {
    name: 'Downtown',
    mood: 'sleek, black-forward, textured, and night-ready',
    formula: 'keep the palette tight and add one sharp layer',
    details: ['leather jacket', 'boots', 'silver jewelry', 'small shoulder bag']
  },
  coquette: {
    name: 'Coquette',
    mood: 'soft, romantic, fitted, and bow-friendly',
    formula: 'pair a feminine base with delicate accessories',
    details: ['ballet flats', 'ribbon', 'pearls', 'cardigan']
  },
  fancy: {
    name: 'Fancy',
    mood: 'polished, elevated, glossy, and dressy',
    formula: 'choose the cleanest silhouette and finish with refined accessories',
    details: ['heels', 'clutch', 'statement earrings', 'tailored blazer']
  },
  minimal: {
    name: 'Minimal',
    mood: 'clean, neutral, structured, and quiet',
    formula: 'use simple shapes and repeat one color family',
    details: ['loafers', 'watch', 'structured tote', 'fine jewelry']
  },
  sporty: {
    name: 'Sporty chic',
    mood: 'comfortable, athletic, fresh, and practical',
    formula: 'mix one sporty item with one polished item',
    details: ['trainers', 'zip jacket', 'baseball cap', 'clean tote']
  },
  'old-money': {
    name: 'Old money',
    mood: 'classic, tailored, preppy, and refined',
    formula: 'lean on crisp basics and heritage accessories',
    details: ['loafers', 'belt', 'cardigan over shoulders', 'pearl studs']
  },
  y2k: {
    name: 'Y2K',
    mood: 'playful, shiny, low-rise, and nostalgic',
    formula: 'combine a fitted top with a standout accessory',
    details: ['mini bag', 'tinted glasses', 'platform shoes', 'hair clips']
  }
};

const selectors = {
  inputs: document.querySelectorAll('[data-wardrobe-input]'),
  grid: document.querySelector('[data-wardrobe-grid]'),
  count: document.querySelector('[data-wardrobe-count]'),
  qualityMessage: document.querySelector('[data-quality-message]'),
  descriptionInput: document.querySelector('[data-description-input]'),
  addDescription: document.querySelector('[data-add-description]'),
  styleSelect: document.querySelector('[data-style-select]'),
  daysInput: document.querySelector('[data-days-input]'),
  generateOutfit: document.querySelector('[data-generate-outfit]'),
  addCombination: document.querySelector('[data-add-combination]'),
  generationStatus: document.querySelector('[data-generation-status]'),
  results: document.querySelector('[data-outfit-results]')
};

const typeKeywords = [
  { type: 'dress', words: ['dress', 'gown', 'jumpsuit', 'romper'] },
  { type: 'top', words: ['top', 'shirt', 'tee', 'tshirt', 'blouse', 'tank', 'crop', 'camisole', 'sweater', 'hoodie'] },
  { type: 'bottom', words: ['skirt', 'pants', 'jeans', 'trousers', 'shorts', 'leggings', 'cargo'] },
  { type: 'outerwear', words: ['jacket', 'coat', 'blazer', 'cardigan', 'vest', 'parka'] },
  { type: 'shoes', words: ['shoes', 'sneaker', 'sneakers', 'boots', 'heels', 'flats', 'loafers', 'sandals', 'mules'] },
  { type: 'accessory', words: ['bag', 'belt', 'hat', 'cap', 'scarf', 'ring', 'necklace', 'earrings', 'bracelet', 'sunglasses', 'hoops', 'watch'] }
];

const normalizeName = (name) => name.toLowerCase().replace(/[_-]+/g, ' ');

const classifyItem = (name) => {
  const normalized = normalizeName(name);
  const match = typeKeywords.find((entry) => entry.words.some((word) => normalized.includes(word)));
  return match ? match.type : 'fashion item';
};

const formatType = (type) => type.charAt(0).toUpperCase() + type.slice(1);

const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const normalizeAnalysisType = (type) => {
  const normalized = String(type || '').toLowerCase().trim();
  const aliases = {
    outer: 'outerwear',
    outerwear: 'outerwear',
    shoe: 'shoes',
    shoes: 'shoes',
    accessory: 'accessory',
    accessories: 'accessory',
    bag: 'accessory',
    top: 'top',
    bottom: 'bottom',
    pants: 'bottom',
    skirt: 'bottom',
    dress: 'dress'
  };

  return aliases[normalized] || normalized || 'fashion item';
};

const loadImage = (file) => new Promise((resolve, reject) => {
  const url = URL.createObjectURL(file);
  const image = new Image();

  image.onload = () => resolve({ image, url });
  image.onerror = () => {
    URL.revokeObjectURL(url);
    reject(new Error('Image could not be read.'));
  };

  image.src = url;
});

const estimateDominantColor = (image) => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true });
  const size = 48;

  canvas.width = size;
  canvas.height = size;
  context.drawImage(image, 0, 0, size, size);

  const pixels = context.getImageData(0, 0, size, size).data;
  let red = 0;
  let green = 0;
  let blue = 0;
  let count = 0;

  for (let index = 0; index < pixels.length; index += 16) {
    const alpha = pixels[index + 3];

    if (alpha > 80) {
      red += pixels[index];
      green += pixels[index + 1];
      blue += pixels[index + 2];
      count += 1;
    }
  }

  if (!count) {
    return 'neutral';
  }

  return nameColor(Math.round(red / count), Math.round(green / count), Math.round(blue / count));
};

const nameColor = (red, green, blue) => {
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const brightness = max / 255;
  const spread = max - min;

  if (brightness < 0.18) return 'black';
  if (brightness > 0.88 && spread < 35) return 'white';
  if (spread < 22) return brightness > 0.55 ? 'gray' : 'charcoal';

  if (red > green + 35 && red > blue + 35) return green > 110 ? 'coral' : 'red';
  if (green > red + 20 && green > blue + 20) return blue > 120 ? 'teal' : 'green';
  if (blue > red + 25 && blue > green + 15) return red > 120 ? 'lavender' : 'blue';
  if (red > 180 && green > 135 && blue < 105) return 'tan';
  if (red > 120 && green < 100 && blue > 105) return 'pink';

  return 'neutral';
};

const calculateBlurScore = (image) => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true });
  const width = 96;
  const height = 96;

  canvas.width = width;
  canvas.height = height;
  context.drawImage(image, 0, 0, width, height);

  const data = context.getImageData(0, 0, width, height).data;
  const gray = new Float32Array(width * height);

  for (let index = 0; index < gray.length; index += 1) {
    const pixel = index * 4;
    gray[index] = data[pixel] * 0.299 + data[pixel + 1] * 0.587 + data[pixel + 2] * 0.114;
  }

  const edges = [];

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const center = gray[y * width + x] * 4;
      const laplacian = center - gray[y * width + x - 1] - gray[y * width + x + 1] - gray[(y - 1) * width + x] - gray[(y + 1) * width + x];
      edges.push(laplacian);
    }
  }

  const mean = edges.reduce((total, value) => total + value, 0) / edges.length;
  const variance = edges.reduce((total, value) => total + (value - mean) ** 2, 0) / edges.length;

  return Math.round(variance);
};

const imageToAnalysisDataUrl = (image) => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  const maxSize = 768;
  const scale = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight));

  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL('image/jpeg', 0.82);
};

const analyzePhotoWithAgnes = async (image) => {
  const response = await fetch('/wardrobe/analyze-photo', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      imageDataUrl: imageToAnalysisDataUrl(image)
    })
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Agnes photo analysis failed.');
  }

  return data.analysis;
};

const processImage = async (file) => {
  const { image, url } = await loadImage(file);
  const lowResolution = image.naturalWidth < 640 || image.naturalHeight < 640;
  const blurScore = calculateBlurScore(image);
  const unclear = blurScore < 55;
  let type = classifyItem(file.name);
  let color = estimateDominantColor(image);
  let name = `${color} ${type}`;
  let styleTags = [];
  let quality = unclear ? 'blurry' : 'clear';
  let analysisNote = 'Local photo check used.';

  if (!lowResolution) {
    try {
      const analysis = await analyzePhotoWithAgnes(image);
      type = normalizeAnalysisType(analysis.item_type);
      color = analysis.colour || color;
      name = analysis.name || name;
      styleTags = Array.isArray(analysis.style_tags) ? analysis.style_tags : [];
      quality = analysis.quality || quality;
      analysisNote = 'Analysed by Agnes AI.';
    } catch (error) {
      analysisNote = `Agnes analysis unavailable. ${analysisNote}`;
    }
  }

  const hasQualityIssue = lowResolution || quality === 'blurry' || quality === 'too_dark';

  return {
    id: createId(),
    name: hasQualityIssue ? cleanFileName(file.name) : name,
    originalName: file.name,
    type,
    color,
    styleTags,
    quality,
    previewUrl: url,
    source: 'photo',
    status: hasQualityIssue ? 'Retake recommended' : 'Recognized',
    statusTone: hasQualityIssue ? 'warning' : 'success',
    detail: hasQualityIssue
      ? buildQualityDetail(lowResolution, quality !== 'clear', image, blurScore, quality)
      : `${analysisNote} Looks like ${name}. Resolution ${image.naturalWidth}x${image.naturalHeight}.`,
    usable: !hasQualityIssue
  };
};

const cleanFileName = (name) => name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').trim() || 'Fashion item';

const buildQualityDetail = (lowResolution, unclear, image, blurScore, quality = '') => {
  const issues = [];

  if (lowResolution) {
    issues.push(`low resolution ${image.naturalWidth}x${image.naturalHeight}`);
  }

  if (quality === 'too_dark') {
    issues.push('too dark');
  } else if (unclear) {
    issues.push(`unclear photo score ${blurScore}`);
  }

  return `Photo may be ${issues.join(' and ')}. Retake or upload a sharper image.`;
};

const addItem = (item) => {
  wardrobeState.items.push(item);
  renderWardrobe();
};

const renderWardrobe = () => {
  selectors.count.textContent = `${wardrobeState.items.length} ${wardrobeState.items.length === 1 ? 'item' : 'items'}`;

  if (!wardrobeState.items.length) {
    selectors.grid.innerHTML = `
      <article class="empty-state">
        <h3>No wardrobe items yet</h3>
        <p>Your uploaded clothes, skirts, accessories, shoes, bags, and fashion files will appear here.</p>
      </article>
    `;
    return;
  }

  selectors.grid.innerHTML = wardrobeState.items.map((item) => `
    <article class="wardrobe-item">
      ${item.previewUrl ? `<img src="${item.previewUrl}" alt="${escapeHtml(item.name)}">` : `<div class="file-preview" aria-hidden="true">${formatType(item.type).slice(0, 2)}</div>`}
      <div class="wardrobe-item-body">
        <div>
          <h3>${escapeHtml(item.name)}</h3>
          <p>${escapeHtml(formatType(item.type))}</p>
        </div>
        <span class="item-status ${item.statusTone}">${escapeHtml(item.status)}</span>
        <p class="item-detail">${escapeHtml(item.detail)}</p>
        ${item.styleTags && item.styleTags.length ? `<p class="item-tags">${item.styleTags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}</p>` : ''}
        <button class="ghost-button" type="button" data-remove-item="${item.id}">Remove</button>
      </div>
    </article>
  `).join('');
};

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#039;'
}[character]));

const handleFiles = async (files) => {
  const acceptedFiles = Array.from(files);

  if (!acceptedFiles.length) {
    return;
  }

  selectors.qualityMessage.textContent = 'Checking item quality...';

  for (const file of acceptedFiles) {
    if (file.type.startsWith('image/')) {
      try {
        const item = await processImage(file);
        addItem(item);
        selectors.qualityMessage.textContent = item.usable ? `${item.name} recognized.` : item.detail;
      } catch (error) {
        selectors.qualityMessage.textContent = error.message;
      }
    } else {
      addItem({
        id: createId(),
        name: cleanFileName(file.name),
        originalName: file.name,
        type: classifyItem(file.name),
        color: '',
        styleTags: [],
        source: 'file',
        status: 'File added',
        statusTone: 'neutral',
        detail: 'Add a typed description if this file needs more styling context.',
        usable: true
      });
      selectors.qualityMessage.textContent = `${file.name} added.`;
    }
  }
};

const addDescriptions = () => {
  const rawText = selectors.descriptionInput.value.trim();

  if (!rawText) {
    selectors.qualityMessage.textContent = 'Add a clothing description first.';
    return;
  }

  rawText
    .split(/[\n,]+/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .forEach((entry) => {
      addItem({
        id: createId(),
        name: entry,
        originalName: entry,
        type: classifyItem(entry),
        color: '',
        styleTags: [],
        source: 'description',
        status: 'Typed item',
        statusTone: 'neutral',
        detail: 'Ready for outfit combinations.',
        usable: true
      });
    });

  selectors.descriptionInput.value = '';
  selectors.qualityMessage.textContent = 'Description added to wardrobe.';
};

const getItemsByType = (type) => wardrobeState.items.filter((item) => item.usable && item.type === type);

const pickItem = (items, offset) => {
  if (!items.length) {
    return null;
  }

  return items[offset % items.length];
};

const getUsableWardrobePayload = () => wardrobeState.items
  .filter((item) => item.usable)
  .map((item) => ({
    id: item.id,
    name: item.name,
    type: item.type,
    color: item.color,
    source: item.source,
    styleTags: item.styleTags || []
  }));

const getDayCount = () => {
  const days = Number.parseInt(selectors.daysInput.value, 10);

  if (!Number.isFinite(days)) {
    return 3;
  }

  return Math.min(Math.max(days, 1), 14);
};

const setGenerating = (isGenerating, message = '') => {
  selectors.generateOutfit.disabled = isGenerating;
  selectors.addCombination.disabled = isGenerating;
  selectors.generationStatus.textContent = message;
};

const getWardrobeItemById = (id) => wardrobeState.items.find((item) => item.id === id);

const getImageSource = (imageResult) => {
  if (!imageResult) {
    return '';
  }

  return imageResult.startsWith('http') || imageResult.startsWith('data:')
    ? imageResult
    : `data:image/png;base64,${imageResult}`;
};

const renderOutfitStackItem = (item) => {
  if (!item) {
    return '';
  }

  if (item.previewUrl) {
    return `
      <figure class="outfit-stack-piece">
        <img src="${escapeHtml(item.previewUrl)}" alt="${escapeHtml(item.name)}">
        <figcaption>${escapeHtml(item.name)}</figcaption>
      </figure>
    `;
  }

  return `
    <figure class="outfit-stack-piece flatlay-text-piece">
      <div>${escapeHtml(formatType(item.type).slice(0, 2))}</div>
      <figcaption>${escapeHtml(item.name)}</figcaption>
    </figure>
  `;
};

const arrangeWearableOrder = (items) => {
  const rank = {
    accessory: 1,
    outerwear: 2,
    top: 3,
    dress: 4,
    bottom: 5,
    shoes: 6,
    'fashion item': 7
  };

  return [...items].sort((first, second) => (rank[first.type] || 7) - (rank[second.type] || 7));
};

const groupOutfitItems = (items) => {
  const arranged = arrangeWearableOrder(items);
  const groupMap = {
    top: [],
    middle: [],
    bottom: [],
    finish: []
  };

  arranged.forEach((item) => {
    if (item.type === 'accessory') {
      groupMap.finish.push(item);
    } else if (item.type === 'outerwear' || item.type === 'top') {
      groupMap.top.push(item);
    } else if (item.type === 'dress' || item.type === 'bottom') {
      groupMap.middle.push(item);
    } else if (item.type === 'shoes') {
      groupMap.bottom.push(item);
    } else {
      groupMap.middle.push(item);
    }
  });

  return groupMap;
};

const renderOutfitRow = (label, items) => {
  if (!items.length) {
    return '';
  }

  return `
    <div class="outfit-stack-row">
      <span>${escapeHtml(label)}</span>
      <div class="outfit-stack-items">
        ${items.map(renderOutfitStackItem).join('')}
      </div>
    </div>
  `;
};

const renderOutfits = (outfits, { append = false } = {}) => {
  if (!append) {
    selectors.results.innerHTML = '';
  } else if (selectors.results.querySelector('.empty-state')) {
    selectors.results.innerHTML = '';
  }

  const cards = outfits.map((outfit) => {
    const selectedIds = Array.isArray(outfit.selectedItemIds) ? outfit.selectedItemIds : [];
    const selectedItems = arrangeWearableOrder(selectedIds.map(getWardrobeItemById).filter(Boolean));
    const groupedItems = groupOutfitItems(selectedItems);
    const additionalItems = Array.isArray(outfit.additionalItems) ? outfit.additionalItems : [];
    const wornItemText = selectedItems.map((item) => item.name).join(', ') || 'Wardrobe items selected by Agnes';
    const imageSource = getImageSource(outfit.imageResult);
    const additionsMarkup = additionalItems.length
      ? `
        <div class="suggested-additions">
          <strong>Suggested additions:</strong>
          <ul>
            ${additionalItems.map((item) => `
              <li>
                <span>${escapeHtml(item.name || item)}</span>
                <small>${escapeHtml(item.reason || 'Recommended to complete the selected style.')}</small>
              </li>
            `).join('')}
          </ul>
        </div>
      `
      : '<p><strong>Suggested additions:</strong> None. This outfit uses only uploaded wardrobe items.</p>';

    return `
      <article class="outfit-card visual-outfit-card">
        <p class="eyebrow">Day ${escapeHtml(outfit.day)}</p>
        <h3>${escapeHtml(outfit.title)}</h3>
        ${imageSource ? `<img class="outfit-illustration" src="${escapeHtml(imageSource)}" alt="${escapeHtml(outfit.title)} Agnes flat lay fashion illustration">` : ''}
        <div class="outfit-stack" aria-label="${escapeHtml(outfit.title)} top to bottom outfit arrangement">
          ${renderOutfitRow('Finish', groupedItems.finish)}
          ${renderOutfitRow('Top', groupedItems.top)}
          ${renderOutfitRow('Main', groupedItems.middle)}
          ${renderOutfitRow('Shoes', groupedItems.bottom)}
        </div>
        <p><strong>From your wardrobe:</strong> ${escapeHtml(wornItemText)}.</p>
        ${additionsMarkup}
        <p>${escapeHtml(outfit.stylingNote || 'A wearable outfit combination based on the selected style.')}</p>
      </article>
    `;
  }).join('');

  if (append) {
    selectors.results.insertAdjacentHTML('beforeend', cards);
  } else {
    selectors.results.innerHTML = cards;
  }
};

const requestOutfits = async ({ days, append = false } = {}) => {
  const usableItems = wardrobeState.items.filter((item) => item.usable);

  if (!usableItems.length) {
    selectors.results.innerHTML = `
      <article class="empty-state compact">
        <h3>No usable items yet</h3>
        <p>Add clear photos or a typed outfit description.</p>
      </article>
    `;
    return;
  }

  const requestedDays = days || getDayCount();
  setGenerating(true, `Asking Agnes to choose ${requestedDays} wardrobe-based ${requestedDays === 1 ? 'outfit' : 'outfits'}...`);

  if (!append) {
    selectors.results.innerHTML = `
      <article class="empty-state compact">
        <h3>Generating outfits</h3>
        <p>Agnes is choosing uploaded wardrobe items only. The outfit image will be arranged from top to bottom.</p>
      </article>
    `;
  }

  try {
    const response = await fetch('/wardrobe/outfits', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        style: selectors.styleSelect.value,
        days: requestedDays,
        variationOffset: wardrobeState.combinationIndex,
        items: getUsableWardrobePayload()
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Outfit generation failed.');
    }

    renderOutfits(data.outfits || [], { append });
    setGenerating(false, append ? 'Added another wardrobe-based outfit.' : 'Wardrobe-based outfits are ready.');
  } catch (error) {
    setGenerating(false, '');
    selectors.results.innerHTML = `
      <article class="empty-state compact">
        <h3>Could not generate images</h3>
        <p>${escapeHtml(error.message)}</p>
      </article>
    `;
  }
};

selectors.inputs.forEach((input) => {
  input.addEventListener('change', (event) => {
    handleFiles(event.target.files);
    event.target.value = '';
  });
});

selectors.addDescription.addEventListener('click', addDescriptions);

selectors.generateOutfit.addEventListener('click', () => {
  wardrobeState.combinationIndex = 0;
  requestOutfits({ days: getDayCount() });
});

selectors.addCombination.addEventListener('click', () => {
  wardrobeState.combinationIndex += 1;
  requestOutfits({ days: 1, append: true });
});

selectors.grid.addEventListener('click', (event) => {
  const removeButton = event.target.closest('[data-remove-item]');

  if (!removeButton) {
    return;
  }

  wardrobeState.items = wardrobeState.items.filter((item) => item.id !== removeButton.dataset.removeItem);
  renderWardrobe();
});
