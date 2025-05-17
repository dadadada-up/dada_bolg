"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function Search() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  
  const toggleSearch = () => {
    setIsOpen(!isOpen);
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const query = formData.get('query')?.toString();
    
    if (query) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
      setIsOpen(false);
    }
  };
  
  return (
    <div className="relative">
      <button 
        className="p-2 rounded-md hover:bg-secondary" 
        aria-label="搜索"
        onClick={toggleSearch}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="lucide lucide-search h-5 w-5"
        >
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.3-4.3"></path>
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-background border rounded-md shadow-md z-50">
          <form onSubmit={handleSearch} className="p-2">
            <div className="flex">
              <input 
                name="query"
                type="text" 
                className="flex-1 px-3 py-1 border rounded-l-md focus:outline-none" 
                placeholder="搜索文章..."
                autoFocus
              />
              <button 
                type="submit" 
                className="px-3 py-1 bg-primary text-primary-foreground rounded-r-md"
              >
                搜索
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
} 