// // src/utils/userColumns.ts
// import { ColumnDef } from "@tanstack/react-table";
// import { Users, InvitedUser } from "@/utils/company"; // Updated import
// import { FiEdit2, FiTrash2 } from "react-icons/fi";
// import CustomCheckbox from "@/components/common/form/CustomCheckbox";
// import { useDispatch } from "react-redux";
// import { AppDispatch } from "@/store/store";
// import { resendInviteAPI } from "@/services/superAdminServices";

// export const userColumns: ColumnDef<Users>[] = [
//   {
//     id: "selection",
//     header: "",
//     cell: (info: any) => {
//       const user = info.row.original as Users;
//       return (
//         <CustomCheckbox
//           checked={user.selected || false}
//           onChange={() =>
//             info.table.options.meta?.toggleRowSelection?.(user.id)
//           }
//           id={`checkbox-${user.id}`}
//         />
//       );
//     },
//     size: 40,
//   },

//   {
//     accessorKey: "userName",
//     header: "Username",
//     cell: (info: any) => {
//       const user = info.row.original as Users;
//       return (
//         <div className="font-medium text-nowrap text-gray-900">
//           {user.userName}
//         </div>
//       );
//     },
//   },
//   {
//     accessorKey: "email",
//     header: "Email",
//     cell: (info: any) => {
//       const user = info.row.original as Users;
//       return <div className="text-gray-500">{user.email}</div>;
//     },
//   },
//   {
//     accessorKey: "firstName",
//     header: "First Name",
//     cell: (info: any) => {
//       const user = info.row.original as Users;
//       return <div className="text-gray-500">{user.firstName || "N/A"}</div>;
//     },
//   },
//   {
//     accessorKey: "lastName",
//     header: "Last Name",
//     cell: (info: any) => {
//       const user = info.row.original as Users;
//       return <div className="text-gray-500">{user.lastName || "N/A"}</div>;
//     },
//   },
//   {
//     accessorKey: "active",
//     header: "Status",
//     cell: (info: any) => {
//       const status = info.getValue() ? "Active" : "Inactive";
//       const colorClass =
//         status === "Active"
//           ? "text-[#12B76A] bg-[#ECFDF3]"
//           : "text-[#B42318] bg-[#FEF3F2]";
//       return (
//         <span
//           className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}
//         >
//           {status}
//         </span>
//       );
//     },
//   },
//   {
//     id: "actions",
//     header: "",
//     cell: (info: any) => {
//       const user = info.row.original as Users;
//       const selectedRows = info.table.options.meta?.selectedRows || [];
//       const tableLength = info.table.getRowModel().rows.length;

//       if (selectedRows.length > 0) {
//         if (info.row.index === tableLength - 1) {
//           return (
//             <div className="flex justify-center w-full">
//               <button
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   info.table.options.meta?.setIsBulkDelete?.(true);
//                   info.table.options.meta?.setIsDeleteModalOpen?.(true);
//                 }}
//                 className="text-gray-500 cursor-pointer hover:text-red-600"
//               >
//                 <FiTrash2 size={16} />
//               </button>
//             </div>
//           );
//         }
//         return null;
//       }

//       return (
//         <div className="flex items-center  justify-end space-x-4">
//           <button
//             onClick={(e) => {
//               e.stopPropagation();
//               info.table.options.meta?.handleEdit?.(user);
//             }}
//             className="text-gray-500 cursor-pointer hover:text-green-600"
//           >
//             <FiEdit2 size={16} />
//           </button>
//           <button
//             onClick={(e) => {
//               e.stopPropagation();
//               info.table.options.meta?.setDepartmentToDelete?.(user.id);
//               info.table.options.meta?.setIsBulkDelete?.(false);
//               info.table.options.meta?.setIsDeleteModalOpen?.(true);
//             }}
//             className="text-gray-500 cursor-pointer hover:text-red-600"
//           >
//             <FiTrash2 size={16} />
//           </button>
//         </div>
//       );
//     },
//   },
// ];

