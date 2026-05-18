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
const ORDER_CART_PATH = '/api/shop/shop/order_cart/';
const ADD_ORDER_SHIPPING_ADDRESS_PATH = '/api/shop/shop/add-address/';
const SHIPPING_ADDRESSES_PATH = '/api/shop/shop/client/shipping-addresses/';
const USER_ORDER_LIST_PATH = '/api/shop/shop/user-order-list/';
const PLACE_ORDER_PATH = '/api/shop/shop/place-order/';
const MAIN_CATEGORIES_PATH = '/api/shop/shop-main-categories/';
const CATEGORY_DETAIL_PATH = (id) => `/api/shop/shop-product-category-list/${id}/`;
const CATEGORY_PRODUCTS_PATH = '/api/shop/category-products/';

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
  if (payload.detail) return String(payload.detail);
  const nested = payload.data;
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    const firstField = Object.values(nested)[0];
    if (Array.isArray(firstField) && firstField.length) return String(firstField[0]);
    if (typeof firstField === 'string') return firstField;
  }
  if (payload.error === true || typeof payload.error === 'string') {
    if (typeof payload.data === 'string') return payload.data;
  }
  if (payload.error) return String(payload.error);
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

/**
 * Sync local cart line items to Django `OrderShop` (open order) so shipping can be attached.
 * @param {string} accessToken
 * @param {Array<{ id: string, quantity?: number, variant_id?: string|null }>} cartItems
 */
export async function syncShopOrderCart(accessToken, cartItems) {
  const products = (cartItems || []).map((i) => ({
    product_id: i.id,
    variant_id: i.variant_id ?? null,
    quantity: Math.max(1, Number(i.quantity) || 1),
  }));
  return fetchJsonWithAuth(`${API_BASE_URL}${ORDER_CART_PATH}`, accessToken, {
    method: 'PUT',
    body: JSON.stringify({ products }),
  });
}

/** @returns {Promise<object[]>} normalized address objects from API `data` array */
export async function fetchShippingAddresses(accessToken) {
  const payload = await fetchJsonWithAuth(`${API_BASE_URL}${SHIPPING_ADDRESSES_PATH}`, accessToken);
  return Array.isArray(payload?.data) ? payload.data : [];
}

export async function createShippingAddress(accessToken, addressPayload) {
  return fetchJsonWithAuth(`${API_BASE_URL}${SHIPPING_ADDRESSES_PATH}`, accessToken, {
    method: 'POST',
    body: JSON.stringify(addressPayload),
  });
}

export async function updateShippingAddress(accessToken, addressId, addressPayload) {
  return fetchJsonWithAuth(`${API_BASE_URL}${SHIPPING_ADDRESSES_PATH}${addressId}/`, accessToken, {
    method: 'PATCH',
    body: JSON.stringify(addressPayload),
  });
}

export async function deleteShippingAddress(accessToken, addressId) {
  return fetchJsonWithAuth(`${API_BASE_URL}${SHIPPING_ADDRESSES_PATH}${addressId}/`, accessToken, {
    method: 'DELETE',
    headers: {},
  });
}

/** Link shipping address PK to current open cart order (`OrderShop`). */
export async function assignShippingAddressToOrder(accessToken, addressId) {
  return fetchJsonWithAuth(`${API_BASE_URL}${ADD_ORDER_SHIPPING_ADDRESS_PATH}`, accessToken, {
    method: 'POST',
    body: JSON.stringify({ id: addressId }),
  });
}

/**
 * Place the user's currently-open `OrderShop` (cart) as a real order.
 * @param {string} accessToken
 * @param {{ payment_mode?: 'ONLINE'|'COD'|'NEFT'|'CASH', shipping_cost?: number, po_number?: string }} [payload]
 * @returns {Promise<object>} placed order serialized by `OrderShopSerializer`
 */
