import Image from "next/image";
import React, { useState } from "react";
import { IoSearchOutline } from "react-icons/io5";

interface SearchInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  id?: string;
  name?: string;
  topbar?: boolean;
}

const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = "Search...",
  value = "",
  onChange,
  className = "",
  id,
  name,
  topbar = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value);
  };

  return (
    <div className={`relative  w-auto    ${className}`}>
      <div
        className={`
          flex items-center h-10 px-3 w-full
          border border-g-gray-alpha-400 rounded-[var(--g-radius-sm)]
          transition-all duration-200 focus-within:focus-ring-geist
          ${isFocused ? "bg-g-background-100" : ""}
        `}
      >
        <IoSearchOutline className="text-g-gray-800 text-lg" />
        <input
          type="text"
          id={id}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`
            w-full outline-none ml-2
            text-g-gray-900 text-label-14
            placeholder:text-g-gray-700 bg-transparent
          `}
        />
        {topbar && (
          <Image
            src="/Text.svg"
            alt="Text icon"
            width={16}
            height={16}
            className="w-4 h-4 md:w-5 md:h-5"
          />
        )}
      </div>
    </div>
  );
};

export default SearchInput;
