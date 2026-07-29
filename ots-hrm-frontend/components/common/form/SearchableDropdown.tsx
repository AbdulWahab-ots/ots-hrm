// "use client";

// import React, { useState, useRef, useEffect } from "react";
// import { DropdownProps } from "@/utils/types";
// import { Check } from "lucide-react";

// interface SearchableDropdownProps extends DropdownProps {
//   searchable?: boolean;
// }

// const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
//   id,
//   name,
//   label,
//   options,
//   className = "",
//   value,
//   onChange = () => {},
//   placeholder = "Select",
//   searchable = false,
// }) => {
//   const [isOpen, setIsOpen] = useState(false);
//   const [selectedLabel, setSelectedLabel] = useState(placeholder);
//   const [searchTerm, setSearchTerm] = useState("");
//   const dropdownRef = useRef<HTMLDivElement>(null);

//   // Update selected label when value or options change
//   useEffect(() => {
//     if (value) {
//       const selectedOption = options.find((option) => option.value === value);
//       setSelectedLabel(selectedOption?.label || placeholder);
//     } else {
//       setSelectedLabel(placeholder);
//     }
//   }, [value, options, placeholder]);

//   // Handle clicks outside to close dropdown
//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (
//         dropdownRef.current &&
//         !dropdownRef.current.contains(event.target as Node)
//       ) {
//         setIsOpen(false);
//         setSearchTerm(""); // Clear search when closing
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, []);

//   // Filter options based on search term (case-insensitive)
//   const filteredOptions = searchTerm
//     ? options.filter((option) =>
//         option.label.toLowerCase().includes(searchTerm.toLowerCase())
//       )
//     : options;

//   const handleOptionClick = (value: string, label: string) => {
//     onChange?.({
//       target: {
//         value,
//         name: name || "",
//       },
//     } as React.ChangeEvent<HTMLSelectElement>);
//     setSelectedLabel(label);
//     setIsOpen(false);
//     setSearchTerm(""); // Clear search on selection
//   };

//   const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setSearchTerm(e.target.value);
//   };

//   const renderOption = (
//     option: { value: string; label: string },
//     isSelected: boolean
//   ) => (
//     <div className="flex items-center justify-between">
//       <span>{option.label}</span>
//       {isSelected && <Check className="h-4 w-4 text-blue-500" />}
//     </div>
//   );

//   return (
//     <div className={`relative ${className}`} ref={dropdownRef}>
//       {label && (
//         <label
//           htmlFor={id}
//           className="block text-sm font-medium text-gray-700 mb-1"
//         >
//           {label}
//         </label>
//       )}

//       <div className="relative">
//         <button
//           type="button"
//           className={`w-full px-4 py-2 text-left bg-white border border-[#597BE84D] rounded-[12px] focus:outline-none flex items-center justify-between
//                      ${
//                        isOpen
//                          ? "text-[#5D6A9C] shadow-[0_0_0_4px_rgba(89,123,232,0.1)]"
//                          : "text-gray-700"
//                      }`}
//           onClick={() => setIsOpen(!isOpen)}
//           aria-haspopup="listbox"
//           aria-expanded={isOpen}
//         >
//           <span className={`truncate ${!value ? "text-gray-400" : ""}`}>
//             {selectedLabel}
//           </span>
//           <svg
//             className={`h-5 w-5 text-gray-400 transform transition-transform ${
//               isOpen ? "rotate-180" : ""
//             }`}
//             xmlns="http://www.w3.org/2000/svg"
//             viewBox="0 0 20 20"
//             fill="currentColor"
//             aria-hidden="true"
//           >
//             <path
//               fillRule="evenodd"
//               d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
//               clipRule="evenodd"
//             />
//           </svg>
//         </button>

//         {isOpen && (
//           <div className="absolute z-10 mt-1 w-full border-[1px] border-[#E9EAEB] bg-white shadow-lg rounded-[12px] py-1 text-base overflow-auto focus:outline-none sm:text-sm">
//             {searchable && (
//               <input
//                 type="text"
//                 value={searchTerm}
//                 onChange={handleSearchChange}
//                 placeholder="Search..."
//                 className="w-full px-4 py-2 border-b border-[#E9EAEB] focus:outline-none"
//               />
//             )}
//             {filteredOptions.length > 0 ? (
//               <ul role="listbox" aria-labelledby={id}>
//                 {filteredOptions.map((option) => {
//                   const isSelected = value === option.value;
//                   return (
//                     <li
//                       key={option.value}
//                       className={`px-4 py-2 cursor-pointer hover:bg-[#597BE80D] ${
//                         isSelected
//                           ? "bg-[#597BE80D] text-[#5D6A9C]"
//                           : "text-gray-900"
//                       }`}
//                       onClick={() =>
//                         handleOptionClick(option.value, option.label)
//                       }
//                       role="option"
//                       aria-selected={isSelected}
//                     >
//                       {renderOption(option, isSelected)}
//                     </li>
//                   );
//                 })}
//               </ul>
//             ) : (
//               <div className="px-4 py-2 text-gray-500">No results found</div>
//             )}
//           </div>
//         )}
//       </div>

