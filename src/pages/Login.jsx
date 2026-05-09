import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { loginWithPassword } from '../api/auth';
import { setCredentials } from '../store/slices/authSlice';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const data = await loginWithPassword({
        identifier: identifier.trim(),
        password,
      });
      dispatch(
        setCredentials({
          user: {
            email: data.email,
            username: data.username || data.email,
            role: 'customer',
          },
          tokens: data.tokens,
        })
      );
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to login.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = () => {
    console.log('Google Login clicked');
    // Implement Google Auth logic here
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f8fafc] px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md w-full space-y-4 md:space-y-8 bg-white p-6 md:p-10 rounded-[32px] shadow-xl shadow-gray-200/50 border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight mb-1 md:mb-2">Welcome Back</h2>
          <p className="text-sm md:text-base text-gray-500 font-medium">Please enter your details to sign in.</p>
        </div>

        <form className="mt-4 md:mt-8 space-y-4 md:space-y-6" onSubmit={handleLogin}>
          {error ? (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-2 md:py-3 text-xs md:text-sm text-red-700">
              {error}
            </div>
          ) : null}
          <div className="space-y-3 md:space-y-4">
            <div>
              <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1 md:mb-2 ml-1" htmlFor="identifier">
                Username
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-4 w-4 md:h-5 md:w-5 text-gray-400 group-focus-within:text-[#7c3aed] transition-colors" />
                </div>
                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 md:py-4 bg-gray-50 border-none rounded-2xl text-sm md:text-base text-gray-900 font-bold placeholder-gray-400 focus:ring-2 focus:ring-[#7c3aed]/20 transition-all outline-none"
                  placeholder="Enter username"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1 md:mb-2 ml-1">
                <label className="block text-xs md:text-sm font-bold text-gray-700" htmlFor="password">
                  Password
                </label>
                <Link to="/forgot-password" size="sm" className="text-[10px] md:text-xs font-black text-[#7c3aed] hover:underline uppercase tracking-wider">
                  Forgot?
                </Link>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 md:h-5 md:w-5 text-gray-400 group-focus-within:text-[#7c3aed] transition-colors" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-12 py-3 md:py-4 bg-gray-50 border-none rounded-2xl text-sm md:text-base text-gray-900 font-bold placeholder-gray-400 focus:ring-2 focus:ring-[#7c3aed]/20 transition-all outline-none"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 md:h-5 md:w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  ) : (
                    <Eye className="h-4 w-4 md:h-5 md:w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 md:h-5 md:w-5 text-[#7c3aed] focus:ring-[#7c3aed] border-gray-300 rounded-lg cursor-pointer"
            />
            <label htmlFor="remember-me" className="ml-2 md:ml-3 block text-xs md:text-sm font-bold text-gray-500 cursor-pointer">
              Keep me signed in
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="group relative w-full flex justify-center py-3 md:py-4 px-4 border border-transparent rounded-2xl text-white bg-gray-900 hover:bg-black transition-all duration-300 font-black text-base md:text-lg shadow-xl shadow-gray-200"
          >
            {submitting ? 'Signing in...' : 'Sign In'}
            <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <div className="relative my-4 md:my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-100"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-400 font-bold uppercase tracking-[0.2em] text-[8px] md:text-[10px]">Or continue with</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:gap-4">
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center py-3 md:py-4 px-4 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 font-bold text-sm md:text-base text-gray-700 shadow-sm group"
          >
            <svg className="h-4 w-4 md:h-5 md:w-5 mr-3 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google
          </button>
        </div>

        <p className="mt-4 md:mt-8 text-center text-xs md:text-sm font-bold text-gray-500">
          Don't have an account?{' '}
          <Link to="/signup" className="text-[#7c3aed] hover:underline font-black">
            Sign up for free
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;