// export const inviteColumns: ColumnDef<InvitedUser>[] = [
//   {
//     id: "selection",
//     header: "",
//     cell: (info: any) => {
//       const invite = info.row.original as InvitedUser;
//       return (
//         <CustomCheckbox
//           checked={invite.selected || false}
//           onChange={() =>
//             info.table.options.meta?.toggleRowSelection?.(invite.id)
//           }
//           id={`checkbox-${invite.id}`}
//         />
//       );
//     },
//     size: 40,
//   },
//   {
//     accessorKey: "email",
//     header: "Email",
//     cell: (info: any) => {
//       const invite = info.row.original as InvitedUser;
//       return <div className="text-gray-500">{invite.email}</div>;
//     },
//   },
//   {
//     accessorKey: "role",
//     header: "Role",
//     cell: (info: any) => {
//       const invite = info.row.original as InvitedUser;
//       return <div className="text-gray-500">{invite.role}</div>;
//     },
//   },
//   {
//     accessorKey: "status",
//     header: "Status",
//     cell: (info: any) => {
//       const status = info.getValue() as string;
//       const colorClass =
//         status === "PENDING"
//           ? "text-[#B54708] bg-[#FFFAEB]"
//           : "text-[#027A48] bg-[#ECFDF3]";
//       return (
//         <span
//           className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}
//         >
//           {status}
//         </span>
//       );
//     },
//   },
//   {
//     id: "actions",
//     header: "",
//     cell: (info: any) => {
//       const invite = info.row.original as InvitedUser;
//       const dispatch = useDispatch<AppDispatch>();
//       const selectedRows = info.table.options.meta?.selectedRows || [];
//       const tableLength = info.table.getRowModel().rows.length;

//       const handleResend = async () => {
//         try {
//           const success = await resendInviteAPI(dispatch, invite.id, {
//             email: invite.email,
//           });
//           if (success) {
//             info.table.options.meta?.refreshData?.();
//           }
//         } catch (error) {
//           console.error("Error resending invite:", error);
//           info.table.options.meta?.toastError?.(
//             "Failed to resend invite. Please try again."
//           );
//         }
//       };

//       if (selectedRows.length > 0) {
//         if (info.row.index === tableLength - 1) {
//           return (
//             <div className="flex justify-center w-full">
//               <button
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   info.table.options.meta?.setIsBulkDelete?.(true);
//                   info.table.options.meta?.setIsDeleteModalOpen?.(true);
//                 }}
//                 className="text-gray-500 cursor-pointer hover:text-red-600"
//               >
//                 <FiTrash2 size={16} />
//               </button>
//             </div>
//           );
//         }
//         return null;
//       }

//       return (
//         <div className="flex items-center space-x-4">
//           <button
//             onClick={handleResend}
//             className={`text-gray-500 cursor-pointer hover:text-blue-600 ${
//               invite.status === "ACCEPTED"
//                 ? "opacity-50 cursor-not-allowed"
//                 : ""
//             }`}
//             disabled={invite.status === "ACCEPTED"}
//           >
//             Resend Invite
//           </button>
//           <button
//             onClick={(e) => {
//               e.stopPropagation();
//               info.table.options.meta?.setDepartmentToDelete?.(invite.id);
//               info.table.options.meta?.setIsBulkDelete?.(false);
//               info.table.options.meta?.setIsDeleteModalOpen?.(true);
//             }}
//             className="text-gray-500 cursor-pointer hover:text-red-600"
//           >
//             <FiTrash2 size={16} />
//           </button>
//         </div>
//       );
//     },
//   },
// ];
// src/utils/userColumns.ts
import { ColumnDef } from "@tanstack/react-table";
import { Users, InvitedUser } from "@/utils/company";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import CustomCheckbox from "@/components/common/form/CustomCheckbox";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";
import { resendInviteAPI } from "@/services/superAdminServices";

