// "use client";
// import React from "react";
// import { FiTrash2 } from "react-icons/fi";

// interface BulkDeleteButtonProps {
//     selectedRowsLength: number;
//     tableBodyHeight: number;
//     onDeleteClick: () => void;
// }

// const BulkDeleteButton: React.FC<BulkDeleteButtonProps> = ({
//     selectedRowsLength,
//     tableBodyHeight,
//     onDeleteClick,
// }) => {
//     if (selectedRowsLength === 0) return null;

//     return (
//         <div
//             className="absolute top-[48px] right-0 flex items-center justify-center bg-white border-l border-[#E9EAEB] shadow-md z-10 transition-all duration-300"
//             style={{
//                 height: `${tableBodyHeight}px`,
//                 width: "60px",
//             }}
//         >
//             <button
//                 onClick={(e) => {
//                     e.stopPropagation();
//                     onDeleteClick();
//                 }}
//                 className="text-[#475467] cursor-pointer hover:text-red-600"
//             >
//                 <FiTrash2 size={16} />
//             </button>
//         </div>
//     );
// };

// export default BulkDeleteButton;

"use client";
import React from "react";
import { FiTrash2 } from "react-icons/fi";

interface BulkDeleteButtonProps {
    selectedRowsLength: number;
    tableBodyHeight?: number;
    onBulkDelete: () => void;
}

const BulkDeleteButton: React.FC<BulkDeleteButtonProps> = ({
    selectedRowsLength,
    tableBodyHeight = 400,
    onBulkDelete,
}) => {
    const isVisible = selectedRowsLength > 0;

    return (
        <div
            className={`absolute top-[48px] right-0 flex items-center justify-center bg-g-background-100 border-l border-g-gray-alpha-400 shadow-geist-card z-10 transition-[transform,opacity] duration-200 ease-[var(--g-ease-out)] ${
                isVisible
                    ? "translate-x-0 opacity-100"
                    : "translate-x-full opacity-0 pointer-events-none"
            }`}
            style={{
                height: `${tableBodyHeight}px`,
                width: "88px",
            }}
        >
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onBulkDelete();
                }}
                className="text-g-gray-900 cursor-pointer border flex items-center justify-center border-[var(--error-50)] rounded-[var(--g-radius-sm)] bg-[var(--error-100)] w-[52px] h-[52px] focus-ring-geist active:scale-[0.97] transition-transform duration-150 ease-[var(--g-ease-out)]"
            >
                <FiTrash2 color="red" size={16} />
            </button>
        </div>
    );
};

export default BulkDeleteButton;
