import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-100 pt-12 md:pt-16 pb-8 md:pb-12">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10">
        {/* Brand Logo / Text */}
        <div className="mb-10 md:mb-16 text-center lg:text-left">
          <h1 className="text-[28px] md:text-[38px] font-black tracking-tighter text-gray-900">NathKrupaERP</h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 md:gap-12">
          {/* Marketplace Column */}
          <div className="lg:col-span-2 text-center sm:text-left">
            <h3 className="text-[#9ca3af] text-[13px] md:text-[15px] font-bold mb-4 md:mb-8 tracking-wide uppercase">Marketplace</h3>
            <ul className="space-y-3 md:space-y-4">
              {['Home', 'Garage', 'Categories', 'OEM Catalogue'].map((link) => (
                <li key={link}>
                  <Link to="/" className="text-[14px] md:text-[15px] font-medium text-[#374151] hover:text-[#f47a4d] transition-colors">
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Column */}
          <div className="lg:col-span-3 text-center sm:text-left">
            <h3 className="text-[#9ca3af] text-[13px] md:text-[15px] font-bold mb-4 md:mb-8 tracking-wide uppercase">Support</h3>
            <ul className="space-y-3 md:space-y-4">
              {['Bulk Orders', 'Supplier', 'Help Center'].map((link) => (
                <li key={link}>
                  <Link to="/" className="text-[14px] md:text-[15px] font-medium text-[#374151] hover:text-[#f47a4d] transition-colors">
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Map Area */}
          <div className="lg:col-span-7 relative">
            <div className="rounded-[24px] overflow-hidden h-[240px] md:h-[300px] border border-gray-100 shadow-sm relative group">
              <img 
                src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=1200" 
                alt="Map View" 
                className="w-full h-full object-cover grayscale opacity-20"
              />
              
              {/* Fake Map Elements to mimic image */}
              <div className="absolute inset-0 p-4 md:p-8 flex items-center justify-center">
                 <div className="relative">
                    <div className="bg-white px-3 md:px-4 py-2 rounded-lg shadow-xl border border-gray-100 flex items-center space-x-2 md:space-x-3 max-w-[240px] md:max-w-[280px]">
                      <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-red-500 flex items-center justify-center shrink-0">
                        <div className="w-1.5 h-1.5 md:w-2 h-2 bg-white rounded-full" />
                      </div>
                      <p className="text-[11px] md:text-[13px] font-bold text-gray-800 leading-tight">
                        Nathkrupa Body Builders And Auto Accessorie
                      </p>
                    </div>
                 </div>
              </div>

              {/* View On Map Button */}
              <div className="absolute bottom-4 md:bottom-6 right-4 md:right-6">
                <button className="bg-[#f47a4d] text-white px-6 md:px-8 py-2.5 md:py-3.5 rounded-full font-bold text-sm md:text-base flex items-center space-x-2 hover:bg-[#e3693c] transition-all shadow-lg hover:shadow-orange-200/50">
                  <span>View On Map</span>
                  <span className="text-lg md:text-xl leading-none">&rarr;</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Contact Bar */}
        <div className="mt-12 md:mt-20 pt-8 md:pt-10 border-t border-gray-100">
          <div className="flex flex-col lg:flex-row items-center justify-between space-y-6 lg:space-y-0 text-[12px] md:text-[14px] font-bold text-[#6b7280]">
            <div className="flex flex-wrap justify-center lg:justify-start gap-4 md:gap-8">
              <span className="hover:text-gray-900 transition-colors">© 2024 NathKrupaERP</span>
              <span className="hover:text-gray-900 transition-colors">Privacy Policy</span>
              <span className="hover:text-gray-900 transition-colors">Terms of Service</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-6 md:space-x-8">
              <span className="hover:text-gray-900 transition-colors whitespace-nowrap">+91 9850523224</span>
              <span className="hover:text-gray-900 transition-colors whitespace-nowrap">+91 7038929499</span>
              <span className="hover:text-gray-900 transition-colors font-medium break-all text-center">contact@nathkrupabody.com</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};


export default Footer;
