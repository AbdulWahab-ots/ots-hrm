// "use client";

// import React from 'react';
// import { FiEdit } from 'react-icons/fi';
// import { IoTrashOutline } from 'react-icons/io5';
// import { JSX } from 'react/jsx-dev-runtime';
// import Loading from './Loading';
// import { capitalizeString } from '@/utils/helper';

// type Column = {
//   header: string | JSX.Element;
//   accessor: string;
//   render?: (
//     value: any,
//     row: any,
//     isSelected?: boolean,
//     toggleRow?: (id: number) => void
//   ) => JSX.Element;
// };

// type StatusConfig = {
//   type: 'active-inactive' | 'approved-declined' | 'custom';
//   activeClass?: string;
//   inactiveClass?: string;
// };

// type ActionsConfig = {
//   onEdit?: (row: any) => void;
//   onDelete?: (row: any) => void;
//   editIcon?: JSX.Element;
//   deleteIcon?: JSX.Element;
// };

// type DataTableProps = {
//   columns: Column[];
//   data: any[];
//   showStatus?: boolean;
//   statusConfig?: StatusConfig;
//   showActions?: boolean;
//   isLoading?: boolean;
//   actionsConfig?: ActionsConfig;
// };

// const DataTable: React.FC<DataTableProps> = ({
//   columns,
//   data,
//   showStatus = false,
//   statusConfig = { type: 'active-inactive' },
//   showActions = false,
//   isLoading = false,
//   actionsConfig = {}
// }) => {

//   const defaultEditIcon = (
//     <div className="cursor-pointer">
//       <FiEdit size={16} />
//     </div>
//   );

//   const defaultDeleteIcon = (
//     <div className="cursor-pointer">
//       <IoTrashOutline size={16} />
//     </div>
//   );

//   const renderStatus = (status: string) => {
//     let badgeClass = '';
//     let displayText = status;

//     if (statusConfig.type === 'active-inactive') {
//       if (status.toLowerCase() === 'active') {
//         badgeClass = statusConfig.activeClass || 'bg-green-100 text-green-800';
//         displayText = 'Active';
//       } else {
//         badgeClass = statusConfig.inactiveClass || 'bg-red-100 text-red-800';
//         displayText = 'Inactive';
//       }
//     } else if (statusConfig.type === 'approved-declined') {
//       if (status.toLowerCase() === 'approved') {
//         badgeClass = statusConfig.activeClass || 'bg-green-100 text-green-800';
//         displayText = 'Approved';
//       } else {
//         badgeClass = statusConfig.inactiveClass || 'bg-red-100 text-red-800';
//         displayText = 'Declined';
//       }
//     } else if (statusConfig.type === 'custom') {
//       badgeClass = 'bg-blue-100 text-blue-800';
//       displayText = status;
//     }

//     return (
//       <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClass}`}>
//         {displayText}
//       </span>
//     );
//   };

//   const renderActions = (row: any) => {
//     return (
//       <div className="flex items-center space-x-2">
//         {actionsConfig.onEdit && (
//           <button
//             onClick={() => actionsConfig.onEdit!(row)}
//           >
//             {actionsConfig.editIcon || defaultEditIcon}
//           </button>
//         )}
//         {actionsConfig.onDelete && (
//           <button
//             onClick={() => actionsConfig.onDelete!(row)}
//           >
//             {actionsConfig.deleteIcon || defaultDeleteIcon}
//           </button>
//         )}
//       </div>
//     );
//   };

//   const allColumns = [
//     ...columns,
//     ...(showStatus ? [{
//       header: 'Status',
//       accessor: 'status',
//       render: (value: string) => renderStatus(value)
//     }] : []),
//     ...(showActions ? [{
//       header: 'Actions',
//       accessor: 'actions',
//       render: (_: any, row: any) => renderActions(row)
//     }] : [])
//   ];

//   return (
//     <div className="overflow-x-auto rounded-2xl">
//       <table className="w-full">
//         <thead className="bg-gray-200">
//           <tr>
//             {allColumns.map((col) => (
//               <th
//                 key={col.accessor}
//                 className="py-3 px-6 text-left text-sm font-bold text-gray-900 tracking-wider border-b border-gray-300"
//               >
//                 {col.header}
//               </th>
//             ))}
//           </tr>
//         </thead>
//         <tbody className="bg-white divide-y divide-gray-200">
//           {!isLoading && data?.length > 0 ? data.map((row, idx) => (
//             <tr key={idx} className="hover:bg-gray-50">
//               {allColumns.map((col) => (
//                 <td
//                   key={col.accessor}
//                   className="py-4 px-6 whitespace-nowrap text-sm text-gray-500"
//                 >
//                   {col.render ? col.render(row[col.accessor], row) : col.accessor === "status" ? capitalizeString(row[col.accessor]) : row[col.accessor]}
//                 </td>
//               ))}
//             </tr>
//           )) : isLoading ? <tr><td colSpan={allColumns.length}>
//             <Loading />
//           </td></tr> : <tr><td colSpan={allColumns.length} className="p-4 text-center"><p>No data found.</p></td></tr>}
//         </tbody>
//       </table>
//     </div>
//   );
// };

// export default DataTable;
