import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ChevronDown, Star } from 'lucide-react';
import {
  fetchProductsList,
  fetchMainCategories,
  fetchCarMakers,
  fetchCarModels,
  fetchCarYears,
  fetchCarVariants,
  resolveApiMediaUrl,
} from '../api/shop';
import CategoryCard from '../components/CategoryCard';
import { categoryBrowsePath } from '../utils/categoryNav';
import { formatProductPrice, productCode } from '../utils/productFormat';
import ProductThumb from '../components/ProductThumb';

const selectClass =
  'w-full h-[60px] bg-white border border-gray-200 rounded-full px-6 pr-10 text-[14px] font-bold text-[#374151] shadow-[0_4px_20px_rgba(0,0,0,0.02)] focus:border-[#f47a4d] focus:ring-4 focus:ring-orange-50 focus:outline-none appearance-none cursor-pointer';

const Home = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentThought, setCurrentThought] = useState(0);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState(null);

  const [partKeyword, setPartKeyword] = useState('');
  const [makers, setMakers] = useState([]);
  const [models, setModels] = useState([]);
  const [years, setYears] = useState([]);
  const [variants, setVariants] = useState([]);
  const [makerId, setMakerId] = useState('');
  const [modelId, setModelId] = useState('');
  const [year, setYear] = useState('');
  const [variantId, setVariantId] = useState('');
  const [vehicleListsLoading, setVehicleListsLoading] = useState(false);
  const [mainCategories, setMainCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState(null);

  const loadProducts = useCallback(async () => {
    setProductsLoading(true);
    setProductsError(null);
    try {
      const data = await fetchProductsList({ pageSize: 12, page: 1 });
      setProducts(Array.isArray(data.results) ? data.results : []);
    } catch (e) {
      setProductsError(e instanceof Error ? e.message : 'Could not load products.');
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    let cancelled = false;
    setCategoriesLoading(true);
    setCategoriesError(null);
    fetchMainCategories({ limit: 10 })
      .then((res) => {
        if (cancelled) return;
        setMainCategories(Array.isArray(res.data) ? res.data : []);
      })
      .catch((e) => {
        if (!cancelled) {
          setCategoriesError(e instanceof Error ? e.message : 'Could not load categories.');
          setMainCategories([]);
        }
      })
      .finally(() => {
        if (!cancelled) setCategoriesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    fetchCarMakers()
      .then((r) => setMakers(Array.isArray(r.data) ? r.data : []))
      .catch(() => setMakers([]));
  }, []);

  useEffect(() => {
    if (!makerId) {
      setModels([]);
      return;
    }
    setVehicleListsLoading(true);
    fetchCarModels(makerId)
      .then((r) => setModels(Array.isArray(r.data) ? r.data : []))
      .catch(() => setModels([]))
      .finally(() => setVehicleListsLoading(false));
  }, [makerId]);

  useEffect(() => {
    if (!modelId) {
      setYears([]);
      return;
    }
    fetchCarYears(modelId)
      .then((r) => setYears(Array.isArray(r.data) ? r.data : []))
      .catch(() => setYears([]));
  }, [modelId]);

  useEffect(() => {
    if (!modelId || !year) {
      setVariants([]);
      return;
    }
    fetchCarVariants(modelId, year || undefined)
      .then((r) => setVariants(Array.isArray(r.data) ? r.data : []))
      .catch(() => setVariants([]));
  }, [modelId, year]);

  const goVehiclePartsSearch = useCallback(() => {
    const qs = new URLSearchParams();
    if (makerId) qs.set('maker_id', makerId);
    if (modelId) qs.set('model_id', modelId);
    if (year) qs.set('year', year);
    if (variantId) qs.set('variant_id', variantId);
    if (partKeyword.trim()) qs.set('q', partKeyword.trim());
    const s = qs.toString();
    navigate(s ? `/vehicle-parts?${s}` : '/vehicle-parts');
  }, [navigate, makerId, modelId, year, variantId, partKeyword]);

  const goTextSearch = useCallback(() => {
    if (!partKeyword.trim()) return;
    navigate(`/vehicle-parts?q=${encodeURIComponent(partKeyword.trim())}`);
  }, [navigate, partKeyword]);

  const slides = [
    {
      image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=2000",
      title: "Free Delivery",
      subtitle: "from wide rand of products from TATA",
      date: "12-18th Jan"
    },
    {
      image: "https://images.unsplash.com/photo-1486497395400-7ec0a1df60c4?auto=format&fit=crop&q=80&w=2000",
      title: "Premium Alloys",
      subtitle: "Exclusive 15% discount on racing wheels",
      date: "Valid till 25th Jan"
    },
    {
      image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=2000",
      title: "Engine Care Kit",
      subtitle: "Complete maintenance set for high performance",
      date: "Limited Time Offer"
    }
  ];

  const thoughts = [
    {
      quote: "“The guided part search and vehicle garage has saved our clients hours!”",
      author: "Auto Service Pro"
    },
    {
      quote: "“Finding OEM parts has never been easier. The interface is just seamless.”",
      author: "Mechanic Daily"
    },
    {
      quote: "“The best inventory management for automotive needs. Outstanding support.”",
      author: "Elite Auto Care"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentThought((prev) => (prev + 1) % thoughts.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [thoughts.length]);

  return (
    <div className="w-full bg-white font-sans">
      {/* Top Banner / Note */}
      <div className="max-w-[1400px] mx-auto px-10 py-6 flex justify-end">
        <div className="flex items-start space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#7c3aed] mt-1 shrink-0" />
          <p className="text-[#374151] text-[13px] cursor-default leading-tight font-semibold">
            Save your vehicles <br /> and we'll show parts <br /> that fit.
          </p>
        </div>
      </div>

      {/* Hero Section */}
      <section className="max-w-[1400px] mx-auto px-10 pb-16 border-b border-gray-100">
        <div className="flex flex-col lg:flex-row items-start justify-between mb-16">
          {/* Left Side: Title and Badge */}
          <div className="flex-1 pt-2">
            <div className="flex items-center space-x-4 mb-8">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-gray-100 overflow-hidden shadow-sm">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 20}`} alt="User" />
                  </div>
                ))}
                <div className="w-10 h-10 rounded-full border-2 border-white bg-[#f9fafb] flex items-center justify-center shadow-sm">
                   <div className="flex flex-col items-center">
                    <div className="flex space-x-0.5">
                      <Star className="w-1 h-1 fill-orange-500 text-orange-500" />
                      <Star className="w-1 h-1 fill-orange-500 text-orange-500" />
                    </div>
                    <Star className="w-1 h-1 fill-orange-500 text-orange-500" />
                   </div>
                </div>
              </div>
              <div>
                <div className="font-black text-[#111827] text-lg">100k+</div>
                <p className="text-xs text-[#4b5563] font-bold">Happy Customers</p>
              </div>
            </div>
            
            <h1 className="text-[32px] sm:text-[42px] md:text-[58px] font-serif font-bold text-[#f47a4d] leading-[1.1] tracking-tight text-center lg:text-left">
              Find Vehicle Parts
            </h1>
          </div>
          
          {/* Right Side: Header Search */}
          <div className="flex items-center space-x-10 mt-10 lg:mt-0 lg:ml-16">
            <div className="h-32 w-[1px] bg-gray-100 hidden lg:block" />
            
            <div className="flex space-x-8">
              {/* Search by Details */}
              <div className="w-[260px]">
                <label className="block text-[#4b5563] text-[13px] font-bold mb-3">Search by Vehicle Details</label>
                <div className="bg-white border border-gray-200 rounded-full px-6 py-4 flex items-center shadow-[0_4px_20px_rgba(0,0,0,0.02)] focus-within:border-[#f47a4d] focus-within:ring-4 focus-within:ring-orange-50 transition-all">
                  <input 
                    type="text" 
                    value={partKeyword}
                    onChange={(e) => setPartKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && goTextSearch()}
                    placeholder='Search: "Brake Pads"' 
                    className="w-full bg-transparent outline-none text-[#111827] font-bold text-sm placeholder-[#9ca3af]"
                  />
                </div>
              </div>

              {/* Search by No. Plate */}
              <div className="w-[260px]">
                <label className="block text-[#4b5563] text-[13px] font-bold mb-3">Search by No. Plate</label>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-white border border-gray-200 rounded-full px-6 py-4 flex items-center shadow-[0_4px_20px_rgba(0,0,0,0.02)] focus-within:border-[#f47a4d] focus-within:ring-4 focus-within:ring-orange-50 transition-all">
                    <input 
                      type="text" 
                      placeholder="MH 1 AA 2345" 
                      className="w-full bg-transparent outline-none text-[#111827] font-black text-base placeholder-[#9ca3af]"
                    />
                    <div className="ml-2 w-7 h-4 bg-[#000080] rounded flex items-center justify-center p-0.5">
                      <div className="flex flex-col items-center leading-none">
                        <span className="text-[4px] text-white font-black">IND</span>
                        <div className="w-2.5 h-2.5 rounded-full border border-white/40 flex items-center justify-center">
                          <div className="w-1 h-1 bg-white rounded-full" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <button className="bg-[#f47a4d] text-white p-5 rounded-full hover:bg-[#e3693c] transition-all hover:scale-105 shadow-lg shadow-orange-100/50 flex items-center justify-center">
                    <Search className="w-6 h-6 stroke-[3]" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Filter Row */}
        <div className="mt-8">
          <label className="block text-[#4b5563] text-[14px] font-bold mb-5">Search by Vehicle Details</label>
          <div className="flex flex-wrap lg:flex-nowrap gap-4 items-stretch">
            <div className="relative flex-1 min-w-[180px]">
              <select
                aria-label="Car maker"
                className={selectClass}
                value={makerId}
                onChange={(e) => {
                  setMakerId(e.target.value);
                  setModelId('');
                  setYear('');
                  setVariantId('');
                }}
                disabled={vehicleListsLoading}
              >
                <option value="">Select Car Maker</option>
                {makers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4b5563]" />
            </div>
            <div className="relative flex-1 min-w-[180px]">
              <select
                aria-label="Model line"
                className={selectClass}
                value={modelId}
                onChange={(e) => {
                  setModelId(e.target.value);
                  setYear('');
                  setVariantId('');
                }}
                disabled={!makerId}
              >
                <option value="">Select Model Line</option>
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4b5563]" />
            </div>
            <div className="relative flex-1 min-w-[140px]">
              <select
                aria-label="Year"
                className={selectClass}
                value={year}
                onChange={(e) => {
                  setYear(e.target.value);
                  setVariantId('');
                }}
                disabled={!modelId}
              >
                <option value="">Select Year</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4b5563]" />
            </div>
            <div className="relative flex-1 min-w-[200px]">
              <select
                aria-label="Variant"
                className={selectClass}
                value={variantId}
                onChange={(e) => setVariantId(e.target.value)}
                disabled={!year}
              >
                <option value="">Select Variant</option>
                {variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4b5563]" />
            </div>
            <button
              type="button"
              onClick={goVehiclePartsSearch}
              className="bg-[#f47a4d] text-white px-10 min-h-[60px] rounded-full font-black text-lg flex items-center justify-center hover:bg-[#e3693c] transition-all hover:scale-[1.02] shadow-xl shadow-orange-200/40 space-x-2 shrink-0"
            >
              <Search className="w-5 h-5 stroke-[3]" />
              <span>Search</span>
            </button>
          </div>
        </div>
      </section>

      {/* Featured Section Below the Hero */}
      <section className="py-16 px-10 max-w-[1400px] mx-auto">
        {/* Deals of the Day Header */}
        <div className="mb-8">
          <h2 className="text-[32px] font-bold text-[#111827] leading-tight">Deals of the Day</h2>
          <p className="text-[#6b7280] text-base font-medium">Offers for the day upto 20% off</p>
        </div>

        {/* Hero Carousel Area */}
        <div className="relative rounded-[24px] overflow-hidden mb-6 h-[480px]">
          {slides.map((slide, index) => (
            <div 
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
            >
              <img 
                src={slide.image} 
                alt={slide.title} 
                className="w-full h-full object-cover"
              />
              
              {/* Overlay Card */}
              <div className="absolute bottom-6 left-6 right-6">
                <div className="bg-white/95 backdrop-blur-sm rounded-[20px] p-6 flex flex-col md:flex-row items-center justify-between shadow-2xl">
                  <div className="flex-1 text-left">
                    <h3 className="text-2xl font-bold text-[#111827] mb-1">{slide.title}</h3>
                    <p className="text-[#6b7280] text-[15px] font-medium">{slide.subtitle}</p>
                  </div>
                  <div className="flex items-center space-x-12 mt-4 md:mt-0">
                    <span className="text-[#6b7280] text-[15px] font-bold">{slide.date}</span>
                    <button className="bg-[#f47a4d] text-white px-8 py-3 rounded-full font-bold flex items-center space-x-2 hover:bg-[#e3693c] transition-all group">
                      <span>View</span>
                      <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Carousel Indicators */}
        <div className="flex items-center space-x-3 mb-12">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`transition-all duration-300 rounded-full ${index === currentSlide ? 'w-12 h-2.5 bg-[#f47a4d]' : 'w-2.5 h-2.5 bg-gray-200 hover:bg-gray-300'}`}
            />
          ))}
        </div>

        {/* Product grid — from FetchProducts API */}
        {productsError && (
          <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800 flex flex-wrap items-center justify-between gap-3">
            <span>{productsError}</span>
            <button
              type="button"
              onClick={loadProducts}
              className="font-bold text-red-900 underline underline-offset-2 hover:text-red-700"
            >
              Retry
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-20">
          {productsLoading &&
            Array.from({ length: 12 }).map((_, idx) => (
              <div key={`sk-${idx}`} className="animate-pulse">
                <div className="aspect-square bg-gray-100 rounded-[16px] mb-3" />
                <div className="h-3 bg-gray-100 rounded w-2/3 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-full mb-2" />
                <div className="h-4 bg-gray-100 rounded w-1/2" />
              </div>
            ))}

          {!productsLoading &&
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
                    {item.title || 'Untitled'}
                  </h4>
                  <p className="text-[14px] font-black text-[#111827]">{formatProductPrice(item)}</p>
                </Link>
              );
            })}

          {!productsLoading && !products.length && !productsError && (
            <p className="col-span-full text-center text-[#6b7280] py-8">
              No active products to show yet.
            </p>
          )}
        </div>

        {/* Categories Section */}
        <div className="pt-16 border-t border-gray-100 mb-20">
          <div className="flex justify-between items-end mb-10 px-2">
            <div>
              <h2 className="text-[32px] font-bold text-[#111827] leading-tight">Categories</h2>
              <p className="text-[#6b7280] text-base font-medium">Browse authentic OEM auto parts</p>
            </div>
            <Link
              to="/categories"
              className="text-[#f47a4d] text-base font-black hover:underline underline-offset-8"
            >
              See All
            </Link>
          </div>

          {categoriesError && (
            <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">
              {categoriesError}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-10">
            {categoriesLoading &&
              Array.from({ length: 10 }).map((_, idx) => (
                <div key={`cat-sk-${idx}`} className="animate-pulse">
                  <div className="aspect-square bg-gray-100 rounded-[20px] mb-4" />
                  <div className="h-4 bg-gray-100 rounded w-3/4 mx-1" />
                </div>
              ))}

            {!categoriesLoading &&
              mainCategories.map((cat) => (
                <CategoryCard
                  key={cat.id}
                  category={cat}
                  to={categoryBrowsePath(cat)}
                />
              ))}

            {!categoriesLoading && !mainCategories.length && !categoriesError && (
              <p className="col-span-full text-center text-[#6b7280] py-8">
                No categories available yet.
              </p>
            )}
          </div>
        </div>

        {/* Recently Viewed Section */}
        <div className="pt-20 border-t border-gray-100 mt-20">
          <div className="flex flex-col sm:flex-row justify-between items-center sm:items-end mb-8 md:mb-10 px-2 gap-4">
            <div className="text-center sm:text-left">
              <h2 className="text-[24px] md:text-[32px] font-bold text-[#111827] leading-tight">Recently Viewed</h2>
              <p className="text-[#6b7280] text-sm md:text-base font-medium">Parts Viewed by you recently</p>
            </div>
            <button className="text-[#f47a4d] text-sm md:text-base font-black hover:underline underline-offset-8 transition-colors">See All</button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6">
            {[
              { brand: "Toyota", name: "Front Brake Pads Set", price: "₹ 2,300" },
              { brand: "Honda", name: "Rear Brake Pads Set", price: "₹ 2,500" },
              { brand: "Ford", name: "Brake Rotors Front", price: "₹ 3,200" },
              { brand: "Chevrolet", name: "Drum Brake Kit", price: "₹ 1,800" },
              { brand: "Nissan", name: "Brake Fluid", price: "₹ 750" },
              { brand: "Hyundai", name: "ABS Module", price: "₹ 15,000" },
              { brand: "Volkswagen", name: "Brake Caliper", price: "₹ 7,500" }
            ].map((item, idx) => (
              <div key={idx} className="cursor-pointer group">
                <div className="aspect-square bg-gray-50 rounded-[20px] mb-4 flex items-center justify-center p-6 group-hover:bg-gray-100 transition-colors">
                  <div className="w-full aspect-square rounded-full border-[6px] border-white bg-gray-200 shadow-sm flex items-center justify-center overflow-hidden">
                    <div className="w-full h-full border-4 border-gray-300 rounded-full flex items-center justify-center">
                      <div className="w-1/2 h-1/2 rounded-full border-2 border-gray-400" />
                    </div>
                  </div>
                </div>
                <div className="mb-1">
                  <span className="text-[12px] font-bold text-gray-400">{item.brand}</span>
                </div>
                <h4 className="text-[14px] font-bold text-[#111827] group-hover:text-[#f47a4d] transition-colors line-clamp-2 mb-2 leading-snug">
                  {item.name}
                </h4>
                <p className="text-[16px] font-black text-[#111827]">{item.price}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Shop by Manufacturer Section */}
        <div className="pt-12 md:pt-20 border-t border-gray-100 mt-12 md:mt-20">
          <div className="flex flex-col sm:flex-row justify-between items-center sm:items-end mb-8 md:mb-10 px-2 gap-4">
            <div className="text-center sm:text-left">
              <h2 className="text-[24px] md:text-[32px] font-bold text-[#111827] leading-tight">Vehicle Manufacturers</h2>
              <p className="text-[#6b7280] text-sm md:text-base font-medium">Original parts from your favorite brands</p>
            </div>
            <button className="text-[#f47a4d] text-sm md:text-base font-black hover:underline underline-offset-8 transition-colors">See All Brands</button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
            {[
              { name: "Maruti Suzuki", logo: "https://1000logos.net/wp-content/uploads/2022/08/Maruti-Suzuki-Logo.png" },
              { name: "Hyundai", logo: "https://upload.wikimedia.org/wikipedia/commons/4/44/Hyundai_Motor_Company_logo.svg" },
              { name: "Tata Motors", logo: "https://1000logos.net/wp-content/uploads/2020/04/Tata-Logo-768x432.png" },
              { name: "Mahindra", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Mahindra_Auto.png/1920px-Mahindra_Auto.png" },
              { name: "Toyota", logo: "https://upload.wikimedia.org/wikipedia/commons/9/9d/Toyota_carlogo.svg" },
              { name: "Honda", logo: "https://static.vecteezy.com/system/resources/previews/036/459/363/non_2x/honda-car-logo-illustration-free-vector.jpg" }
            ].map((m) => (
              <div key={m.name} className="group cursor-pointer">
                <div className="bg-white border border-gray-100 rounded-[24px] p-5 md:p-8 flex flex-col items-center justify-center transition-all duration-500 group-hover:border-[#f47a4d]/30 group-hover:shadow-2xl group-hover:shadow-orange-100/50 group-hover:-translate-y-1">
                  <div className="w-20 h-14 md:w-32 md:h-20 mb-4 flex items-center justify-center transition-all duration-500">
                    <img 
                      src={m.logo} 
                      alt={m.name} 
                      className="max-w-full max-h-full object-contain opacity-80 group-hover:opacity-100 transition-opacity duration-300" 
                    />
                  </div>
                  <span className="text-[12px] md:text-[15px] font-black text-gray-400 group-hover:text-[#111827] transition-colors tracking-tight text-center">
                    {m.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Component Brands Section */}
        <div className="pt-12 md:pt-20 border-t border-gray-100 mt-12 md:mt-20">
          <div className="flex flex-col sm:flex-row justify-between items-center sm:items-end mb-8 md:mb-10 px-2 gap-4">
            <div className="text-center sm:text-left">
              <h2 className="text-[24px] md:text-[32px] font-bold text-[#111827] leading-tight">Top Component Brands</h2>
              <p className="text-[#6b7280] text-sm md:text-base font-medium">Quality assurance from world-class manufacturers</p>
            </div>
            <button className="text-[#f47a4d] text-sm md:text-base font-black hover:underline underline-offset-8 transition-colors">Explore All</button>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 md:gap-4">
            {[
              { name: "Lumax", image: "https://www.lumaxworld.in/aftermarket/images/main-logo.svg" },
              { name: "Uno Minda", image: "https://www.unominda.com/images/logo.png" },
              { name: "TVS - Wilgo", image: "https://www.logo.wine/a/logo/TVS_Motor_Company/TVS_Motor_Company-Logo.wine.svg" },
              { name: "Accutate", image: "" },
              { name: "Auto Gold", image: "" },
              { name: "Valeo", image: "https://www.valeo.com/wp-content/themes/valeo/images/logo.png" },
              { name: "Mahindra Genuine", image: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Mahindra_logo.svg" },
              { name: "Hella", image: "https://www.motrparts.com/wp-content/uploads/2022/02/hella-auto-parts-scaled.jpeg" },
              { name: "Galio", image: "https://media.licdn.com/dms/image/v2/C560BAQE49Nnqyy7-qw/company-logo_200_200/company-logo_200_200/0/1630604188185/galio_india_logo?e=2147483647&v=beta&t=f4NkniCyGXkkn9nH5IJatYC2Eo-ufzwO5LBgTodDoJw" },
              { name: "Sandhar", image: "" },
              { name: "Spark Minda", image: "" },
              { name: "DKMax", image: "" },
              { name: "Motherson", image: "" },
              { name: "Philips", image: "https://1000logos.net/wp-content/uploads/2017/05/Phillips-Logo.png" },
              { name: "ASN", image: "" },
              { name: "Bosch", image: "https://www.logo.wine/a/logo/Robert_Bosch_GmbH/Robert_Bosch_GmbH-Logo.wine.svg" },
              { name: "Stable", image: "" },
              { name: "Radhe", image: "" },
              { name: "Devi", image: "" },
              { name: "Acian", image: "" },
              { name: "Kobra", image: "" },
              { name: "JPT", image: "https://www.jptglobalautomotive.com/wp-content/uploads/2025/12/logo-2.png" },
              { name: "Suprajit", image: "https://5.imimg.com/data5/AF/HA/MY-73743/suprajit-two-wheeler-spare-parts-3-1000x1000.jpg" }
            ].map((brand) => (
              <div key={brand.name} className="cursor-pointer group">
                <div className="aspect-[3/2] bg-white border border-gray-100 rounded-xl md:rounded-[24px] flex items-center justify-center p-3 md:p-6 transition-all duration-500 group-hover:border-[#f47a4d]/30 group-hover:shadow-xl group-hover:shadow-orange-100/40 group-hover:-translate-y-1 overflow-hidden">
                  {brand.image ? (
                    <img 
                      src={brand.image} 
                      alt={brand.name} 
                      className="w-full h-full object-contain opacity-80 group-hover:opacity-100 transition-all duration-300" 
                    />
                  ) : (
                    <span className="text-[11px] md:text-[14px] font-black text-gray-400 group-hover:text-[#111827] transition-colors text-center uppercase tracking-tighter leading-none px-1">
                      {brand.name}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Thought Section Carousel */}
        <div className="pt-20 border-t border-gray-100 mt-20 mb-32">
          <div className="relative bg-[#f9fafb] rounded-[32px] p-20 min-h-[300px] flex flex-col items-center justify-center overflow-hidden">
            <div className="text-center transition-all duration-700 ease-in-out">
              <h2 className="text-[20px] sm:text-[28px] md:text-[40px] font-black text-[#f47a4d] mb-4 md:mb-6 leading-tight max-w-[800px] mx-auto">
                {thoughts[currentThought].quote}
              </h2>
              <p className="text-gray-400 text-[10px] md:text-sm font-medium tracking-wide uppercase">
                {thoughts[currentThought].author}
              </p>
            </div>
          </div>
          
          {/* Pagination Indicators */}
          <div className="flex items-center space-x-2 mt-8">
            {thoughts.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentThought(index)}
                className={`transition-all duration-300 rounded-full ${index === currentThought ? 'w-10 h-2 bg-[#f47a4d]' : 'w-2 h-2 bg-gray-200'}`}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;