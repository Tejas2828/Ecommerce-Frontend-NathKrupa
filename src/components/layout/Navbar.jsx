import React from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  ShoppingCart, 
  Heart, 
  ChevronDown, 
  LayoutDashboard,
  User,
  LogOut
} from 'lucide-react';
import { logoutWithRefresh } from '../../api/auth';
import { clearCredentials } from '../../store/slices/authSlice';

const Navbar = () => {
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
      <div className="max-w-[1400px] mx-auto px-8 h-[72px] flex items-center justify-between">
        {/* Left Side: Logo and Main Menu */}
        <div className="flex items-center h-full">
          <Link to="/" className="text-2xl font-black tracking-tighter text-gray-900 mr-12 transition-transform hover:scale-105">
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
        <div className="flex items-center space-x-8">
          {/* Garage Pill Button */}
          <Link to={auth.isAuthenticated ? '/account' : '/login'} className="hidden sm:flex items-center px-7 py-3 border border-gray-200 rounded-full hover:bg-gray-50 transition-all hover:shadow-md">
            <LayoutDashboard className="w-5 h-5 mr-3 text-gray-600" />
            <span className="text-[15px] font-bold text-gray-700">Garage</span>
          </Link>

          <div className="flex items-center space-x-3">
            <Link to="/cart" className="relative p-3 text-gray-700 hover:text-blue-600 transition-colors">
              <ShoppingCart className="w-6 h-6 stroke-[1.5]" />
              {totalQuantity > 0 && (
                <span className="absolute top-1 right-1 bg-blue-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center ring-2 ring-white">
                  {totalQuantity}
                </span>
              )}
            </Link>

            <button className="p-3 text-gray-700 hover:text-red-500 transition-colors">
              <Heart className="w-6 h-6 stroke-[1.5]" />
            </button>

            {auth.isAuthenticated ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center px-4 py-2 rounded-full border border-gray-200 bg-gray-50">
                  <User className="w-4 h-4 text-gray-600 mr-2" />
                  <span className="text-sm font-bold text-gray-700">
                    {auth.user?.username || auth.user?.email || 'Customer'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-3 text-gray-700 hover:text-red-600 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-6 h-6 stroke-[1.5]" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-bold text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 text-sm font-bold text-white bg-gray-900 rounded-full hover:bg-black transition-colors"
                >
                  Signup
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
