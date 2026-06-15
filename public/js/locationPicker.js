const countryInput = document.querySelector('[data-country-input]');
const cityInput = document.querySelector('[data-city-input]');
const countryList = document.querySelector('[data-country-list]');
const cityList = document.querySelector('[data-city-list]');
const countryStatus = document.querySelector('[data-country-status]');
const cityStatus = document.querySelector('[data-city-status]');

let lastCountryLetter = '';
let lastLoadedCountry = '';
let countryOptions = [];

const setDatalistOptions = (list, options) => {
  list.innerHTML = '';

  options.forEach((option) => {
    const item = document.createElement('option');
    item.value = option;
    list.appendChild(item);
  });
};

const loadCountriesByFirstLetter = async () => {
  const letter = countryInput.value.trim().charAt(0).toLowerCase();

  if (!letter) {
    lastCountryLetter = '';
    countryStatus.textContent = 'Type the first letter of a country.';
    setDatalistOptions(countryList, []);
    return;
  }

  if (letter === lastCountryLetter) {
    return;
  }

  lastCountryLetter = letter;
  countryStatus.textContent = `Loading countries starting with ${letter.toUpperCase()}...`;

  try {
    const response = await fetch(`/api/countries?q=${encodeURIComponent(letter)}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Could not load countries');
    }

    countryOptions = data.countries.map((country) => country.name);
    setDatalistOptions(countryList, countryOptions);
    countryStatus.textContent = `Showing countries starting with ${letter.toUpperCase()}.`;
  } catch (error) {
    countryStatus.textContent = error.message;
  }
};

const loadCities = async (country, keepSelectedCity = false) => {
  const selectedCountry = country.trim();

  if (!cityInput || !cityList || !selectedCountry || selectedCountry === lastLoadedCountry) {
    return;
  }

  const selectedCity = keepSelectedCity ? cityInput.value : '';

  lastLoadedCountry = selectedCountry;
  cityInput.value = selectedCity;
  cityInput.placeholder = 'Loading cities...';
  cityInput.disabled = true;
  cityStatus.textContent = 'Loading cities...';
  setDatalistOptions(cityList, []);

  try {
    const response = await fetch(`/api/cities?country=${encodeURIComponent(selectedCountry)}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Could not load cities');
    }

    setDatalistOptions(cityList, data.cities);
    cityInput.value = selectedCity;
    cityInput.disabled = false;
    cityInput.placeholder = 'Search city';
    cityStatus.textContent = 'Type to search, then pick a city.';
  } catch (error) {
    lastLoadedCountry = '';
    cityInput.disabled = false;
    cityInput.placeholder = 'Search city';
    cityStatus.textContent = error.message;
  }
};

const maybeLoadCities = () => {
  const country = countryInput.value.trim();

  if (!country) {
    cityInput.value = '';
    cityInput.placeholder = 'Choose a country first';
    setDatalistOptions(cityList, []);
    return;
  }

  const matchedCountry = countryOptions.find((option) => option.toLowerCase() === country.toLowerCase());

  if (!matchedCountry) {
    lastLoadedCountry = '';
    cityInput.value = '';
    cityInput.placeholder = 'Choose a full country first';
    cityStatus.textContent = 'Pick a country from the suggestions before choosing a city.';
    setDatalistOptions(cityList, []);
    return;
  }

  countryInput.value = matchedCountry;
  loadCities(matchedCountry);
};

if (countryInput) {
  countryStatus.textContent = 'Type the first letter of a country.';

  if (countryInput.value) {
    loadCountriesByFirstLetter();
    loadCities(countryInput.value, true);
  }

  countryInput.addEventListener('input', loadCountriesByFirstLetter);
  countryInput.addEventListener('change', maybeLoadCities);
  countryInput.addEventListener('blur', maybeLoadCities);
}
