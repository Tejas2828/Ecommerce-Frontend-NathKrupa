/**
 * Shop client APIs — matches Django `shop.urls` under `api/shop/`.
 * Set VITE_API_BASE_URL in .env (e.g. http://127.0.0.1:8000) if the backend is not on localhost:8000.
 */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(
  /\/$/,
  ''
);

/** Turn relative media paths from the API into absolute URLs. */
export function resolveApiMediaUrl(path) {
  if (!path) return '';
  const s = String(path);
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  const base = API_BASE_URL.replace(/\/$/, '');
  return s.startsWith('/') ? `${base}${s}` : `${base}/${s}`;
}

const PRODUCTS_LIST_PATH = '/api/shop/shop/client/products-list/';
const PRODUCT_INFO_PATH = (id) => `/api/shop/shop/client/product-info/${id}/`;
const TYPESENSE_SEARCH_PATH = '/api/shop/shop/typesense-search/';
const COMPATIBILITY_SEARCH_PATH = '/api/shop/shop/compatibility-search/';
const CAR_MAKERS_PATH = '/api/shop/shop/car-makers-readonly/';
const CAR_MODELS_PATH = '/api/shop/shop/car-models-readonly/';
const CAR_YEARS_PATH = '/api/shop/shop/car-years/';
const CAR_VARIANTS_PATH = '/api/shop/shop/car-variants/';
const COMPATIBILITY_GROUPS_PATH = '/api/shop/shop/compatibility-groups-readonly/';
const USER_GARAGE_PATH = '/api/shop/shop/client/user-garage/';
const CUSTOMER_PROFILE_PATH = '/api/shop/shop/client/customer-profile/';

/**
 * @param {{ page?: number, pageSize?: number, search?: string }} [opts]
 * @returns {Promise<{ count: number, next: string|null, previous: string|null, results: object[] }>}
 */
export async function fetchProductsList(opts = {}) {
  const { page = 1, pageSize = 12, search } = opts;
  const params = new URLSearchParams({
    is_active: 'true',
    page: String(page),
    page_size: String(Math.min(pageSize, 50)),
  });
  if (search && search.trim()) {
    params.set('search', search.trim());
  }
  const url = `${API_BASE_URL}${PRODUCTS_LIST_PATH}?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Failed to load products (${res.status})`);
  }
  return res.json();
}

/**
 * FetchProductInfo — full product detail for PDP.
 * @param {string} productId UUID string
 */
export async function fetchProductInfo(productId) {
  const url = `${API_BASE_URL}${PRODUCT_INFO_PATH(productId)}`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Failed to load product (${res.status})`);
  }
  return res.json();
}

/**
 * Typesense product search (text).
 * @param {{ q: string, page?: number, perPage?: number, filterBy?: string }} opts
 */
export async function fetchTypesenseSearch(opts) {
  const { q, page = 1, perPage = 50, filterBy } = opts;
  const params = new URLSearchParams({
    q: q.trim(),
    page: String(page),
    per_page: String(Math.min(perPage, 100)),
  });
  if (filterBy) params.set('filter_by', filterBy);
  const url = `${API_BASE_URL}${TYPESENSE_SEARCH_PATH}?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Search failed (${res.status})`);
  }
  return res.json();
}

/**
 * Vehicle + Typesense compatibility search (maker / model / year / variant).
 * @param {Record<string, string|undefined|null>} filters
 */
export async function fetchCompatibilitySearch(filters = {}) {
  const {
    maker_id,
    model_id,
    year,
    variant_id,
    compatibility_group_id,
    q = '*',
    page = 1,
    per_page = 50,
  } = filters;
  const params = new URLSearchParams({
    q: (q && String(q).trim()) || '*',
    page: String(page),
    per_page: String(Math.min(Number(per_page) || 50, 100)),
  });
  if (maker_id) params.set('maker_id', String(maker_id));
  if (model_id) params.set('model_id', String(model_id));
  if (year) params.set('year', String(year));
  if (variant_id) params.set('variant_id', String(variant_id));
  if (compatibility_group_id) params.set('compatibility_group_id', String(compatibility_group_id));
  const url = `${API_BASE_URL}${COMPATIBILITY_SEARCH_PATH}?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Vehicle search failed (${res.status})`);
  }
  return res.json();
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Request failed (${res.status})`);
  }
  return res.json();
}

/** @returns {Promise<{ error: boolean, data: Array<{id: string, name: string, slug?: string}> }>} */
export async function fetchCarMakers() {
  const url = `${API_BASE_URL}${CAR_MAKERS_PATH}?limit=200`;
  return fetchJson(url);
}

