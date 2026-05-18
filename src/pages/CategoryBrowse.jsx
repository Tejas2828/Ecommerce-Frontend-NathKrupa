import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import {
  fetchMainCategories,
  fetchCategoryById,
  fetchCategoryProducts,
  resolveApiMediaUrl,
} from '../api/shop';
import CategoryCard from '../components/CategoryCard';
import ProductThumb from '../components/ProductThumb';
import { formatProductPrice, productCode } from '../utils/productFormat';
import {
  categoryBrowsePath,
  categoryChildAncestorIds,
  categoryHierarchyPath,
  parseCategoryPathParam,
} from '../utils/categoryNav';

function normalizeProduct(row) {
  if (!row) return null;
  const id = row.product_id ?? row.id;
  if (!id) return null;
  return {
    product_id: String(id),
    title: row.title || 'Untitled',
    image: row.image || '',
    brand: row.brand,
    price_inclusive_tax: row.price_inclusive_tax,
    starting_price: row.starting_price,
    discounted_price: row.discounted_price,
    price: row.price,
    barcode_number: row.barcode_number,
    barcode: row.barcode,
    hsn_code: row.hsn_code,
  };
}

export default function CategoryBrowse() {
  const { categoryId } = useParams();
  const [searchParams] = useSearchParams();
  const pathParam = searchParams.get('path') || '';
  const isRoot = !categoryId;

  const childAncestorIds = useMemo(
    () => categoryChildAncestorIds(pathParam, categoryId),
    [pathParam, categoryId]
  );
  const parentPathIds = useMemo(() => {
    const parsed = parseCategoryPathParam(pathParam);
    if (parsed.length > 1) return parsed.slice(0, -1);
    return [];
  }, [pathParam]);

  const [category, setCategory] = useState(null);
  const [children, setChildren] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const showProducts = useMemo(() => {
    if (isRoot || loading) return false;
    return children.length === 0 && category != null;
  }, [isRoot, loading, children.length, category]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setCategory(null);
      setChildren([]);
      setProducts([]);

      try {
        if (isRoot) {
          const res = await fetchMainCategories({ limit: 90 });
          if (cancelled) return;
          setChildren(res.data);
          return;
        }

        const cat = await fetchCategoryById(categoryId);
        if (cancelled) return;
        setCategory(cat);

        const directChildren = Array.isArray(cat?.children) ? cat.children : [];
        if (directChildren.length > 0) {
          setChildren(directChildren);
          return;
        }

        const productRes = await fetchCategoryProducts({
          categoryId,
          categoryPath: categoryHierarchyPath(pathParam, categoryId),
          limit: 48,
          page: 1,
        });
        if (cancelled) return;
        setProducts(
          (productRes.data || []).map(normalizeProduct).filter(Boolean)
        );
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Could not load categories.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [categoryId, isRoot, pathParam]);

  const pageTitle = isRoot ? 'All categories' : category?.title || 'Category';
  const breadcrumb = isRoot ? null : category?.link_url;
  const parentId = category?.parent;

  return (
    <div className="w-full bg-white font-sans min-h-[60vh]">
      <div className="max-w-[1400px] mx-auto px-10 py-10">
        <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[#6b7280] mb-6">
          <Link to="/" className="hover:text-[#f47a4d] transition-colors">Home</Link>
          <span>/</span>
          {isRoot ? (
            <span className="text-[#111827]">Categories</span>
          ) : (
            <>
              <Link to="/categories" className="hover:text-[#f47a4d] transition-colors">Categories</Link>
              {parentId ? (
                <>
                  <span>/</span>
                  <Link
                    to={categoryBrowsePath({ id: parentId }, parentPathIds)}
                    className="hover:text-[#f47a4d] transition-colors inline-flex items-center gap-1"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Back
                  </Link>
                </>
              ) : null}
              <span>/</span>
              <span className="text-[#111827]">{pageTitle}</span>
            </>
          )}
        </nav>

        <div className="mb-8">
          <h1 className="text-[32px] font-bold text-[#111827] leading-tight">{pageTitle}</h1>
          <p className="text-[#6b7280] text-base font-medium mt-1">
            {showProducts
              ? 'Products in this category'
              : isRoot
                ? 'Browse top-level categories'
                : breadcrumb || 'Choose a sub-category'}
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {!showProducts && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-10 mb-12">
            {loading &&
              Array.from({ length: 10 }).map((_, idx) => (
                <div key={`sk-${idx}`} className="animate-pulse">
                  <div className="aspect-square bg-gray-100 rounded-[20px] mb-4" />
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                </div>
              ))}

            {!loading &&
              children.map((cat) => (
                <CategoryCard
                  key={cat.id}
                  category={cat}
                  to={categoryBrowsePath(cat, childAncestorIds)}
                />
              ))}

            {!loading && !children.length && !error && (
              <p className="col-span-full text-center text-[#6b7280] py-12">
                No sub-categories here.
              </p>
            )}
          </div>
        )}

        {showProducts && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-12">
            {loading &&
              Array.from({ length: 12 }).map((_, idx) => (
                <div key={`sk-p-${idx}`} className="animate-pulse">
                  <div className="aspect-square bg-gray-100 rounded-[16px] mb-3" />
                    <div className="h-3 bg-gray-100 rounded w-2/3 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-full mb-2" />
                  <div className="h-4 bg-gray-100 rounded w-1/2" />
                </div>
              ))}

            {!loading &&
              products.map((item) => {
                const brandName = item.brand?.name || '—';
                const code = productCode(item);
                return (
                  <Link
                    key={item.product_id}
                    to={`/products/${item.product_id}`}
                    className="cursor-pointer group block text-left"
                  >
                    <div className="aspect-square bg-gray-50 rounded-[16px] mb-3 flex items-center justify-center p-4 group-hover:bg-gray-100 transition-colors overflow-hidden">
                      <ProductThumb src={resolveApiMediaUrl(item.image)} title={item.title} />
                    </div>
                    <div className="flex justify-between items-start mb-1 gap-1">
                      <span className="text-[12px] font-bold text-gray-400 truncate">{brandName}</span>
                      {code ? (
                        <span className="text-[10px] font-bold text-gray-300 tracking-wider uppercase shrink-0">
                          {code}
                        </span>
                      ) : null}
                    </div>
                    <h4 className="text-[13px] font-bold text-[#111827] line-clamp-2 mb-1 min-h-[2.5rem]">
                      {item.title}
                    </h4>
                    <p className="text-[14px] font-black text-[#111827]">{formatProductPrice(item)}</p>
                  </Link>
                );
              })}

            {!loading && !products.length && !error && (
              <p className="col-span-full text-center text-[#6b7280] py-12">
                No products in this category yet.
              </p>
            )}
          </div>
        )}

        <div className="text-center pb-12">
          <Link
            to="/"
            className="text-[#f47a4d] text-base font-black hover:underline underline-offset-8"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
