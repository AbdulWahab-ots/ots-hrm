"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import CrossIcon from "../../public/Cross-icon.svg";
import SearchInput from "./form/SearchInput";
import { User } from "lucide-react";

export interface EmployeePickerOption {
  id: string;
  name: string;
  subtitle?: string;
}

interface EmployeePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: EmployeePickerOption[];
  isLoading?: boolean;
  onSelect: (employee: EmployeePickerOption) => void;
}

const EmployeePickerModal: React.FC<EmployeePickerModalProps> = ({
  isOpen,
  onClose,
  employees,
  isLoading = false,
  onSelect,
}) => {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return employees;
    const q = search.trim().toLowerCase();
    return employees.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.subtitle?.toLowerCase().includes(q)
    );
  }, [employees, search]);

  if (!isOpen) return null;

  return (
    <div className="fixed bg-[var(--g-overlay)] inset-0 flex items-center justify-center z-100">
      <div className="bg-g-background-100 rounded-[var(--g-radius-md)] overflow-hidden w-[375px] sm:w-[420px] relative shadow-geist-modal">
        <div
          className="absolute top-[0px] right-0 cursor-pointer focus-ring-geist rounded-[var(--g-radius-sm)]"
          onClick={onClose}
        >
          <Image src={CrossIcon} alt="close icon" />
        </div>
        <div className="p-6">
          <h2 className="text-heading-20 text-g-gray-1000 mb-4">
            Refresh Attendance — Select Employee
          </h2>

          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by name..."
            id="employee-picker-search"
            name="employeePickerSearch"
          />

          <div className="mt-4 max-h-[280px] overflow-y-auto -mx-2">
            {isLoading ? (
              <p className="text-copy-14 text-g-gray-800 px-2 py-4 text-center">
                Loading employees…
              </p>
            ) : filtered.length === 0 ? (
              <p className="text-copy-14 text-g-gray-800 px-2 py-4 text-center">
                No employees found.
              </p>
            ) : (
              filtered.map((employee) => (
                <button
                  key={employee.id}
                  onClick={() => onSelect(employee)}
                  className="w-full flex items-center gap-3 px-2 py-2 rounded-[var(--g-radius-sm)] cursor-pointer hover:bg-g-gray-alpha-100 text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-g-gray-100 border border-g-gray-alpha-400 flex items-center justify-center shrink-0">
                    <User size={14} className="text-g-gray-700" />
                  </div>
                  <div>
                    <div className="text-copy-14 font-medium text-g-gray-1000">
                      {employee.name}
                    </div>
                    {employee.subtitle && (
                      <div className="text-label-13 text-g-gray-800">
                        {employee.subtitle}
                      </div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
        <div className="flex justify-end gap-6 p-6 pt-0">
          <button
            onClick={onClose}
            className="text-g-gray-800 text-button-14 cursor-pointer hover:text-g-gray-1000 focus-ring-geist rounded-[var(--g-radius-sm)] px-2 py-1"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeePickerModal;
