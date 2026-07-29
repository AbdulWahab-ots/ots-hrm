"use client";

import Image from "next/image";
import React from "react";
import Trash from "../../public/Trash.svg";
import CrossIcon from "../../public/Cross-icon.svg";

interface DeleteConfirmationModalProps {
  isOpen?: boolean;
  onCancel?: () => void;
  onConfirm?: () => void;
  isBulkDelete?: boolean;
  itemType?: string;
  TextMessage: string;
  isLoading?: boolean;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onCancel,
  onConfirm,
  isBulkDelete,
  itemType,
  TextMessage = "Company will be deleted, and unfortunately, you won't be able to get it back.",
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed bg-[var(--g-overlay)] inset-0 flex items-center justify-center z-100">
      <div className="bg-g-background-100 rounded-[var(--g-radius-md)] overflow-hidden w-[375px] sm:w-[404px] lg:w-[484px] relative shadow-geist-modal">
        <div
          className="absolute top-[0px] right-0 cursor-pointer focus-ring-geist rounded-[var(--g-radius-sm)]"
          onClick={onCancel}
        >
          <Image src={CrossIcon} alt="close icon" />
        </div>
        <div className="p-6">
          <Image src={Trash} alt="trash icon" />
          <h2 className="text-heading-20 text-g-gray-1000 mt-10">
            Are you sure?
          </h2>
          <p className="text-copy-14 w-[285px] text-g-gray-800 mt-2">
            {itemType || isBulkDelete
              ? "All selected Companies will be deleted, and unfortunately, you won't be able to get them back."
              : `${TextMessage}`}
          </p>
        </div>
        <div className="flex justify-end gap-6 p-6">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="text-g-gray-800 text-button-14 cursor-pointer hover:text-g-gray-1000 focus-ring-geist rounded-[var(--g-radius-sm)] px-2 py-1 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-g-red-700 text-white px-4 py-2 rounded-[var(--g-radius-sm)] cursor-pointer text-button-16 hover:bg-g-red-800 focus-ring-geist disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2 min-w-[96px]"
          >
            {isLoading ? (
              <svg
                className="animate-spin h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              isBulkDelete ? "Delete All" : "Delete"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
