import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { resolveApiMediaUrl } from '../api/shop';

function CategoryIcon({ category }) {
  const iconUrl = resolveApiMediaUrl(category?.category_icon);
  if (iconUrl) {
    return (
      <img
        src={iconUrl}
        alt=""
        className="w-full h-full object-contain p-2"
      />
    );
  }
  return <CategoryIconFallback />;
}

function CategoryIconFallback() {
  return (
    <div className="w-full aspect-square rounded-full border-[8px] border-white bg-gray-200 shadow-md flex items-center justify-center overflow-hidden">
      <div className="w-full h-full border-4 border-gray-300 rounded-full flex items-center justify-center">
        <div className="w-1/3 h-1/3 rounded-full border-2 border-gray-400" />
      </div>
    </div>
  );
}

/**
 * @param {{ category: object, to: string, showSubcount?: boolean }} props
 */
export default function CategoryCard({ category, to, showSubcount = true }) {
  const childCount = category?.children_count ?? category?.children?.length ?? 0;
  const hasChildren = childCount > 0;

  return (
    <Link to={to} className="cursor-pointer group block text-left">
      <div className="aspect-square bg-gray-100 rounded-[20px] mb-4 flex items-center justify-center p-8 group-hover:bg-gray-200 transition-all duration-300 group-hover:scale-[1.02] relative overflow-hidden">
        <CategoryIcon category={category} />
        {showSubcount && hasChildren ? (
          <span className="absolute top-3 right-3 bg-white/90 text-[11px] font-bold text-[#6b7280] px-2 py-1 rounded-full shadow-sm">
            {childCount} sub
          </span>
        ) : null}
        {hasChildren ? (
          <span className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-white shadow flex items-center justify-center text-[#f47a4d] opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronRight className="w-4 h-4" />
          </span>
        ) : null}
      </div>
      <h4 className="text-[15px] font-bold text-[#111827] group-hover:text-[#f47a4d] transition-colors leading-snug px-1">
        {category?.title || 'Category'}
      </h4>
    </Link>
  );
}