//       <select
//         id={id}
//         name={name}
//         value={value}
//         onChange={(e) => onChange?.(e)}
//         className="hidden"
//         aria-hidden="true"
//       >
//         <option value="">{placeholder}</option>
//         {options.map((option) => (
//           <option key={option.value} value={option.value}>
//             {option.label}
//           </option>
//         ))}
//       </select>
//     </div>
//   );
// };

// export default SearchableDropdown;

"use client";

import React, { useState, useRef, useEffect } from "react";
import { DropdownProps } from "@/utils/types";
import { Check } from "lucide-react";

interface SearchableDropdownProps extends DropdownProps {
  searchable?: boolean;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  id,
  name,
  label,
  options,
  className = "",
  value,
  onChange = () => {},
  placeholder = "Select",
  searchable = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState(placeholder);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Update selected label when value or options change
  useEffect(() => {
    if (value) {
      const selectedOption = options.find((option) => option.value === value);
      setSelectedLabel(selectedOption?.label || placeholder);
    } else {
      setSelectedLabel(placeholder);
    }
  }, [value, options, placeholder]);

  // Handle clicks outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm(""); // Clear search when closing
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filter options based on search term (case-insensitive)
  const filteredOptions = searchTerm
    ? options.filter((option) =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  // Show only first 10 options
  const displayedOptions = filteredOptions.slice(0, 10);

  const handleOptionClick = (value: string, label: string) => {
    onChange?.({
      target: {
        value,
        name: name || "",
      },
    } as React.ChangeEvent<HTMLSelectElement>);
    setSelectedLabel(label);
    setIsOpen(false);
    setSearchTerm(""); // Clear search on selection
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const renderOption = (
    option: { value: string; label: string },
    isSelected: boolean
  ) => (
    <div className="flex items-center justify-between">
      <span>{option.label}</span>
      {isSelected && <Check className="h-4 w-4 text-g-blue-700" />}
    </div>
  );

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label
          htmlFor={id}
          className="block text-label-14 font-medium text-g-gray-900 mb-1"
        >
          {label}
        </label>
      )}

      <div className="relative">
        <button
          type="button"
          className={`w-full h-10 px-3 text-left bg-g-background-100 border border-g-gray-alpha-400 rounded-[var(--g-radius-sm)] focus:outline-none focus-ring-geist flex items-center justify-between
                     ${
                       isOpen
                         ? "text-g-gray-800"
                         : "text-g-gray-800"
                     }`}
          onClick={() => setIsOpen(!isOpen)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className={`truncate ${!value ? "text-g-gray-700" : ""}`}>
            {selectedLabel}
          </span>
          <svg
            className={`h-5 w-5 text-g-gray-700 transform transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute z-10 mt-1 w-full border border-g-gray-alpha-400 bg-g-background-100 shadow-geist-menu rounded-[var(--g-radius-md)] py-1 text-base overflow-auto focus:outline-none sm:text-sm">
            {searchable && (
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search..."
                className="w-full px-4 py-2 border-b border-g-gray-alpha-400 focus:outline-none"
              />
            )}
            {displayedOptions.length > 0 ? (
              <ul role="listbox" aria-labelledby={id}>
                {displayedOptions.map((option) => {
                  const isSelected = value === option.value;
                  return (
                    <li
                      key={option.value}
                      className={`px-4 py-2 cursor-pointer hover:bg-g-gray-alpha-100 ${
                        isSelected
                          ? "bg-g-blue-100 text-g-blue-700"
                          : "text-g-gray-900"
                      }`}
                      onClick={() =>
                        handleOptionClick(option.value, option.label)
                      }
                      role="option"
                      aria-selected={isSelected}
                    >
                      {renderOption(option, isSelected)}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="px-4 py-2 text-g-gray-700">No results found</div>
            )}
          </div>
        )}
      </div>

      <select
        id={id}
        name={name}
        value={value}
        onChange={(e) => onChange?.(e)}
        className="hidden"
        aria-hidden="true"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default SearchableDropdown;
