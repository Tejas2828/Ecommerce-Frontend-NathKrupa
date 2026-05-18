/** Whether a category node has sub-categories to drill into. */
export function categoryHasChildren(category) {
  const count = category?.children_count ?? category?.children?.length ?? 0;
  return count > 0;
}

/** Parse `?path=1,2,3` into numeric ancestor ids. */
export function parseCategoryPathParam(pathParam) {
  if (!pathParam || typeof pathParam !== 'string') return [];
  return pathParam
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => Number(s))
    .filter((n) => Number.isFinite(n) && n > 0);
}

/**
 * Ancestor ids for the current page (excludes the category being viewed).
 * @param {string|undefined} pathParam - from URL `?path=`
 * @param {number|string|undefined} currentCategoryId
 */
export function categoryAncestorIds(pathParam, currentCategoryId) {
  const fromUrl = parseCategoryPathParam(pathParam);
  if (!currentCategoryId) return fromUrl;
  const currentId = Number(currentCategoryId);
  if (!Number.isFinite(currentId)) return fromUrl;
  if (fromUrl.length) return fromUrl;
  return [];
}

/**
 * Full hierarchy path for product filtering (ancestors + current category).
 */
export function categoryHierarchyPath(pathParam, currentCategoryId) {
  const ancestors = categoryAncestorIds(pathParam, currentCategoryId);
  const currentId = Number(currentCategoryId);
  if (!Number.isFinite(currentId)) return ancestors;
  if (ancestors.includes(currentId)) return ancestors;
  return [...ancestors, currentId];
}

/**
 * Route for browsing a category; `ancestorIds` are all parents above this node.
 * @param {object} category
 * @param {number[]} [ancestorIds]
 */
export function categoryBrowsePath(category, ancestorIds = []) {
  const id = category?.id;
  if (id == null) return '/categories';
  const ancestors = Array.isArray(ancestorIds) ? ancestorIds.filter(Boolean) : [];
  const qs = ancestors.length ? `?path=${ancestors.join(',')}` : '';
  return `/categories/${id}${qs}`;
}

/** Ancestor path when navigating from current page into a child category. */
export function categoryChildAncestorIds(pathParam, currentCategoryId) {
  return categoryHierarchyPath(pathParam, currentCategoryId);
}
