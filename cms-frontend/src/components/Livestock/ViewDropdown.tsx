import { useEffect, useRef, useState } from 'react';

interface ViewDropdownInterface {
  viewType: 'day' | 'week' | 'month';
  setViewType: (v: 'day' | 'week' | 'month') => void;
}

const ViewDropdown = ({ viewType, setViewType }: ViewDropdownInterface) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const options = [
    { label: 'Day', value: 'day' },
    { label: 'Week', value: 'week' },
    { label: 'Month', value: 'month' },
  ];

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative inline-block text-left z-50" ref={dropdownRef}>
      <div>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="inline-flex w-28 justify-center gap-x-5 rounded-sm bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 border border-gray-100 shadow-xs hover:bg-gray-10 hover:shadow-md focus:outline-none focus:ring-1 focus:ring-gray-300"
          id="menu-button">
          {options.find((opt) => opt.value === viewType)?.label}
          <svg
            className="mr-1 h-5 w-5 text-gray-700"
            viewBox="0 0 20 20"
            fill="currentColor">
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.293l3.71-4.06a.75.75 0 111.08 1.04l-4.25 4.65a.75.75 0 01-1.08 0l-4.25-4.65a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {open && (
        <div
          className="absolute right-0 mt-2 w-36 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none"
          role="menu">
          <div className="py-0.5">
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setViewType(opt.value as 'day' | 'week' | 'month');
                  setOpen(false);
                }}
                className={`block w-full text-left px-4 py-2 text-sm ${
                  viewType === opt.value
                    ? 'bg-gray-100 text-gray-700 font-semibold'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewDropdown;
