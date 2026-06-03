import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Minus, Plus, X, ArrowRight, ShoppingCart, MapPin, ClipboardList, CreditCard, Banknote, ShieldCheck, Truck, CheckCircle2, Mail, Package, Download, Calendar, ExternalLink } from 'lucide-react';
import { addItemToCart, removeItemFromCart, clearCart } from '../store/slices/cartSlice';
import {
  syncShopOrderCart,
  fetchShippingAddresses,
  createShippingAddress,
  updateShippingAddress,
  deleteShippingAddress,
  assignShippingAddressToOrder,
  placeShopOrder,
} from '../api/shop';

const PAYMENT_MODE_BY_UI = {
  cod: 'COD',
  upi: 'ONLINE',
  card: 'ONLINE',
  banking: 'ONLINE',
};

function mapApiAddress(a) {
  const name = [a.first_name, a.last_name].filter(Boolean).join(' ').trim();
  const line = [a.apartment_address, a.street_address, a.city, a.state, a.country, a.zip]
    .filter(Boolean)
    .join(', ');
  return {
    id: a.id,
    label: (a.label || '').trim() || 'Address',
    name: name || '—',
    phone: a.mobile_no || '',
    address: line,
    raw: a,
  };
}

const emptyAddressForm = {
  label: '',
  first_name: '',
  last_name: '',
  mobile_no: '',
  apartment_address: '',
  street_address: '',
  city: '',
  state: '',
  country: 'India',
  zip: '',
  default: true,
};

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cartItems = useSelector((state) => state.cart.items);
  const cartTotalAmount = useSelector((state) => state.cart.totalAmount);
  const accessToken = useSelector((state) => state.auth?.tokens?.access);
  const isAuthenticated = useSelector((state) => state.auth?.isAuthenticated);
  const [step, setStep] = useState(1); // 1: Cart, 2: Address, 3: Review, 4: Payment
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressForm, setAddressForm] = useState(emptyAddressForm);
  const [addressFormSubmitting, setAddressFormSubmitting] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState('upi');
  
  const banks = [
    { id: 'hdfc', name: 'HDFC Bank' },
    { id: 'icici', name: 'ICICI Bank' },
    { id: 'sbi', name: 'State Bank of India' },
    { id: 'axis', name: 'Axis Bank' },
    { id: 'kotak', name: 'Kotak Mahindra Bank' },
    { id: 'pnb', name: 'Punjab National Bank' },
    { id: 'bob', name: 'Bank of Baroda' },
    { id: 'yes', name: 'Yes Bank' },
    { id: 'idbi', name: 'IDBI Bank' },
    { id: 'other', name: 'Other Banks' }
  ];

  const [selectedBank, setSelectedBank] = useState('hdfc');
  const [isAgreed, setIsAgreed] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [placeOrderError, setPlaceOrderError] = useState(null);
  const [placedOrder, setPlacedOrder] = useState(null);

  const deliveryCharge = cartItems.length ? 200 : 0;
  const platformFee = cartItems.length ? 250 : 0;
  const toPay = cartTotalAmount + deliveryCharge + platformFee;

  const selectedAddress = addresses.find((x) => x.id === selectedAddressId) || null;

  useEffect(() => {
    if (step !== 2) return undefined;
    let cancelled = false;
    (async () => {
      if (!accessToken) {
        setAddresses([]);
        setSelectedAddressId(null);
        return;
      }
      setAddressLoading(true);
      setAddressError(null);
      try {
        if (cartItems.length > 0) {
          await syncShopOrderCart(accessToken, cartItems);
        }
        const list = await fetchShippingAddresses(accessToken);
        if (cancelled) return;
        const mapped = list.map((a) => mapApiAddress(a));
        setAddresses(mapped);
        const def = list.find((x) => x.default) || list[0];
        const nextId = def?.id ?? null;
        setSelectedAddressId(nextId);
        if (nextId) {
          await assignShippingAddressToOrder(accessToken, nextId).catch((e) => {
            if (!cancelled) setAddressError(e.message || 'Could not link address to order.');
          });
        }
      } catch (e) {
        if (!cancelled) setAddressError(e.message || 'Could not load addresses.');
      } finally {
        if (!cancelled) setAddressLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [step, accessToken, cartItems]);

  const steps = [
    { id: 1, name: 'Cart', icon: ShoppingCart },
    { id: 2, name: 'Address', icon: MapPin },
    { id: 3, name: 'Review', icon: ClipboardList },
    { id: 4, name: 'Payment', icon: CreditCard }
  ];

  const paymentMethods = [
    { id: 'card', label: 'Credit Card or Debit Card' },
    { id: 'banking', label: 'Net Banking' },
    { id: 'upi', label: 'Pay with UPI' },
    { id: 'cod', label: 'Cash On Delivery' }
  ];

  const handleEditAddress = (e, addr) => {
    e.stopPropagation();
    setModalMode('edit');
    setEditingAddressId(addr.id);
    const r = addr.raw || {};
    setAddressForm({
      label: r.label || '',
      first_name: r.first_name || '',
      last_name: r.last_name || '',
      mobile_no: r.mobile_no || '',
      apartment_address: r.apartment_address || '',
      street_address: r.street_address || '',
      city: r.city || '',
      state: r.state || '',
      country: r.country || 'India',
      zip: r.zip || '',
      default: Boolean(r.default),
    });
    setShowAddressModal(true);
  };

  const handleAddAddress = () => {
    setModalMode('add');
    setEditingAddressId(null);
    setAddressForm(emptyAddressForm);
    setShowAddressModal(true);
  };

  const handleSelectAddress = async (addr) => {
    if (!accessToken) return;
    setSelectedAddressId(addr.id);
    setAddressError(null);
    try {
      await assignShippingAddressToOrder(accessToken, addr.id);
    } catch (err) {
      setAddressError(err.message || 'Could not use this address.');
    }
  };

  const handleDeleteAddress = async (e, addr) => {
    e.stopPropagation();
    if (!accessToken) return;
    if (!window.confirm('Remove this address from your account?')) return;
    setAddressError(null);
    try {
      await deleteShippingAddress(accessToken, addr.id);
      const list = await fetchShippingAddresses(accessToken);
      const mapped = list.map((a) => mapApiAddress(a));
      setAddresses(mapped);
      const def = list.find((x) => x.default) || list[0];
      const nextId = def?.id ?? null;
      setSelectedAddressId(nextId);
      if (nextId) {
        await assignShippingAddressToOrder(accessToken, nextId);
      }
    } catch (err) {
      setAddressError(err.message || 'Could not delete address.');
    }
  };

  const handleAddressFormChange = (field, value) => {
    setAddressForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveAddressModal = async (e) => {
    e.preventDefault();
    if (!accessToken) return;
    setAddressFormSubmitting(true);
    setAddressError(null);
    const body = {
      label: addressForm.label.trim(),
      first_name: addressForm.first_name.trim(),
      last_name: addressForm.last_name.trim(),
      mobile_no: addressForm.mobile_no.trim(),
      apartment_address: addressForm.apartment_address.trim(),
      street_address: addressForm.street_address.trim(),
      city: addressForm.city.trim(),
      state: addressForm.state.trim(),
      country: addressForm.country.trim() || 'India',
      zip: addressForm.zip.trim(),
      default: addressForm.default,
      assign_to_cart: true,
    };
    try {
      if (modalMode === 'edit' && editingAddressId != null) {
        await updateShippingAddress(accessToken, editingAddressId, body);
      } else {
        await createShippingAddress(accessToken, body);
      }
      if (cartItems.length > 0) {
        await syncShopOrderCart(accessToken, cartItems);
      }
      const list = await fetchShippingAddresses(accessToken);
      const mapped = list.map((a) => mapApiAddress(a));
      setAddresses(mapped);
      const newest = modalMode === 'add' ? mapped[mapped.length - 1] : mapped.find((x) => x.id === editingAddressId);
      if (newest?.id) {
        setSelectedAddressId(newest.id);
        await assignShippingAddressToOrder(accessToken, newest.id);
      }
      setShowAddressModal(false);
    } catch (err) {
      setAddressError(err.message || 'Could not save address.');
    } finally {
      setAddressFormSubmitting(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (placingOrder) return;
    if (!accessToken) {
      setPlaceOrderError('Please sign in to place this order.');
      return;
    }
    if (!cartItems.length) {
      setPlaceOrderError('Your cart is empty.');
      return;
    }
    if (!selectedAddress) {
      setPlaceOrderError('Select a delivery address before placing the order.');
      setStep(2);
      return;
    }
    setPlacingOrder(true);
    setPlaceOrderError(null);
    try {
      // Re-sync cart in case quantities changed since the address step,
      // re-link the address, then place the order.
      await syncShopOrderCart(accessToken, cartItems);
      await assignShippingAddressToOrder(accessToken, selectedAddress.id);
      const computedShipping = selectedPayment === 'cod' ? 0 : deliveryCharge;
      const placed = await placeShopOrder(accessToken, {
        payment_mode: PAYMENT_MODE_BY_UI[selectedPayment] || 'COD',
        shipping_cost: computedShipping,
      });
      setPlacedOrder(placed);
      dispatch(clearCart());
      setStep(5);
    } catch (err) {
      setPlaceOrderError(err?.message || 'Could not place order.');
    } finally {
      setPlacingOrder(false);
    }
  };

  const canProceedFromAddressStep =
    isAuthenticated &&
    !!accessToken &&
    !addressLoading &&
    addresses.length > 0 &&
    selectedAddressId != null &&
    !!selectedAddress;

  return (
    <div className="bg-white min-h-screen font-sans pb-20 relative">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-8 md:py-12">
        {/* Header */}
        <div className="mb-10 md:mb-16">
          <h1 className="text-[32px] md:text-[42px] font-serif font-bold text-[#111827] mb-2">
            {step === 1 ? 'Cart' : step === 2 ? 'Select Address' : step === 3 ? 'Review' : 'Payment'}
          </h1>
          <p className="text-gray-400 text-base md:text-lg">
            {step === 4 ? 'Complete your payment securely' : step === 3 ? 'View the items in your cart' : step === 1 ? 'View the items in your cart' : 'Choose or add a delivery address'}
          </p>
        </div>

        {/* Progress Bar (Hidden on Success Step) */}
        {step < 5 && (
          <div className="flex items-center justify-between max-w-[800px] mx-auto mb-12 md:mb-20 relative px-2 md:px-4">
            {/* Connector Lines (Persistent Purple as per design) */}
            <div className="absolute top-[25px] md:top-[35px] left-[10%] right-[10%] h-[1.5px] bg-gray-100 -z-0 flex">
               <div className={`w-1/3 h-full bg-purple-400 transition-opacity duration-500 ${step >= 2 ? 'opacity-60' : 'opacity-10'}`}></div>
               <div className={`w-1/3 h-full bg-purple-400 transition-opacity duration-500 ${step >= 3 ? 'opacity-40' : 'opacity-10'}`}></div>
               <div className={`w-1/3 h-full bg-purple-400 transition-opacity duration-500 ${step >= 4 ? 'opacity-20' : 'opacity-10'}`}></div>
            </div>
            
            {steps.map((s) => (
              <div key={s.id} className="flex flex-col items-center z-10 transition-all duration-500">
                <div className={`w-[50px] h-[50px] md:w-[70px] md:h-[70px] rounded-full flex items-center justify-center transition-all duration-500 mb-2 md:mb-3 ${
                  step === s.id 
                  ? 'bg-[#f47a4d] shadow-[0_10px_20px_-5px_rgba(244,122,77,0.4)] text-white' 
                  : 'bg-[#f0f1f3] text-gray-400 border border-gray-100'
                }`}>
                  <s.icon className={`w-5 h-5 md:w-6 md:h-6 ${step === s.id ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} />
                </div>
                <span className={`text-[10px] md:text-[12px] font-black uppercase tracking-tighter transition-colors ${step === s.id ? 'text-[#111827]' : 'text-gray-300'}`}>
                  {s.name}
                </span>
              </div>
            ))}
          </div>
        )}

        {step === 1 ? (
          <>
            {/* Cart Items List */}
            <div className="space-y-4 md:space-y-6 mb-12 md:mb-16">
              {cartItems.map((item) => (
                <div key={item.id} className="relative bg-white border border-gray-100 rounded-[20px] p-5 md:p-8 hover:shadow-2xl hover:shadow-gray-100/30 transition-all duration-500 overflow-hidden">
                  {/* OEM Badge */}
                  <div className="absolute top-0 left-0 bg-[#f47a4d] text-white text-[10px] font-black px-4 py-1.5 rounded-br-[12px] uppercase tracking-wider">
                    OEM
                  </div>

                  <div className="flex flex-col md:flex-row items-center justify-between">
                    <div className="flex flex-col md:flex-row items-center flex-1">
                      {/* Product Image */}
                      <div className="w-[140px] h-[110px] flex items-center justify-center bg-gray-50/50 rounded-[20px] mb-6 md:mb-0 md:mr-10 p-5">
                        <img src={item.image} alt={item.name} className="max-w-full max-h-full object-contain" />
                      </div>

                      {/* Product Info */}
                      <div className="text-center md:text-left mt-2 md:mt-0">
                        <div className="flex flex-col md:flex-row md:items-center mb-2 md:mb-3">
                        <span className="text-[20px] md:text-[24px] font-black text-[#111827] md:mr-4 leading-none">Rs.{Number(item.price || 0).toLocaleString()}</span>
                          <div className="flex items-center justify-center md:justify-start space-x-3 mt-2 md:mt-0">
                            <span className="text-[11px] md:text-[12px] text-gray-400">Qty x Price</span>
                          </div>
                        </div>
                        <h3 className="text-[15px] md:text-[17px] font-bold text-gray-900 mb-1 leading-tight">{item.name}</h3>
                        <p className="text-[12px] md:text-[13px] font-medium text-gray-400 tracking-tight">Product ID: {item.id}</p>
                      </div>
                    </div>

                    {/* Delivery Info */}
                    <div className="mt-8 md:mt-0 md:px-12 text-center md:text-left border-gray-50 md:border-x px-10">
                      <p className="text-[14px] font-bold text-gray-700 mb-1">Delivers to your default address</p>
                      <p className="text-[12px] font-black text-emerald-500 uppercase tracking-widest">Free Delivery</p>
                    </div>

                    {/* Remove & Quantity */}
                    <div className="mt-8 md:mt-0 flex flex-col items-center md:items-end min-w-[120px]">
                      <button onClick={() => dispatch(removeItemFromCart(item.id))} className="text-[12px] font-bold text-gray-400 hover:text-red-500 transition-colors mb-6 flex items-center">
                        <span className="mb-0.5">Remove</span>
                      </button>
                      <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-100/50">
                        <button onClick={() => dispatch(removeItemFromCart(item.id))} className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors">
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-10 text-center text-[18px] font-black text-gray-900">{item.quantity}</span>
                        <button onClick={() => dispatch(addItemToCart({ id: item.id, price: item.price, title: item.name, image: item.image }))} className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors">
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Actions */}
            <div className="flex flex-col md:flex-row items-center justify-end space-y-4 md:space-y-0 md:space-x-4">
              <Link 
                to="/" 
                className="px-10 py-4 border border-gray-200 text-gray-500 rounded-full font-bold text-[14px] hover:border-gray-900 hover:text-gray-900 transition-all w-full md:w-auto text-center"
              >
                Browse items
              </Link>
              <button 
                onClick={() => setStep(2)}
                disabled={!cartItems.length}
                className="group px-12 py-4 bg-[#f47a4d] text-white rounded-full font-black text-[15px] hover:bg-[#ff8a5e] hover:shadow-orange-200 transition-all shadow-xl shadow-orange-100 flex items-center justify-center w-full md:w-auto"
              >
                Proceed to buy
                <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </>
        ) : step === 2 ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {!isAuthenticated ? (
              <div className="max-w-xl mx-auto bg-orange-50/80 border border-orange-100 rounded-[24px] p-10 text-center mb-12">
                <MapPin className="w-10 h-10 text-[#f47a4d] mx-auto mb-4 stroke-[2px]" />
                <h2 className="text-xl font-black text-[#111827] mb-2">Sign in to manage delivery addresses</h2>
                <p className="text-gray-500 text-[14px] mb-6 leading-relaxed">
                  Saved addresses are loaded from your account. Sign in to add or choose where we should ship your order.
                </p>
                <Link
                  to="/login"
                  state={{ from: '/cart' }}
                  className="inline-flex items-center px-10 py-4 bg-[#f47a4d] text-white rounded-full font-black text-[15px] hover:bg-[#ff8a5e] shadow-lg shadow-orange-100 transition-all"
                >
                  Sign in to continue
                </Link>
              </div>
            ) : (
              <>
                {addressError && (
                  <div className="mb-8 p-4 rounded-2xl bg-red-50 border border-red-100 text-[13px] font-bold text-red-700">{addressError}</div>
                )}
                {addressLoading && (
                  <p className="text-center text-gray-400 font-bold mb-8">Loading your addresses…</p>
                )}
                {/* Address Selection Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-12 md:mb-16">
                  {addresses.map((addr) => {
                    const isSelected = selectedAddressId === addr.id;
                    return (
                      <div
                        role="button"
                        tabIndex={0}
                        key={addr.id}
                        onClick={() => handleSelectAddress(addr)}
                        onKeyDown={(ev) => {
                          if (ev.key === 'Enter' || ev.key === ' ') {
                            ev.preventDefault();
                            handleSelectAddress(addr);
                          }
                        }}
                        className={`bg-white rounded-[24px] p-6 md:p-8 shadow-lg relative cursor-pointer outline-none transition-all ${
                          isSelected ? 'border-2 border-[#f47a4d] shadow-orange-100/40 ring-2 ring-orange-100' : 'border-2 border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-6 md:mb-8">
                          <span className="text-[16px] md:text-[17px] font-black text-[#111827]">{addr.label}</span>
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={(e) => handleEditAddress(e, addr)}
                              className="p-2.5 bg-gray-100/50 rounded-full text-gray-400 hover:text-[#111827] transition-colors"
                              aria-label="Edit address"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteAddress(e, addr)}
                              className="p-2.5 bg-gray-100/50 rounded-full text-gray-400 hover:text-red-500 transition-colors"
                              aria-label="Delete address"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {isSelected && (
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Selected</span>
                          )}
                          <p className="text-[18px] font-black text-[#111827] tracking-tight">{addr.name}</p>
                          <p className="text-[16px] font-bold text-[#111827] tracking-tight">{addr.phone}</p>
                          <p className="text-[13px] font-medium text-gray-400 leading-relaxed mt-4">{addr.address}</p>
                        </div>
                      </div>
                    );
                  })}

                  <div
                    role="button"
                    tabIndex={0}
                    onClick={handleAddAddress}
                    onKeyDown={(ev) => {
                      if (ev.key === 'Enter' || ev.key === ' ') {
                        ev.preventDefault();
                        handleAddAddress();
                      }
                    }}
                    className="bg-[#f9fafb] border-2 border-dashed border-gray-100 rounded-[24px] p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 hover:border-gray-200 transition-all group min-h-[260px]"
                  >
                    <div className="w-[50px] h-[50px] bg-gray-200/50 rounded-full flex items-center justify-center mb-4 group-hover:bg-white transition-colors">
                      <Plus className="w-6 h-6 text-gray-400 group-hover:text-[#111827]" />
                    </div>
                    <span className="text-[13px] font-bold text-gray-400 group-hover:text-[#111827]">
                      {addresses.length ? 'Add another address' : 'Add delivery address'}
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Footer Actions */}
            <div className="flex justify-end pt-8">
              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={!canProceedFromAddressStep}
                title={!canProceedFromAddressStep ? 'Choose or save a delivery address' : ''}
                className="group px-14 py-4 bg-[#f47a4d] text-white rounded-full font-black text-[15px] hover:bg-[#ff8a5e] hover:shadow-orange-200 transition-all shadow-xl shadow-orange-100 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
              >
                Next
                <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        ) : step === 3 ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Review Section */}
            <div className="mb-12">
              <h3 className="text-[15px] font-bold text-gray-400 mb-6 ml-1">Selected Address</h3>
              <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-6">
                <div className="flex-1 bg-white border border-[#f47a4d] rounded-[22px] md:rounded-[24px] p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between shadow-lg shadow-orange-50/50 relative overflow-hidden group">
                  <div className="flex items-center">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-50 rounded-full flex items-center justify-center mr-4 md:mr-5 text-[#f47a4d]">
                      <MapPin className="ml-0.5 w-5 h-5 md:w-6 md:h-6 stroke-[2.5px]" />
                    </div>
                    <div className="space-y-0.5 md:space-y-1">
                      <span className="text-[12px] md:text-[14px] font-black text-[#f47a4d] uppercase tracking-widest block">
                        {selectedAddress?.label || 'Delivery'}
                      </span>
                      <p className="text-[13px] md:text-[14px] font-medium text-gray-400 leading-tight">
                        {selectedAddress?.address || '—'}
                      </p>
                    </div>
                  </div>
                  <div className="text-left md:text-right mt-4 md:mt-0 pl-14 md:pl-0">
                    <p className="text-[14px] md:text-[15px] font-black text-gray-900">{selectedAddress?.name || '—'}</p>
                    <p className="text-[13px] md:text-[14px] font-bold text-gray-400 tracking-tight">{selectedAddress?.phone || ''}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setStep(2)}
                  className="px-8 py-3.5 border border-gray-100 text-[#f47a4d] rounded-full font-bold text-[14px] hover:bg-orange-50 transition-all"
                >
                  Change
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              {/* Cart Review */}
              <div>
                <h3 className="text-[15px] font-bold text-gray-400 mb-6 ml-1">Cart Review</h3>
                <div className="bg-white border-2 border-purple-100 rounded-[28px] p-8 shadow-xl shadow-purple-50/30">
                  <div className="space-y-5 mb-8">
                    <div className="flex justify-between items-center text-[15px] font-bold text-gray-600">
                      <span>Cart Subtotal</span>
                      <span className="text-gray-900 font-black">₹ {cartTotalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-[15px] font-bold text-gray-600">
                      <span>Delivery Charge</span>
                      <span className="text-gray-900 font-black">₹ {deliveryCharge.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-[15px] font-bold text-gray-600">
                      <span>Platform Fee</span>
                      <span className="text-gray-900 font-black">₹ {platformFee.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="h-[1.5px] bg-gray-50 mb-8"></div>
                  <div className="bg-orange-50/50 rounded-[24px] px-8 py-6 flex justify-between items-center">
                    <span className="text-[20px] font-black text-[#111827]">To Pay</span>
                    <span className="text-[22px] font-black text-[#f47a4d]">₹ {toPay.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <h3 className="text-[15px] font-bold text-gray-400 mb-6 ml-1">Payment Method</h3>
                <div className="space-y-4">
                  {paymentMethods.map((method) => (
                    <div 
                      key={method.id}
                      onClick={() => setSelectedPayment(method.id)}
                      className={`group cursor-pointer border rounded-[20px] p-5 flex items-center justify-between transition-all duration-300 ${
                        selectedPayment === method.id 
                        ? 'bg-[#f5f3ff] border-[#7c3aed] shadow-md shadow-purple-50' 
                        : 'bg-white border-gray-100 hover:border-gray-300'
                      }`}
                    >
                      <span className={`text-[15px] font-bold transition-colors ${
                        selectedPayment === method.id ? 'text-[#7c3aed]' : 'text-gray-600'
                      }`}>
                        {method.label}
                      </span>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        selectedPayment === method.id 
                        ? 'border-[#7c3aed]' 
                        : 'border-gray-200 bg-white group-hover:border-gray-300'
                      }`}>
                         {selectedPayment === method.id && (
                           <div className="w-3 h-3 bg-[#7c3aed] rounded-full ring-2 ring-white"></div>
                         )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex justify-end pt-12">
              <button 
                onClick={() => setStep(4)}
                className="group px-14 py-4 bg-[#7c3aed] text-white rounded-full font-black text-[15px] hover:bg-[#6d28d9] transition-all shadow-lg shadow-purple-100 flex items-center justify-center"
              >
                Proceed to Pay
                <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        ) : step === 4 ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Payment Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              {/* Left Column: Form */}
              <div className="lg:col-span-7 space-y-8">
                {/* Selected Method Bar */}
                <div className="bg-white border border-gray-100 rounded-[22px] p-5 flex items-center justify-between shadow-sm">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center mr-4">
                      {selectedPayment === 'card' ? (
                        <CreditCard className="w-5 h-5 text-[#f47a4d]" />
                      ) : selectedPayment === 'upi' ? (
                        <div className="w-5 h-5 flex items-center justify-center border-2 border-[#f47a4d] rounded-md text-[8px] font-black text-[#f47a4d]">UPI</div>
                      ) : (
                        <MapPin className="w-5 h-5 text-[#f47a4d]" />
                      )}
                    </div>
                    <span className="text-[15px] font-bold text-gray-900">
                      {selectedPayment === 'card' ? 'Credit Card or Debit Card' : selectedPayment === 'upi' ? 'Pay with UPI' : 'Net Banking'}
                    </span>
                  </div>
                  <button 
                    onClick={() => setStep(3)}
                    className="px-6 py-2 border border-gray-100 text-[#f47a4d] rounded-full font-bold text-[13px] hover:bg-orange-50 transition-all"
                  >
                    Change
                  </button>
                </div>

                {/* Main Payment Container */}
                <div className="bg-white border-2 border-orange-100 shadow-xl shadow-orange-50/20 rounded-[24px] md:rounded-[28px] p-5 md:p-10 min-h-[400px] md:min-h-[480px]">
                  {selectedPayment === 'card' ? (
                    <>
                      <h3 className="text-[14px] font-bold text-gray-400 mb-8 ml-1">Card Details</h3>
                      <form className="space-y-6">
                        <div className="space-y-2.5">
                          <label className="text-[13px] font-black text-gray-900 ml-1">Card Number</label>
                          <input 
                            type="text" 
                            placeholder="1234 5678 9012 3456"
                            className="w-full bg-white border border-gray-100 rounded-[16px] px-6 py-4 focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-[#7c3aed] text-[15px] font-medium transition-all"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2.5">
                            <label className="text-[13px] font-black text-gray-900 ml-1">Expiry Date</label>
                            <input 
                              type="text" 
                              placeholder="MM/YY"
                              className="w-full bg-white border border-gray-100 rounded-[16px] px-6 py-4 focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-[#7c3aed] text-[15px] font-medium transition-all"
                            />
                          </div>
                          <div className="space-y-2.5">
                            <label className="text-[13px] font-black text-gray-900 ml-1">CVV</label>
                            <input 
                              type="password" 
                              placeholder="123"
                              className="w-full bg-white border border-gray-100 rounded-[16px] px-6 py-4 focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-[#7c3aed] text-[15px] font-medium transition-all"
                            />
                          </div>
                        </div>

                        <div className="space-y-2.5">
                          <label className="text-[13px] font-black text-gray-900 ml-1">Cardholder Name</label>
                          <input 
                            type="text" 
                            placeholder="JOHN DOE"
                            className="w-full bg-white border border-gray-100 rounded-[16px] px-6 py-4 focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-[#7c3aed] text-[15px] font-medium transition-all"
                          />
                        </div>
                      </form>
                    </>
                  ) : selectedPayment === 'upi' ? (
                    <div className="flex flex-col h-full">
                      <h3 className="text-[14px] font-bold text-gray-400 mb-8 ml-1">UPI Payment</h3>
                      
                      {/* UPI Sub-tabs */}
                      <div className="flex bg-gray-50/50 p-1.5 rounded-[20px] mb-12">
                        <button className="flex-1 flex items-center justify-center py-4 bg-white border border-gray-100 text-gray-900 rounded-[16px] font-bold text-[14px] shadow-sm">
                           <div className="w-4 h-4 mr-3 flex items-center justify-center border-2 border-gray-400 rounded-sm italic font-black text-[6px] tracking-tighter">UPI</div>
                           UPI ID
                        </button>
                        <button className="flex-1 flex items-center justify-center py-4 text-[#7c3aed] font-bold text-[14px] border-2 border-purple-100 bg-purple-50/30 rounded-[16px] shadow-sm ml-2">
                           <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                           QR Code
                        </button>
                      </div>

                      {/* QR Code Placeholder */}
                      <div className="flex-1 flex flex-col items-center justify-center py-10">
                        <div className="bg-gray-50 rounded-[32px] p-10 mb-8 w-[240px] h-[240px] flex flex-col items-center justify-center text-center">
                          <svg className="w-20 h-20 text-gray-300 mb-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="8" height="8" rx="1"></rect><rect x="13" y="3" width="8" height="8" rx="1"></rect><rect x="3" y="13" width="8" height="8" rx="1"></rect><rect x="13" y="13" width="8" height="8" rx="1"></rect><circle cx="17" cy="17" r="1"></circle><circle cx="7" cy="7" r="1"></circle></svg>
                          <p className="text-[14px] font-black text-gray-900 mb-1 leading-tight">QR Code will appear here</p>
                          <p className="text-[11px] font-medium text-gray-400">Scan with any UPI app</p>
                        </div>
                        <p className="text-[13px] font-bold text-gray-300 text-center px-10">
                          Open any UPI app and scan the QR code to complete payment
                        </p>
                      </div>
                    </div>
                  ) : selectedPayment === 'banking' ? (
                    <div className="flex flex-col h-full">
                      <h3 className="text-[14px] font-bold text-gray-400 mb-8 ml-1">Select Your Bank</h3>
                      
                      {/* Bank Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                        {banks.map((bank) => (
                          <div 
                            key={bank.id}
                            onClick={() => setSelectedBank(bank.id)}
                            className={`group cursor-pointer border rounded-[16px] p-3 md:p-4 flex items-center justify-between transition-all duration-300 ${
                              selectedBank === bank.id 
                              ? 'bg-[#f5f3ff] border-[#7c3aed] shadow-md shadow-purple-50' 
                              : 'bg-white border-gray-100 hover:border-gray-200'
                            }`}
                          >
                            <div className="flex items-center">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 transition-colors ${
                                selectedBank === bank.id ? 'bg-purple-100 text-[#7c3aed]' : 'bg-gray-100 text-gray-400'
                              }`}>
                                <MapPin className="ml-0.5 w-5 h-5" />
                              </div>
                              <span className={`text-[13px] font-bold transition-colors ${
                                selectedBank === bank.id ? 'text-[#7c3aed]' : 'text-gray-600'
                              }`}>
                                {bank.name}
                              </span>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                              selectedBank === bank.id 
                              ? 'border-[#7c3aed]' 
                              : 'border-gray-200 bg-white'
                            }`}>
                               {selectedBank === bank.id && (
                                 <div className="w-2.5 h-2.5 bg-[#7c3aed] rounded-full ring-2 ring-white"></div>
                               )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col h-full">
                      <div className="flex items-center space-x-4 mb-10">
                        <div className="w-[50px] h-[50px] bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-100">
                          <Banknote className="w-6 h-6" />
                        </div>
                        <h3 className="text-[15px] font-black text-gray-900">How Cash on Delivery Works</h3>
                      </div>

                      <div className="space-y-8 mb-10">
                        <div className="flex items-start">
                          <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mr-5 shrink-0">
                            <Banknote className="w-5 h-5 text-orange-500" />
                          </div>
                          <div className="pt-1">
                            <h4 className="text-[14px] font-black text-gray-900 mb-0.5">Pay at Delivery</h4>
                            <p className="text-[12px] font-medium text-gray-400">Pay cash when you receive your order at your doorstep</p>
                          </div>
                        </div>

                        <div className="flex items-start">
                          <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mr-5 shrink-0">
                            <ShieldCheck className="w-5 h-5 text-orange-500" />
                          </div>
                          <div className="pt-1">
                            <h4 className="text-[14px] font-black text-gray-900 mb-0.5">Inspect First</h4>
                            <p className="text-[12px] font-medium text-gray-400">Check your products before making the payment</p>
                          </div>
                        </div>

                        <div className="flex items-start">
                          <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mr-5 shrink-0">
                            <Truck className="w-5 h-5 text-orange-500" />
                          </div>
                          <div className="pt-1">
                            <h4 className="text-[14px] font-black text-gray-900 mb-0.5">Free Delivery</h4>
                            <p className="text-[12px] font-medium text-gray-400">No extra charges for cash on delivery orders</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-orange-50/30 border-l-[4px] border-orange-400 rounded-r-[20px] p-6 mb-2">
                        <div className="flex items-center space-x-2.5 mb-2">
                           <ShieldCheck className="w-4 h-4 text-orange-400" />
                           <h4 className="text-[13px] font-black text-gray-900">Important Note</h4>
                        </div>
                        <p className="text-[12px] font-medium text-gray-400 leading-relaxed px-1">
                          Please keep the exact amount ready. Our delivery partner may not have change for large denominations.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Delivery Address Preview and T&C (Added for COD) */}
                {selectedPayment === 'cod' && (
                  <div className="animate-in fade-in slide-in-from-top-4 duration-500 space-y-6">
                    <h3 className="text-[15px] font-bold text-gray-400 ml-1">Delivery Address</h3>
                    <div className="bg-white border border-gray-100 rounded-[24px] p-6 flex flex-col md:flex-row md:items-center justify-between shadow-sm">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center mr-5 text-[#f47a4d]">
                          <MapPin className="ml-0.5 w-6 h-6 stroke-[2.5px]" />
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[13px] font-black text-[#f47a4d] uppercase tracking-widest block">
                            {selectedAddress?.label || 'Delivery'}
                          </span>
                          <p className="text-[13px] font-medium text-gray-400">{selectedAddress?.address || '—'}</p>
                        </div>
                      </div>
                      <div className="text-right mt-4 md:mt-0">
                        <p className="text-[14px] font-black text-gray-900">{selectedAddress?.name || '—'}</p>
                        <p className="text-[13px] font-bold text-gray-400 tracking-tight">{selectedAddress?.phone || ''}</p>
                      </div>
                    </div>

                    <div 
                      onClick={() => setIsAgreed(!isAgreed)}
                      className="bg-white border border-gray-100 rounded-[20px] p-6 flex items-start space-x-4 shadow-sm group cursor-pointer hover:border-purple-200 transition-colors"
                    >
                      <div className={`w-6 h-6 rounded-[6px] flex items-center justify-center transition-all ${
                        isAgreed ? 'bg-[#7c3aed] shadow-lg shadow-purple-100' : 'border-2 border-gray-200 bg-white group-hover:border-[#7c3aed]'
                      }`}>
                        {isAgreed ? (
                          <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                        ) : (
                          <div className="w-3.5 h-3.5 bg-transparent rounded-sm"></div>
                        )}
                      </div>
                      <p className="text-[12px] font-medium text-gray-500 leading-tight">
                        I agree to the <span className="text-[#7c3aed] font-black cursor-pointer hover:underline">Terms and Conditions</span> and confirm that the delivery address and order details are correct.
                      </p>
                    </div>
                  </div>
                )}

                {/* Method Switcher */}
                <div className="flex items-center space-x-4 pt-4 overflow-x-auto no-scrollbar pb-2">
                  <button 
                    onClick={() => setSelectedPayment('card')}
                    className={`flex items-center px-8 py-4 rounded-[18px] font-bold text-[14px] transition-all whitespace-nowrap ${
                      selectedPayment === 'card' 
                      ? 'bg-[#7c3aed] text-white shadow-lg shadow-purple-200 cursor-default' 
                      : 'bg-white border border-gray-100 text-gray-600 hover:border-gray-200 shadow-sm'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 mr-3" />
                    Credit/Debit Card
                  </button>
                  <button 
                    onClick={() => setSelectedPayment('upi')}
                    className={`flex items-center px-8 py-4 rounded-[18px] font-black text-[14px] transition-all whitespace-nowrap ${
                      selectedPayment === 'upi' 
                      ? 'bg-[#7c3aed] text-white shadow-lg shadow-purple-200 cursor-default' 
                      : 'bg-white border border-gray-100 text-gray-600 hover:border-gray-200 shadow-sm'
                    }`}
                  >
                    <div className={`w-5 h-5 mr-3 flex items-center justify-center border-2 rounded-sm italic font-black text-[8px] tracking-tighter ${
                      selectedPayment === 'upi' ? 'border-white' : 'border-gray-600'
                    }`}>UPI</div>
                    UPI
                  </button>
                  <button 
                    onClick={() => setSelectedPayment('banking')}
                    className={`flex items-center px-8 py-4 rounded-[18px] font-bold text-[14px] transition-all whitespace-nowrap ${
                      selectedPayment === 'banking' 
                      ? 'bg-[#7c3aed] text-white shadow-lg shadow-purple-200 cursor-default' 
                      : 'bg-white border border-gray-100 text-gray-600 hover:border-gray-200 shadow-sm'
                    }`}
                  >
                    <MapPin className="ml-0.5 w-5 h-5 mr-3" />
                    Net Banking
                  </button>
                  <button 
                    onClick={() => setSelectedPayment('cod')}
                    className={`flex items-center px-8 py-4 rounded-[18px] font-bold text-[14px] transition-all whitespace-nowrap ${
                      selectedPayment === 'cod' 
                      ? 'bg-[#7c3aed] text-white shadow-lg shadow-purple-200 cursor-default' 
                      : 'bg-white border border-gray-100 text-gray-600 hover:border-gray-200 shadow-sm'
                    }`}
                  >
                    <Banknote className="w-5 h-5 mr-3" />
                    COD
                  </button>
                </div>
              </div>

              {/* Right Column: Order Summary */}
              <div className="lg:col-span-5">
                <div className="bg-white border border-gray-50 rounded-[32px] p-8 shadow-sm">
                  <h3 className="text-[16px] font-bold text-gray-900 mb-10">Order Summary</h3>
                  
                  <div className="space-y-6 mb-10">
                    <div className="flex justify-between items-center text-[15px] font-medium text-gray-400">
                      <span>Cart Subtotal :</span>
                      <span className="text-gray-900 font-bold tracking-tight">₹ {cartTotalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-[15px] font-medium text-gray-400">
                      <span>Delivery Charge :</span>
                      <span className="text-gray-900 font-bold tracking-tight">₹ {selectedPayment === 'cod' ? '0' : deliveryCharge.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-[15px] font-medium text-gray-400">
                      <span>Platform Fee :</span>
                      <span className="text-gray-900 font-bold tracking-tight">₹ {platformFee.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="h-[1px] bg-gray-50 mb-10"></div>

                  <div className="flex justify-between items-center mb-10">
                    <span className="text-[20px] font-black text-[#111827]">To Pay</span>
                    <span className="text-[24px] font-black text-[#111827]">₹ {(selectedPayment === 'cod' ? cartTotalAmount + platformFee : toPay).toLocaleString()}</span>
                  </div>

                  {placeOrderError && (
                    <div className="mb-4 px-4 py-3 rounded-[14px] border border-red-100 bg-red-50 text-[13px] font-bold text-red-700">
                      {placeOrderError}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handlePlaceOrder}
                    disabled={placingOrder || !cartItems.length || !selectedAddress}
                    className="w-full py-5 bg-[#333333] text-white rounded-[20px] font-black text-[16px] mb-8 hover:bg-black transition-all shadow-xl shadow-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {placingOrder
                      ? 'Placing order…'
                      : selectedPayment === 'cod'
                        ? 'Confirm Order'
                        : 'Pay Now'}
                  </button>

                  <div className="relative pl-6 py-2 border-l-[3px] border-[#7c3aed] rounded-r-lg group">
                    <div className="flex items-start">
                      <div className="w-5 h-5 bg-purple-50 text-[#7c3aed] rounded-full flex items-center justify-center mr-3 mt-0.5 shrink-0">
                        <span className="text-[11px] font-black">!</span>
                      </div>
                      <p className="text-[12px] leading-relaxed font-bold text-[#111827]">
                        {selectedPayment === 'cod' 
                          ? 'Note: Please ensure you are available at the delivery address to receive the order'
                          : 'Note: Please do not press back button or close the screen until the payment is complete'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in zoom-in-95 duration-1000 max-w-[1000px] mx-auto pt-10">
            {/* Success Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-[100px] h-[100px] border-[5px] border-orange-50 rounded-full mb-8 relative">
                 <div className="absolute inset-0 border-[2px] border-orange-400 rounded-full animate-ping opacity-20"></div>
                 <CheckCircle2 className="w-12 h-12 text-[#f47a4d] stroke-[2.5px]" />
              </div>
              <p className="text-[14px] font-bold text-gray-400 mb-2">Order Placed Successfully!</p>
              <h1 className="text-[28px] font-black text-gray-400 leading-tight max-w-[600px] mx-auto">
                Thank you for your purchase. Your order has been confirmed.
              </h1>
            </div>

            {/* Order Number Box */}
            <div className="bg-[#f47a4d] rounded-[24px] md:rounded-[28px] p-6 md:p-8 text-center mb-10 md:mb-12 shadow-xl shadow-orange-100 mx-2 md:mx-0">
              <p className="text-[10px] md:text-[11px] font-black text-white/70 uppercase tracking-[2px] md:tracking-[3px] mb-2">Order Number</p>
              <h2 className="text-[14px] md:text-[18px] font-black text-white mb-1 tracking-tight break-all px-2">
                {placedOrder?.order_id || '—'}
              </h2>
              <p className="text-[12px] md:text-[13px] font-medium text-white/90 tracking-tight">
                Placed on{' '}
                {placedOrder?.ordered_date
                  ? new Date(placedOrder.ordered_date).toLocaleString()
                  : new Date().toLocaleString()}
              </p>
              <Link
                to="/account"
                className="inline-block mt-4 text-[12px] font-black text-white underline underline-offset-4 hover:opacity-80"
              >
                View in My Orders →
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              {/* Left Column */}
              <div className="lg:col-span-7 space-y-6 md:space-y-10">
                {/* Email Info */}
                <div className="bg-white border border-[#f47a4d]/30 rounded-[24px] md:rounded-[32px] p-6 md:p-8 flex items-start shadow-sm mx-2 md:mx-0">
                  <div className="w-12 h-12 md:w-14 md:h-14 bg-orange-50 rounded-2xl flex items-center justify-center mr-4 md:mr-6 shrink-0">
                    <Mail className="w-5 h-5 md:w-6 md:h-6 text-[#f47a4d]" />
                  </div>
                  <div>
                    <h3 className="text-[15px] md:text-[16px] font-black text-[#111827] mb-1 leading-none">Tracking Link Sent to Email</h3>
                    <p className="text-[13px] md:text-[14px] font-medium text-gray-400 mb-1.5 leading-relaxed">
                      Once your order is out for delivery, we'll send a tracking link to <span className="text-[#111827] font-black">sarthak@example.com</span>
                    </p>
                    <p className="text-[12px] md:text-[13px] font-bold text-gray-300">You can also track your order here on our website anytime.</p>
                  </div>
                </div>

                {/* Order Tracking Timeline */}
                <div className="bg-white border border-gray-50 rounded-[24px] md:rounded-[32px] p-8 md:p-10 shadow-sm relative mx-2 md:mx-0">
                  <h3 className="text-[14px] md:text-[16px] font-black text-gray-400 mb-8 md:mb-10">Order Tracking</h3>
                  
                  <div className="space-y-12 relative pb-4">
                    {/* Vertical Line */}
                    <div className="absolute left-[22px] top-2 bottom-6 w-[1.5px] bg-gray-100 -z-0"></div>
                    
                    {/* Step 1 */}
                    <div className="flex items-start relative z-10">
                      <div className="w-11 h-11 bg-[#f47a4d] rounded-full flex items-center justify-center mr-4 shadow-lg shadow-orange-100">
                        <CheckCircle2 className="w-5 h-5 text-white stroke-[2.5px]" />
                      </div>
                      <div className="pt-0.5">
                        <h4 className="text-[15px] font-black text-[#111827] mb-0.5">Order Placed</h4>
                        <p className="text-[13px] font-bold text-gray-300">Today, 2:30 PM</p>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex items-start relative z-10">
                      <div className="w-11 h-11 bg-[#f47a4d] rounded-full flex items-center justify-center mr-4 shadow-lg shadow-orange-100">
                        <Package className="w-5 h-5 text-white" />
                      </div>
                      <div className="pt-0.5">
                        <h4 className="text-[15px] font-black text-[#111827] mb-0.5">Order Confirmed</h4>
                        <p className="text-[13px] font-bold text-gray-300">Today, 2:35 PM</p>
                      </div>
                    </div>

                    {/* Step 3 (Pending) */}
                    <div className="flex items-start relative z-10 opacity-40">
                      <div className="w-11 h-11 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center mr-4">
                        <Truck className="w-5 h-5 text-gray-400" />
                      </div>
                      <div className="pt-0.5">
                        <h4 className="text-[15px] font-bold text-gray-500 mb-0.5">Out for Delivery</h4>
                        <p className="text-[13px] font-medium text-gray-400">Pending</p>
                      </div>
                    </div>

                    {/* Step 4 (Pending) */}
                    <div className="flex items-start relative z-10 opacity-40">
                      <div className="w-11 h-11 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center mr-4">
                        <MapPin className="w-5 h-5 text-gray-400" />
                      </div>
                      <div className="pt-0.5">
                        <h4 className="text-[15px] font-bold text-gray-500 mb-0.5">Delivered</h4>
                        <p className="text-[13px] font-medium text-gray-400">Pending</p>
                      </div>
                    </div>
                  </div>

                  <button className="w-full py-4 mt-10 border border-gray-100 rounded-2xl text-[14px] font-black text-gray-400 hover:text-[#f47a4d] hover:border-orange-50 hover:bg-orange-50/30 transition-all flex items-center justify-center group">
                    View Detailed Tracking
                    <ExternalLink className="ml-2 w-4 h-4 transition-transform group-hover:scale-110" />
                  </button>
                </div>

                {/* Delivery Address */}
                <div className="bg-white border border-gray-50 rounded-[32px] p-8 shadow-sm">
                  <h3 className="text-[15px] font-bold text-gray-400 mb-6">Delivery Address</h3>
                  <div className="flex items-start">
                    <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center mr-5 text-[#f47a4d] shrink-0">
                      <MapPin className="ml-0.5 w-6 h-6 stroke-[2.5px]" />
                    </div>
                    <div>
                      <span className="text-[13px] font-black text-[#f47a4d] uppercase tracking-[2px] block mb-1">
                        {selectedAddress?.label || 'Delivery'}
                      </span>
                      <p className="text-[14px] font-medium text-gray-900 leading-relaxed mb-1">{selectedAddress?.address || '—'}</p>
                      <p className="text-[13px] font-bold text-gray-400 tracking-tight">
                        {selectedAddress ? `${selectedAddress.name} • ${selectedAddress.phone}` : '—'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="lg:col-span-5 space-y-10">
                {/* Order Summary Summary */}
                <div className="bg-white border border-gray-50 rounded-[24px] md:rounded-[32px] p-8 md:p-10 shadow-sm mx-2 md:mx-0">
                  <h3 className="text-[14px] md:text-[16px] font-black text-gray-400 mb-6 md:mb-8">Order Summary</h3>
                  
                  <div className="space-y-5 md:space-y-6 mb-8 md:mb-10">
                    {cartItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start">
                        <div className="max-w-[160px] md:max-w-[180px]">
                          <p className="text-[13px] md:text-[14px] font-black text-[#111827] leading-tight mb-1">{item.name}</p>
                          <p className="text-[11px] md:text-[12px] font-bold text-gray-400">Qty: {item.quantity}</p>
                        </div>
                        <span className="text-[14px] md:text-[15px] font-black text-[#111827]">₹ {(Number(item.price || 0) * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  <div className="h-[1.5px] bg-gray-50 mb-8 md:mb-10"></div>

                  <div className="flex justify-between items-center">
                    <span className="text-[18px] md:text-[20px] font-black text-[#111827]">Total Amount</span>
                    <span className="text-[20px] md:text-[22px] font-black text-[#f47a4d]">₹ {toPay.toLocaleString()}</span>
                  </div>
                </div>

                {/* Expected Delivery */}
                <div className="bg-white border border-[#f47a4d]/40 rounded-[24px] md:rounded-[32px] p-8 md:p-10 shadow-sm mx-2 md:mx-0">
                  <div className="flex items-center text-[#f47a4d] mb-4 md:mb-6">
                    <Calendar className="w-5 h-5 mr-3" />
                    <span className="text-[13px] md:text-[14px] font-black tracking-tight">Expected Delivery</span>
                  </div>
                  <h4 className="text-[20px] md:text-[24px] font-black text-[#f47a4d] mb-2 leading-none">February 18-20, 2026</h4>
                  <p className="text-[12px] md:text-[13px] font-medium text-gray-400 leading-relaxed">
                    We'll notify you once your order is out for delivery
                  </p>
                </div>

                {/* Success Bottom Actions */}
                <div className="flex flex-col space-y-4 pt-4">
                  <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="w-full py-5 bg-[#f47a4d] text-white rounded-[24px] font-black text-[16px] hover:bg-[#e3693c] transition-all shadow-xl shadow-orange-100"
                  >
                    Continue Shopping
                  </button>
                  <button className="w-full py-5 bg-white border border-gray-100 text-[#f47a4d] rounded-[24px] font-black text-[15px] hover:border-orange-100 hover:bg-orange-50/30 transition-all flex items-center justify-center">
                    <Download className="w-5 h-5 mr-3" />
                    Download Invoice
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Address Modal Overlay */}
      {showAddressModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6 overflow-hidden">
          {/* Backdrop Blur */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-md animate-in fade-in duration-500"
            onClick={() => setShowAddressModal(false)}
          ></div>
          
          {/* Modal Content */}
          <div className="relative w-full max-w-[500px] bg-white rounded-[24px] md:rounded-[28px] p-5 md:p-10 shadow-3xl animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto no-scrollbar mx-4">
            <button 
              onClick={() => setShowAddressModal(false)}
              className="absolute top-5 md:top-6 right-5 md:right-6 p-2 text-gray-300 hover:text-gray-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-[20px] md:text-[24px] font-bold text-[#111827] mb-6 md:mb-8 tracking-tight capitalize">
              {modalMode} Address
            </h2>

            <form className="space-y-5" onClick={(e) => e.stopPropagation()} onSubmit={handleSaveAddressModal}>
              <div className="space-y-1.5 text-left">
                <label className="text-[12px] font-black uppercase tracking-wider text-gray-300 ml-1">Address label</label>
                <input
                  type="text"
                  placeholder="Home, Shop, Office"
                  required
                  value={addressForm.label}
                  onChange={(ev) => handleAddressFormChange('label', ev.target.value)}
                  className="w-full bg-gray-50/50 border border-gray-100 rounded-[14px] px-5 py-3.5 focus:outline-none focus:border-orange-200 text-[14px] font-medium transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-[12px] font-black uppercase tracking-wider text-gray-300 ml-1">First name</label>
                  <input
                    type="text"
                    placeholder="First name"
                    required
                    value={addressForm.first_name}
                    onChange={(ev) => handleAddressFormChange('first_name', ev.target.value)}
                    className="w-full bg-gray-50/50 border border-gray-100 rounded-[14px] px-5 py-3.5 focus:outline-none focus:border-orange-200 text-[14px] font-medium transition-all"
                  />
                </div>
                <div className="space-y-1.5 text-left">
                  <label className="text-[12px] font-black uppercase tracking-wider text-gray-300 ml-1">Last name</label>
                  <input
                    type="text"
                    placeholder="Last name"
                    value={addressForm.last_name}
                    onChange={(ev) => handleAddressFormChange('last_name', ev.target.value)}
                    className="w-full bg-gray-50/50 border border-gray-100 rounded-[14px] px-5 py-3.5 focus:outline-none focus:border-orange-200 text-[14px] font-medium transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[12px] font-black uppercase tracking-wider text-gray-300 ml-1">Phone</label>
                <input
                  type="tel"
                  placeholder="Mobile number"
                  required
                  value={addressForm.mobile_no}
                  onChange={(ev) => handleAddressFormChange('mobile_no', ev.target.value)}
                  className="w-full bg-gray-50/50 border border-gray-100 rounded-[14px] px-5 py-3.5 focus:outline-none focus:border-orange-200 text-[14px] font-medium transition-all"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[12px] font-black uppercase tracking-wider text-gray-300 ml-1">Flat / building / landmark</label>
                <input
                  type="text"
                  placeholder="Apartment, suite, etc."
                  required
                  value={addressForm.apartment_address}
                  onChange={(ev) => handleAddressFormChange('apartment_address', ev.target.value)}
                  className="w-full bg-gray-50/50 border border-gray-100 rounded-[14px] px-5 py-3.5 focus:outline-none focus:border-orange-200 text-[14px] font-medium transition-all"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[12px] font-black uppercase tracking-wider text-gray-300 ml-1">Street</label>
                <input
                  type="text"
                  placeholder="Street address"
                  required
                  value={addressForm.street_address}
                  onChange={(ev) => handleAddressFormChange('street_address', ev.target.value)}
                  className="w-full bg-gray-50/50 border border-gray-100 rounded-[14px] px-5 py-3.5 focus:outline-none focus:border-orange-200 text-[14px] font-medium transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-[12px] font-black uppercase tracking-wider text-gray-300 ml-1">City</label>
                  <input
                    type="text"
                    required
                    value={addressForm.city}
                    onChange={(ev) => handleAddressFormChange('city', ev.target.value)}
                    className="w-full bg-gray-50/50 border border-gray-100 rounded-[14px] px-5 py-3.5 focus:outline-none focus:border-orange-200 text-[14px] font-medium transition-all"
                  />
                </div>
                <div className="space-y-1.5 text-left">
                  <label className="text-[12px] font-black uppercase tracking-wider text-gray-300 ml-1">State</label>
                  <input
                    type="text"
                    required
                    value={addressForm.state}
                    onChange={(ev) => handleAddressFormChange('state', ev.target.value)}
                    className="w-full bg-gray-50/50 border border-gray-100 rounded-[14px] px-5 py-3.5 focus:outline-none focus:border-orange-200 text-[14px] font-medium transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-[12px] font-black uppercase tracking-wider text-gray-300 ml-1">PIN / ZIP</label>
                  <input
                    type="text"
                    required
                    value={addressForm.zip}
                    onChange={(ev) => handleAddressFormChange('zip', ev.target.value)}
                    className="w-full bg-gray-50/50 border border-gray-100 rounded-[14px] px-5 py-3.5 focus:outline-none focus:border-orange-200 text-[14px] font-medium transition-all"
                  />
                </div>
                <div className="space-y-1.5 text-left">
                  <label className="text-[12px] font-black uppercase tracking-wider text-gray-300 ml-1">Country</label>
                  <input
                    type="text"
                    value={addressForm.country}
                    onChange={(ev) => handleAddressFormChange('country', ev.target.value)}
                    className="w-full bg-gray-50/50 border border-gray-100 rounded-[14px] px-5 py-3.5 focus:outline-none focus:border-orange-200 text-[14px] font-medium transition-all"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer text-left pt-2">
                <input
                  type="checkbox"
                  checked={addressForm.default}
                  onChange={(ev) => handleAddressFormChange('default', ev.target.checked)}
                  className="w-5 h-5 accent-[#f47a4d] rounded-md"
                />
                <span className="text-[13px] font-bold text-gray-600">Save as default address</span>
              </label>

              <div className="flex items-center space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="flex-1 py-3.5 border border-gray-100 text-gray-400 rounded-full font-bold text-[14px] hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addressFormSubmitting}
                  className="flex-1 py-3.5 bg-[#f47a4d] text-white rounded-full font-black text-[14px] shadow-lg shadow-orange-100 hover:bg-[#e3693c] transition-all disabled:opacity-60"
                >
                  {addressFormSubmitting ? 'Saving…' : modalMode === 'add' ? 'Save address' : 'Update address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