/** @param {string} makerId */
export async function fetchCarModels(makerId) {
  const params = new URLSearchParams({ maker_id: makerId, limit: '200' });
  const url = `${API_BASE_URL}${CAR_MODELS_PATH}?${params.toString()}`;
  return fetchJson(url);
}

/**
 * @param {string} modelId
 * @param {{ compatibility_group_id?: string }} [opts]
 */
export async function fetchCarYears(modelId, opts = {}) {
  const params = new URLSearchParams({ model_id: modelId });
  if (opts.compatibility_group_id) {
    params.set('compatibility_group_id', String(opts.compatibility_group_id));
  }
  const url = `${API_BASE_URL}${CAR_YEARS_PATH}?${params.toString()}`;
  return fetchJson(url);
}

/**
 * Compatibility groups that include at least one variant for this model line.
 * @param {string} modelId
 * @param {{ maker_id?: string }} [opts] — optional maker filter (backend car_maker)
 */
export async function fetchCompatibilityGroupsForModel(modelId, opts = {}) {
  const params = new URLSearchParams({ model_id: modelId, limit: '200' });
  if (opts.maker_id) params.set('car_maker', String(opts.maker_id));
  const url = `${API_BASE_URL}${COMPATIBILITY_GROUPS_PATH}?${params.toString()}`;
  return fetchJson(url);
}

/**
 * @param {string} modelId
 * @param {string} [year]
 */
export async function fetchCarVariants(modelId, year) {
  const params = new URLSearchParams({ model_id: modelId, limit: '200' });
  if (year) params.set('year', String(year));
  const url = `${API_BASE_URL}${CAR_VARIANTS_PATH}?${params.toString()}`;
  return fetchJson(url);
}

function toErrorMessage(payload, fallback) {
  if (!payload) return fallback;
  if (typeof payload === 'string') return payload;
  if (payload.message) return String(payload.message);
  if (payload.error) return String(payload.error);
  if (payload.detail) return String(payload.detail);
  const firstField = Object.values(payload)[0];
  if (Array.isArray(firstField) && firstField.length) return String(firstField[0]);
  if (typeof firstField === 'string') return firstField;
  return fallback;
}

async function fetchJsonWithAuth(url, accessToken, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...(options.headers || {}),
    },
  });
  const text = await res.text().catch(() => '');
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }
  if (!res.ok) {
    throw new Error(toErrorMessage(payload, `Request failed (${res.status})`));
  }
  return payload;
}

/**
 * Get current user's garage vehicles.
 * Returns plain vehicle array for easier UI use.
 */
export async function fetchUserGarageVehicles(accessToken) {
  const payload = await fetchJsonWithAuth(`${API_BASE_URL}${USER_GARAGE_PATH}`, accessToken);
  return Array.isArray(payload?.data) ? payload.data : [];
}

/**
 * Add a vehicle to current user's garage.
 */
export async function createUserGarageVehicle(accessToken, vehiclePayload) {
  const payload = await fetchJsonWithAuth(`${API_BASE_URL}${USER_GARAGE_PATH}`, accessToken, {
    method: 'POST',
    body: JSON.stringify(vehiclePayload),
  });
  return payload?.data || payload;
}

/**
 * Remove a vehicle from current user's garage.
 */
export async function deleteUserGarageVehicle(accessToken, vehicleId) {
  return fetchJsonWithAuth(`${API_BASE_URL}${USER_GARAGE_PATH}${vehicleId}/`, accessToken, {
    method: 'DELETE',
    headers: {},
  });
}

/**
 * Get current authenticated user's customer profile.
 */
export async function fetchCustomerProfile(accessToken) {
  return fetchJsonWithAuth(`${API_BASE_URL}${CUSTOMER_PROFILE_PATH}`, accessToken);
}

/**
 * Create customer profile for current authenticated user.
 */
export async function createCustomerProfile(accessToken, profilePayload) {
  return fetchJsonWithAuth(`${API_BASE_URL}${CUSTOMER_PROFILE_PATH}`, accessToken, {
    method: 'POST',
    body: JSON.stringify(profilePayload),
  });
}

/**
 * Update customer profile for current authenticated user.
 */
export async function updateCustomerProfile(accessToken, profilePayload) {
  return fetchJsonWithAuth(`${API_BASE_URL}${CUSTOMER_PROFILE_PATH}`, accessToken, {
    method: 'PATCH',
    body: JSON.stringify(profilePayload),
  });
}