export async function placeShopOrder(accessToken, payload = {}) {
  const body = {};
  if (payload.payment_mode) body.payment_mode = String(payload.payment_mode).toUpperCase();
  if (payload.shipping_cost != null && Number.isFinite(Number(payload.shipping_cost))) {
    body.shipping_cost = Number(payload.shipping_cost);
  }
  if (payload.po_number) body.po_number = String(payload.po_number);
  const res = await fetchJsonWithAuth(`${API_BASE_URL}${PLACE_ORDER_PATH}`, accessToken, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return res?.data || res;
}

/**
 * Shop orders for the current user. By default returns ALL `OrderShop` rows so
 * pending-cart records visible in admin are surfaced too. Pass `ordered: true`
 * to restrict to placed orders only.
 * @param {{ limit?: number, offset?: number, search?: string, ordered?: boolean }} [opts]
 */
/**
 * Top-level product categories (parent is null). Each item may include nested `children`.
 * @param {{ search?: string, limit?: number, offset?: number }} [opts]
 * @returns {Promise<{ error: boolean, count: number, data: object[] }>}
 */
export async function fetchMainCategories(opts = {}) {
  const { search, limit = 90, offset = 0 } = opts;
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  if (search && String(search).trim()) params.set('search', String(search).trim());
  const url = `${API_BASE_URL}${MAIN_CATEGORIES_PATH}?${params.toString()}`;
  const payload = await fetchJson(url);
  return {
    error: Boolean(payload?.error),
    count: Number(payload?.count) || 0,
    data: Array.isArray(payload?.data) ? payload.data : [],
  };
}

/**
 * Single category with direct `children` for drill-down navigation.
 * @param {number|string} categoryId
 */
export async function fetchCategoryById(categoryId) {
  const url = `${API_BASE_URL}${CATEGORY_DETAIL_PATH(categoryId)}`;
  const payload = await fetchJson(url);
  if (payload?.error) {
    throw new Error(toErrorMessage(payload, 'Category not found'));
  }
  return payload?.data || payload;
}

/**
 * Products assigned to a category (leaf browse).
 * @param {{ categoryId?: number|string, categoryRefName?: string, categoryPath?: number[], page?: number, limit?: number, maker_id?: string, model_id?: string, year?: string, variant_id?: string }} opts
 */
export async function fetchCategoryProducts(opts = {}) {
  const {
    categoryId,
    categoryRefName,
    categoryPath,
    page = 1,
    limit = 48,
    maker_id,
    model_id,
    year,
    variant_id,
  } = opts;
  const params = new URLSearchParams({
    limit: String(Math.min(Number(limit) || 48, 100)),
    offset: String(Math.max(0, (Number(page) || 1) - 1) * (Number(limit) || 48)),
  });
  if (categoryId != null && categoryId !== '') params.set('category_id', String(categoryId));
  if (categoryRefName) params.set('category_ref_name', String(categoryRefName));
  if (Array.isArray(categoryPath) && categoryPath.length) {
    params.set('category_path', categoryPath.join(','));
  }
  if (maker_id) params.set('maker_id', String(maker_id));
  if (model_id) params.set('model_id', String(model_id));
  if (year) params.set('year', String(year));
  if (variant_id) params.set('variant_id', String(variant_id));
  const url = `${API_BASE_URL}${CATEGORY_PRODUCTS_PATH}?${params.toString()}`;
  const payload = await fetchJson(url);
  if (payload?.error) {
    throw new Error(toErrorMessage(payload, 'Failed to load category products'));
  }
  return {
    count: Number(payload?.count) || 0,
    data: Array.isArray(payload?.data) ? payload.data : [],
    category: payload?.category || null,
  };
}

export async function fetchUserOrders(accessToken, opts = {}) {
  const { limit = 80, offset = 0, search, ordered } = opts;
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  if (search && String(search).trim()) params.set('search', String(search).trim());
  if (ordered === true) params.set('ordered', 'true');
  if (ordered === false) params.set('ordered', 'false');
  const payload = await fetchJsonWithAuth(`${API_BASE_URL}${USER_ORDER_LIST_PATH}?${params}`, accessToken);
  return Array.isArray(payload?.data) ? payload.data : [];
}
