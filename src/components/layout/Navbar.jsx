import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  ShoppingCart, 
  Heart, 
  ChevronDown, 
  LayoutDashboard,
  User,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { logoutWithRefresh } from '../../api/auth';
import { clearCredentials } from '../../store/slices/authSlice';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const totalQuantity = useSelector(state => state.cart.totalQuantity);
  const auth = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const handleLogout = async () => {
    try {
      await logoutWithRefresh({
        refreshToken: auth.tokens?.refresh,
        accessToken: auth.tokens?.access,
      });
    } catch {
      // ignore API failures and clear local auth anyway
    } finally {
      dispatch(clearCredentials());
    }
  };

  return (
    <nav className="bg-white border-b sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 h-[64px] md:h-[72px] flex items-center justify-between">
        {/* Left Side: Logo and Main Menu */}
        <div className="flex items-center h-full">
          <Link to="/" className="text-xl md:text-2xl font-black tracking-tighter text-gray-900 mr-4 md:mr-12 transition-transform hover:scale-105">
            NathKrupaERP
          </Link>
          
          <div className="hidden lg:flex items-center h-full border-l border-gray-100 pl-8 space-x-3">
            {/* Categories */}
            <div className="flex items-center px-4 cursor-pointer hover:text-blue-600 transition group py-2">
              <span className="text-[15px] font-semibold text-gray-700 group-hover:text-blue-600">Categories</span>
              <ChevronDown className="ml-1 w-4 h-4 text-gray-400 group-hover:text-blue-600" />
            </div>

            <div className="h-5 w-[1px] bg-gray-200 mx-3" />

            {/* OEM Catalogue */}
            <Link to="/oem-catalogue" className="flex items-center px-4 cursor-pointer hover:text-blue-600 transition group py-2">
              <span className="text-[15px] font-semibold text-gray-700 group-hover:text-blue-600">OEM Catalogue</span>
              <ChevronDown className="ml-1 w-4 h-4 text-gray-400 group-hover:text-blue-600" />
            </Link>

            <div className="h-5 w-[1px] bg-gray-200 mx-3" />

            {/* Why Choose Us */}
            <div className="flex items-center px-4 cursor-pointer hover:text-blue-600 transition group py-2">
              <span className="text-[15px] font-semibold text-gray-700 group-hover:text-blue-600">Why Choose Us?</span>
            </div>
          </div>
        </div>

        {/* Right Side: Action Icons */}
        <div className="flex items-center space-x-2 md:space-x-8">
          {/* Garage Pill Button - Responsive */}
          <Link 
            to={auth.isAuthenticated ? '/account' : '/login'} 
            className="hidden sm:flex items-center px-4 md:px-7 py-2 md:py-3 border border-gray-200 rounded-full hover:bg-gray-50 transition-all hover:shadow-md"
          >
            <LayoutDashboard className="w-4 h-4 md:w-5 md:h-5 mr-2 md:mr-3 text-gray-600" />
            <span className="text-[13px] md:text-[15px] font-bold text-gray-700">Garage</span>
          </Link>

          <div className="flex items-center space-x-1 md:space-x-3">
            <Link to="/cart" className="relative p-2 md:p-3 text-gray-700 hover:text-blue-600 transition-colors">
              <ShoppingCart className="w-5 h-5 md:w-6 md:h-6 stroke-[1.5]" />
              {totalQuantity > 0 && (
                <span className="absolute top-0 right-0 bg-blue-600 text-white text-[9px] md:text-[10px] font-bold rounded-full w-4 h-4 md:w-5 md:h-5 flex items-center justify-center ring-2 ring-white">
                  {totalQuantity}
                </span>
              )}
            </Link>

            <button className="hidden md:block p-3 text-gray-700 hover:text-red-500 transition-colors">
              <Heart className="w-6 h-6 stroke-[1.5]" />
            </button>

            {auth.isAuthenticated ? (
              <div className="flex items-center gap-1 md:gap-2">
                <div className="hidden sm:flex items-center px-3 md:px-4 py-1.5 md:py-2 rounded-full border border-gray-200 bg-gray-50">
                  <User className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-600 mr-2" />
                  <span className="text-xs md:text-sm font-bold text-gray-700 truncate max-w-[80px]">
                    {auth.user?.username || auth.user?.email || 'Customer'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-2 md:p-3 text-gray-700 hover:text-red-600 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5 md:w-6 md:h-6 stroke-[1.5]" />
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-1 md:gap-2">
                <Link
                  to="/login"
                  className="px-3 md:px-4 py-2 text-xs md:text-sm font-bold text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-bold text-white bg-gray-900 rounded-full hover:bg-black transition-colors"
                >
                  Signup
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button 
              className="lg:hidden p-2 text-gray-700 hover:text-blue-600 transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 animate-in slide-in-from-top duration-300">
          <div className="px-4 py-6 space-y-4">
            <Link to="/" onClick={() => setIsMenuOpen(false)} className="block px-4 py-3 text-lg font-bold text-gray-800 hover:bg-gray-50 rounded-xl transition-all">Categories</Link>
            <Link to="/oem-catalogue" onClick={() => setIsMenuOpen(false)} className="block px-4 py-3 text-lg font-bold text-gray-800 hover:bg-gray-50 rounded-xl transition-all">OEM Catalogue</Link>
            <Link to="/" onClick={() => setIsMenuOpen(false)} className="block px-4 py-3 text-lg font-bold text-gray-800 hover:bg-gray-50 rounded-xl transition-all">Why Choose Us?</Link>
            <Link to="/cart" onClick={() => setIsMenuOpen(false)} className="block px-4 py-3 text-lg font-bold text-gray-800 hover:bg-gray-50 rounded-xl transition-all">My Cart</Link>
            {!auth.isAuthenticated && (
              <div className="pt-4 grid grid-cols-2 gap-4">
                <Link 
                  to="/login" 
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-center py-3.5 border border-gray-200 rounded-2xl font-black text-gray-800"
                >
                  Login
                </Link>
                <Link 
                  to="/signup" 
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-center py-3.5 bg-gray-900 text-white rounded-2xl font-black shadow-lg"
                >
                  Signup
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

