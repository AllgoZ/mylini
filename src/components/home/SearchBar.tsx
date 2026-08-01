'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full mt-4 px-4 md:hidden">
      <div className="flex items-center gap-2.5 bg-surface-2 border-[1.5px] border-border-soft rounded-full px-[18px] h-11 transition-all duration-[0.22s] focus-within:border-clay-soft focus-within:shadow-[0_0_0_3px_rgba(62,15,47,0.1)] focus-within:bg-canvas">
        <Search size={17} className="text-text-light shrink-0" strokeWidth={2} />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Pattupavadai, Ethnic Sets, Frocks..."
          className="flex-1 border-none bg-transparent outline-none font-body text-sm text-text placeholder:text-text-light"
        />
      </div>
    </form>
  );
}
