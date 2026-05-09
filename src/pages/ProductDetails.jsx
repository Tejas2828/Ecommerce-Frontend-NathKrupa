import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { fetchProductInfo, resolveApiMediaUrl } from '../api/shop';
import { formatProductPrice } from '../utils/productFormat';
import { addItemToCart } from '../store/slices/cartSlice';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mainImage, setMainImage] = useState(null);

  useEffect(() => {
    if (!id) return undefined;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchProductInfo(id)
      .then((res) => {
        if (cancelled) return;
        if (res.success && res.data) {
          setData(res.data);
          const first =
            res.data.image ||
            (Array.isArray(res.data.images) && res.data.images[0]?.image);
          setMainImage(first ? resolveApiMediaUrl(first) : null);
        } else {
          setError('Product not found.');
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || 'Failed to load product.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const gallery = React.useMemo(() => {
    if (!data) return [];
    const urls = [];
    if (data.image) urls.push(resolveApiMediaUrl(data.image));
    (data.images || []).forEach((im) => {
      const u = resolveApiMediaUrl(im?.image);
      if (u && !urls.includes(u)) urls.push(u);
    });
    return urls;
  }, [data]);

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto px-6 py-12 animate-pulse">
        <div className="h-10 bg-gray-100 rounded w-1/2 mb-8" />
        <div className="grid md:grid-cols-2 gap-10">
          <div className="aspect-square bg-gray-100 rounded-2xl" />
          <div className="space-y-4">
            <div className="h-8 bg-gray-100 rounded w-3/4" />
            <div className="h-6 bg-gray-100 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-[1200px] mx-auto px-6 py-12">
        <p className="text-red-700">{error || 'Not found.'}</p>
        <Link
          to="/vehicle-parts"
          className="text-[#f47a4d] font-bold mt-4 inline-block hover:underline"
        >
          Browse parts
        </Link>
      </div>
    );
  }

  const displayMain = mainImage || gallery[0] || '';
  const compatibleVariants = Array.isArray(data.compatible_variants) ? data.compatible_variants : [];
  const specifications = Array.isArray(data.product_specification) ? data.product_specification : [];
  const hasDimensions = [data.weight, data.length, data.width, data.height, data.volume_m3].some(
    (v) => v != null && v !== ''
  );
  const detailItems = [
    { label: 'Product ID', value: data.product_id },
    { label: 'HSN Code', value: data.hsn_code },
    { label: 'Barcode', value: data.barcode },
    { label: 'Barcode No.', value: data.barcode_number },
    { label: 'Unit', value: data.unit?.code || data.unit?.name },
    { label: 'Lead Time', value: data.lead_time != null ? `${data.lead_time} day(s)` : null },
    { label: 'Tax', value: data.taxes != null ? `${data.taxes}%` : null },
    { label: 'COD', value: data.is_cod ? 'Available' : 'Not available' },
    { label: 'Bulk Order', value: data.bulk_order_available ? 'Available' : 'Not available' },
  ].filter((row) => row.value);

  const handleAddToCart = () => {
    const numericPrice = Number(data.price_inclusive_tax ?? data.discounted_price ?? data.price ?? 0);
    dispatch(
      addItemToCart({
        id: data.product_id,
        price: Number.isFinite(numericPrice) ? numericPrice : 0,
        title: data.title || 'Untitled product',
        image: resolveApiMediaUrl(data.image),
      })
    );
    navigate('/cart');
  };

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-10 font-sans">
      <nav className="text-sm text-[#6b7280] mb-8">
        <Link to="/" className="hover:text-[#f47a4d]">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link to="/vehicle-parts" className="hover:text-[#f47a4d]">
          Parts
        </Link>
        <span className="mx-2">/</span>
        <span className="text-[#111827] line-clamp-1">{data.title}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-10 lg:gap-14">
        <div>
          <div className="aspect-square bg-gray-50 rounded-2xl flex items-center justify-center p-6 mb-4 overflow-hidden">
            {displayMain ? (
              <img
                src={displayMain}
                alt={data.title}
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <div className="text-[#9ca3af] text-sm">No image</div>
            )}
          </div>
          {gallery.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {gallery.map((url) => (
                <button
                  type="button"
                  key={url}
                  onClick={() => setMainImage(url)}
                  className={`w-16 h-16 rounded-lg border-2 overflow-hidden bg-gray-50 shrink-0 p-0 ${
                    displayMain === url ? 'border-[#f47a4d]' : 'border-transparent'
                  }`}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-2">
            {data.brand?.name || '—'}
            {data.category?.title ? (
              <span className="font-normal text-[#9ca3af]">
                {' '}
                · {data.category.title}
              </span>
            ) : null}
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-[#111827] mb-4 leading-tight">
            {data.title}
          </h1>
          <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-5 mb-6">
            <p className="text-3xl font-black text-[#f47a4d]">{formatProductPrice(data)}</p>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              {data.price != null && (
                <div className="rounded-xl bg-white px-3 py-2 border border-orange-100">
                  <span className="text-[#6b7280] block text-xs">Base price</span>
                  <span className="font-bold text-[#111827]">Rs. {data.price}</span>
                </div>
              )}
              {data.price_inclusive_tax != null && (
                <div className="rounded-xl bg-white px-3 py-2 border border-orange-100">
                  <span className="text-[#6b7280] block text-xs">Incl. tax</span>
                  <span className="font-bold text-[#111827]">Rs. {data.price_inclusive_tax}</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 mb-6">
            <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3">
              <p className="text-xs text-[#6b7280] uppercase tracking-wide mb-1">Availability</p>
              <p className={`text-sm font-bold ${data.is_available === false ? 'text-red-600' : 'text-emerald-600'}`}>
                {data.is_available === false ? 'Currently unavailable' : 'In stock'}
              </p>
              {data.stock != null && <p className="text-[#111827] text-sm mt-1">Stock: {data.stock}</p>}
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3">
              <p className="text-xs text-[#6b7280] uppercase tracking-wide mb-1">Compatibility Group</p>
              <p className="text-sm font-bold text-[#111827]">
                {data.compatibility_group?.name || 'No group mapped'}
              </p>
            </div>
          </div>

          {data.description && (
            <div className="text-[#374151] mb-8 whitespace-pre-wrap leading-relaxed">
              {data.description}
            </div>
          )}
          <div className="mb-8">
            <button
              type="button"
              onClick={handleAddToCart}
              className="px-8 py-3 rounded-full bg-[#f47a4d] text-white font-black text-sm hover:bg-[#e46d41] transition-all"
            >
              Add to Cart
            </button>
          </div>

          {detailItems.length > 0 && (
            <div className="border-t border-gray-100 pt-8">
              <h2 className="text-lg font-bold text-[#111827] mb-4">Important details</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {detailItems.map((row) => (
                  <div key={row.label} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                    <p className="text-xs text-[#6b7280] uppercase tracking-wide">{row.label}</p>
                    <p className="text-sm font-semibold text-[#111827] mt-1 break-all">{row.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {hasDimensions && (
            <div className="border-t border-gray-100 pt-8 mt-8">
              <h2 className="text-lg font-bold text-[#111827] mb-4">Dimensions & weight</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {data.weight != null && (
                  <div className="rounded-xl border border-gray-100 px-4 py-3">
                    <p className="text-xs text-[#6b7280] uppercase tracking-wide">Weight</p>
                    <p className="text-sm font-semibold text-[#111827] mt-1">{data.weight} kg</p>
                  </div>
                )}
                {data.length != null && (
                  <div className="rounded-xl border border-gray-100 px-4 py-3">
                    <p className="text-xs text-[#6b7280] uppercase tracking-wide">Length</p>
                    <p className="text-sm font-semibold text-[#111827] mt-1">{data.length} cm</p>
                  </div>
                )}
                {data.width != null && (
                  <div className="rounded-xl border border-gray-100 px-4 py-3">
                    <p className="text-xs text-[#6b7280] uppercase tracking-wide">Width</p>
                    <p className="text-sm font-semibold text-[#111827] mt-1">{data.width} cm</p>
                  </div>
                )}
                {data.height != null && (
                  <div className="rounded-xl border border-gray-100 px-4 py-3">
                    <p className="text-xs text-[#6b7280] uppercase tracking-wide">Height</p>
                    <p className="text-sm font-semibold text-[#111827] mt-1">{data.height} cm</p>
                  </div>
                )}
                {data.volume_m3 != null && (
                  <div className="rounded-xl border border-gray-100 px-4 py-3">
                    <p className="text-xs text-[#6b7280] uppercase tracking-wide">Volume</p>
                    <p className="text-sm font-semibold text-[#111827] mt-1">{data.volume_m3} m3</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {specifications.length > 0 && (
            <div className="border-t border-gray-100 pt-8 mt-8">
              <h2 className="text-lg font-bold text-[#111827] mb-4">Specifications</h2>
              <dl className="space-y-2">
                {specifications.map((s, idx) => (
                  <div key={s.id ?? idx} className="flex gap-4 text-sm border-b border-gray-50 pb-2">
                    <dt className="text-[#6b7280] shrink-0 w-40">
                      {s.specification_name}
                    </dt>
                    <dd className="font-medium text-[#111827]">{s.specification_value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {compatibleVariants.length > 0 && (
            <div className="border-t border-gray-100 pt-8 mt-8">
              <h2 className="text-lg font-bold text-[#111827] mb-3">Compatible vehicles</h2>
              <ul className="flex flex-wrap gap-2">
                {compatibleVariants.map((v) => (
                  <li
                    key={v.id || v.name}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-100 text-[#374151]"
                  >
                    {v.name || String(v)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
