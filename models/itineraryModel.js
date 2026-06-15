const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const dataDir = path.join(__dirname, '..', 'data');
const dataPath = path.join(dataDir, 'itineraries.json');

const ensureStore = () => {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, '[]');
  }
};

const readAll = () => {
  ensureStore();

  try {
    const content = fs.readFileSync(dataPath, 'utf8');
    const itineraries = JSON.parse(content);

    return Array.isArray(itineraries) ? itineraries : [];
  } catch (error) {
    return [];
  }
};

const writeAll = (itineraries) => {
  ensureStore();
  fs.writeFileSync(dataPath, JSON.stringify(itineraries, null, 2));
};

exports.getAll = () =>
  readAll().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

exports.getById = (id) => readAll().find((itinerary) => itinerary.id === id);

exports.create = ({ input, tripPlan }) => {
  const itineraries = readAll();
  const itinerary = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    input,
    tripPlan
  };

  itineraries.push(itinerary);
  writeAll(itineraries);

  return itinerary;
};
