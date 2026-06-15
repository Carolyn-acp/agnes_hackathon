const restCountriesBase = () => process.env.RESTCOUNTRIES_API_BASE || 'https://api.restcountries.com';

const getRestCountriesApiKey = () => process.env.RESTCOUNTRIES_API_KEY;

const normalizeCountryName = (country) => {
  if (typeof country === 'string') {
    return country;
  }

  return (
    country.names?.common ||
    country.names?.official ||
    country.name?.common ||
    country.name?.official ||
    country.name ||
    country.country ||
    country.commonName ||
    ''
  );
};

const normalizeCountries = (payload) => {
  const list = Array.isArray(payload)
    ? payload
    : payload.data?.objects || payload.data || payload.results || payload.countries || [];

  return list
    .map((country) => {
      const name = normalizeCountryName(country);

      return {
        name,
        code: country.codes?.cca2 || country.cca2 || country.code || country.iso2 || name
      };
    })
    .filter((country) => country.name)
    .sort((a, b) => a.name.localeCompare(b.name));
};

exports.getCountries = async (query = '') => {
  const apiKey = getRestCountriesApiKey();
  const search = query.trim();

  if (search.length === 1) {
    const response = await fetch(
      process.env.COUNTRIES_LIST_ENDPOINT || 'https://countriesnow.space/api/v0.1/countries/positions'
    );
    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.error) {
      throw new Error(data.msg || data.message || 'Countries API request failed');
    }

    return normalizeCountries(data).filter((country) =>
      country.name.toLowerCase().startsWith(search.toLowerCase())
    );
  }

  const url = search
    ? `${restCountriesBase()}/countries/v5?q=${encodeURIComponent(search)}`
    : `${restCountriesBase()}/countries/v5`;

  const response = await fetch(url, {
    headers: apiKey
      ? {
          Authorization: `Bearer ${apiKey}`
        }
      : {}
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error?.message || data.message || 'Countries API request failed');
  }

  const countries = normalizeCountries(data);

  if (!search) {
    return countries;
  }

  return countries.filter((country) => country.name.toLowerCase().startsWith(search.toLowerCase()));
};

exports.getCities = async (country) => {
  const response = await fetch(
    process.env.CITIES_API_ENDPOINT || 'https://countriesnow.space/api/v0.1/countries/cities',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ country })
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.error) {
    throw new Error(data.msg || data.message || 'Cities API request failed');
  }

  return (data.data || [])
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
};