export const userColumns: ColumnDef<Users | any>[] = [
  {
    id: "selection",
    header: "",
    cell: (info: any) => {
      const user = info.row.original as Users;
      return (
        <CustomCheckbox
          checked={user.selected || false}
          onChange={() =>
            info.table.options.meta?.toggleRowSelection?.(user.id)
          }
          id={`checkbox-${user.id}`}
        />
      );
    },
    size: 40,
  },
  {
    accessorKey: "userName",
    header: "Username",
    cell: (info: any) => {
      const user = info.row.original as Users;

      const firstNameInitial = user.firstName
        ? user.firstName.charAt(0).toUpperCase()
        : "";
      const lastNameInitial = user.lastName
        ? user.lastName.charAt(0).toUpperCase()
        : "";
      return (
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            {false ? (
              <img
                src={""}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                {`${firstNameInitial}${lastNameInitial}` ||
                  (user.email ? user.email.charAt(0).toUpperCase() : "")}
              </div>
            )}
          </div>
          <div className="font-medium text-nowrap text-gray-900">
            {user.userName}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "active",
    header: "Status",
    cell: (info: any) => {
      const status = info.getValue() ? "Active" : "Inactive";
      const colorClass =
        status === "Active"
          ? "text-g-green-800 bg-g-green-100"
          : "text-g-red-800 bg-g-red-100";
      return (
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-medium ${colorClass}`}
        >
          {status}
        </span>
      );
    },
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: (info: any) => {
      const user = info.row.original as Users;
      return <div className="text-gray-500">{user.email}</div>;
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created Date",
    cell: (info: any) => (
      <div className="text-gray-500">
        {new Date(info.getValue()).toLocaleDateString()}
      </div>
    ),
  },

  {
    id: "actions",
    header: "",
    cell: (info: any) => {
      const user = info.row.original as Users;
      const selectedRows = info.table.options.meta?.selectedRows || [];
      const tableLength = info.table.getRowModel().rows.length;

      if (selectedRows.length > 0) {
        if (info.row.index === tableLength - 1) {
          return (
            <div className="flex justify-center w-full">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  info.table.options.meta?.setIsBulkDelete?.(true);
                  info.table.options.meta?.setIsDeleteModalOpen?.(true);
                }}
                className="text-gray-500 cursor-pointer hover:text-red-600"
              >
                <FiTrash2 size={16} />
              </button>
            </div>
          );
        }
        return null;
      }

      return (
        <div className="flex items-center space-x-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              info.table.options.meta?.handleEdit?.(user);
            }}
            className="text-gray-500 cursor-pointer hover:text-green-600"
          >
            <FiEdit2 size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              info.table.options.meta?.setDepartmentToDelete?.(user.id);
              info.table.options.meta?.setIsBulkDelete?.(false);
              info.table.options.meta?.setIsDeleteModalOpen?.(true);
            }}
            className="text-gray-500 cursor-pointer hover:text-red-600"
          >
            <FiTrash2 size={16} />
          </button>
        </div>
      );
    },
  },
];

export const inviteColumns: ColumnDef<InvitedUser | any>[] = [
  {
    id: "selection",
    header: "",
    cell: (info: any) => {
      const invite = info.row.original as InvitedUser;
      return (
        <CustomCheckbox
          checked={invite.selected || false}
          onChange={() =>
            info.table.options.meta?.toggleRowSelection?.(invite.id)
          }
          id={`checkbox-${invite.id}`}
        />
      );
    },
    size: 40,
  },
  // {
  //   id: "profile",
  //   header: "",
  //   cell: () => (
  //     <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
  //       <span className="text-gray-500 text-xs">?</span>
  //     </div>
  //   ),
  //   size: 50,
  // },
  {
    accessorKey: "email",
    header: "Email",
    cell: (info: any) => {
      const invite = info.row.original as InvitedUser;
      return <div className="text-gray-500">{invite.email}</div>;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: (info: any) => {
      const status = info.getValue() as string;
      const colorClass =
        status === "PENDING"
          ? "text-g-amber-900 bg-g-amber-100"
          : "text-g-green-800 bg-g-green-100";
      return (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}
        >
          {status}
        </span>
      );
    },
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: (info: any) => {
      const invite = info.row.original as InvitedUser;
      return <div className="capitalize text-gray-500">{invite.role}</div>;
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created Date",
    cell: (info: any) => (
      <div className="text-gray-500">
        {new Date(info.getValue()).toLocaleDateString()}
      </div>
    ),
  },

  {
    id: "actions",
    header: "",
    cell: (info: any) => {
      const invite = info.row.original as InvitedUser;
      const dispatch = useDispatch<AppDispatch>();
      const selectedRows = info.table.options.meta?.selectedRows || [];
      const tableLength = info.table.getRowModel().rows.length;

      const handleResend = async () => {
        try {
          const success = await resendInviteAPI(dispatch, invite.id, {
            email: invite.email,
          });
          if (success) {
            info.table.options.meta?.refreshData?.();
          }
        } catch (error) {
          console.error("Error resending invite:", error);
          info.table.options.meta?.toastError?.(
            "Failed to resend invite. Please try again."
          );
        }
      };

      if (selectedRows.length > 0) {
        if (info.row.index === tableLength - 1) {
          return (
            <div className="flex justify-center  w-full">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  info.table.options.meta?.setIsBulkDelete?.(true);
                  info.table.options.meta?.setIsDeleteModalOpen?.(true);
                }}
                className="text-gray-500 cursor-pointer hover:text-red-600"
              >
                <FiTrash2 size={16} />
              </button>
            </div>
          );
        }
        return null;
      }

      return (
        <div className="flex items-center justify-end space-x-4">
          <button
            onClick={handleResend}
            className={`text-gray-500 cursor-pointer hover:text-blue-600 ${
              invite.status === "ACCEPTED"
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
            disabled={invite.status === "ACCEPTED"}
          >
            Resend
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              info.table.options.meta?.setDepartmentToDelete?.(invite.id);
              info.table.options.meta?.setIsBulkDelete?.(false);
              info.table.options.meta?.setIsDeleteModalOpen?.(true);
            }}
            className="text-gray-500 cursor-pointer hover:text-red-600"
          >
            <FiTrash2 size={16} />
          </button>
        </div>
      );
    },
  },
];
