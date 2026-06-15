const countrySelect = document.querySelector('[data-country-select]');
const citySelect = document.querySelector('[data-city-select]');
const countryStatus = document.querySelector('[data-country-status]');
const cityStatus = document.querySelector('[data-city-status]');

const setOptions = (select, options, placeholder) => {
  select.innerHTML = '';

  const placeholderOption = document.createElement('option');
  placeholderOption.value = '';
  placeholderOption.textContent = placeholder;
  select.appendChild(placeholderOption);

  options.forEach((option) => {
    const item = document.createElement('option');
    item.value = option.value;
    item.textContent = option.label;
    select.appendChild(item);
  });
};

const loadCountries = async () => {
  if (!countrySelect) {
    return;
  }

  const selectedCountry = countrySelect.dataset.selectedCountry;

  countryStatus.textContent = 'Loading countries...';

  try {
    const response = await fetch('/api/countries');
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Could not load countries');
    }

    setOptions(
      countrySelect,
      data.countries.map((country) => ({
        value: country.name,
        label: country.name
      })),
      'Select a country'
    );

    if (selectedCountry) {
      countrySelect.value = selectedCountry;
      loadCities(selectedCountry);
    }

    countryStatus.textContent = '';
  } catch (error) {
    countryStatus.textContent = error.message;
  }
};

const loadCities = async (country) => {
  if (!citySelect || !country) {
    setOptions(citySelect, [], 'Select a city');
    citySelect.disabled = true;
    return;
  }

  const selectedCity = citySelect.dataset.selectedCity;

  citySelect.disabled = true;
  cityStatus.textContent = 'Loading cities...';

  try {
    const response = await fetch(`/api/cities?country=${encodeURIComponent(country)}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Could not load cities');
    }

    setOptions(
      citySelect,
      data.cities.map((city) => ({
        value: city,
        label: city
      })),
      'Select a city'
    );

    if (selectedCity) {
      citySelect.value = selectedCity;
    }

    citySelect.disabled = false;
    cityStatus.textContent = '';
  } catch (error) {
    cityStatus.textContent = error.message;
  }
};

if (countrySelect) {
  loadCountries();

  countrySelect.addEventListener('change', () => {
    loadCities(countrySelect.value);
  });
}
