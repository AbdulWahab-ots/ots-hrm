"use client";
import React, { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import {
  User,
  IdCard,
  Users,
  Calendar,
  Phone,
  Mail,
  Landmark,
  Wallet,
  Banknote,
  Pencil,
  Trash2,
} from "lucide-react";
import { AppDispatch, RootState } from "@/store/store";
import {
  getEmployeeByIdAPI,
  updateEmployeeAPI,
  deleteEmployeeAPI,
  uploadProfileImageAPI,
  fetchAllDepartments,
  fetchAllDesignations,
} from "@/services/adminServices";
import { Employee, EmployeePayload } from "@/utils/types";
import { FormikHelpers } from "formik";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import BackButton from "@/components/common/BackButton";
import Button from "@/components/common/Button";
import CustomModal from "@/components/common/CustomModal";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmation";
import SuccessConfirmation from "@/components/common/SuccessConfirmation";
import { setIsLoading } from "@/store/features/global/globalSlice";
import CreateEmployee from "../add";
import DetailRow from "./DetailRow";
import AISummaryCard from "./AISummaryCard";
import SegmentedTabs from "@/components/common/SegmentedTabs";
import PerformanceTab from "./performance";

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function EmployeeDetailsView() {
  const searchParams = useSearchParams();
  const employeeId = searchParams.get("id");
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  // Performance is admin-only (spec section 5.4): the tab is not rendered for non-admins.
  const authUser = useSelector((state: RootState) => state.auth.user) as any;
  const isAdmin = authUser?.role?.code === "admin" || authUser?.role?.code === "superAdmin";
  const [tab, setTab] = useState<"overview" | "performance">("overview");

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLocalLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const fetchEmployee = useCallback(async () => {
    if (!employeeId) {
      setIsLocalLoading(false);
      return;
    }
    setIsLocalLoading(true);
    const response = await getEmployeeByIdAPI(dispatch, employeeId);
    setEmployee(response?.result ?? null);
    setIsLocalLoading(false);
  }, [employeeId, dispatch]);

  useEffect(() => {
    fetchEmployee();
  }, [fetchEmployee]);

  const handleEdit = () => {
    fetchAllDepartments(dispatch);
    fetchAllDesignations(dispatch);
    setIsEditModalOpen(true);
  };

  const handleEditEmployee = async (
    values: EmployeePayload,
    formikHelpers: FormikHelpers<EmployeePayload>,
    profileImage: File | null
  ) => {
    if (!employee) return;
    try {
      dispatch(setIsLoading(true));
      const { benefitId, ...rest } = values as any;
      const payload: any = { ...rest };
      delete payload.user?.pictureUrl;
      if (typeof payload.salary === "string") {
        payload.salary = Number(payload.salary) || 0;
      }

      const response = await updateEmployeeAPI(dispatch, payload, employee.id);
      const uploadedUserId = response?.result?.user?.id;

      if (response) {
        if (profileImage && uploadedUserId) {
          await uploadProfileImageAPI(dispatch, uploadedUserId, profileImage);
        }
        setSuccessMessage(
          `Employee ${values.user.firstName} has been updated successfully!`
        );
        setIsSuccessModalOpen(true);
        setIsEditModalOpen(false);
        await fetchEmployee();
      } else {
        throw new Error("API returned false");
      }
    } catch (error: any) {
      console.error("Failed to update employee:", error);
      if (error?.errors && Array.isArray(error.errors)) {
        formikHelpers.setErrors(
          error.errors.reduce(
            (acc: any, err: { field: string; message: string }) => ({
              ...acc,
              [err.field]: err.message,
            }),
            {}
          )
        );
      } else {
        formikHelpers.setStatus(
          "An unexpected error occurred. Please try again."
        );
      }
    } finally {
      dispatch(setIsLoading(false));
    }
  };

  const handleDelete = async () => {
    if (!employee) return;
    try {
      setIsDeleting(true);
      dispatch(setIsLoading(true));
      const success = await deleteEmployeeAPI(dispatch, employee.id);
      if (success) {
        router.push("/admin/employees");
      }
    } catch (error) {
      console.error("Failed to delete employee:", error);
    } finally {
      setIsDeleting(false);
      dispatch(setIsLoading(false));
      setIsDeleteModalOpen(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen={false} label="Loading employee..." />;
  }

  if (!employeeId || !employee) {
    return (
      <div className="w-full py-16 text-center text-g-gray-800">
        Employee not found.
      </div>
    );
  }

  const fullName = `${employee.user?.firstName ?? ""} ${employee.user?.lastName ?? ""}`.trim();

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <BackButton
          label="Employee Details"
          onClick={() => router.push("/admin/employees")}
        />
        <div className="flex gap-4">
          <Button
            icon={Trash2}
            variant="outline"
            iconPosition="center"
            onClick={() => setIsDeleteModalOpen(true)}
          />
          <Button
            icon={Pencil}
            variant="filled"
            label="Edit Employee"
            onClick={handleEdit}
          />
        </div>
      </div>

      {isAdmin && (
        <div className="mb-6">
          <SegmentedTabs
            options={[
              { value: "overview", label: "Overview" },
              { value: "performance", label: "Performance" },
            ]}
            value={tab}
            onChange={setTab}
          />
        </div>
      )}

      {tab === "performance" && isAdmin && (
        <PerformanceTab employeeId={employee.id} joinedDate={employee.joiningDate} />
      )}

      {(tab === "overview" || !isAdmin) && (
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-[30%] space-y-6">
          <div className="bg-g-background-100 border-[1px] border-g-gray-alpha-400 rounded-[var(--g-radius-md)] shadow-geist-card p-4 sm:p-6">
            {/* Profile header */}
            <div className="flex flex-col items-center mb-6">
              <div className="w-16 h-16 rounded-[var(--g-radius-full)] bg-g-gray-100 mb-3 flex items-center justify-center border-[1px] border-g-gray-alpha-400 overflow-hidden">
                {employee.user.pictureUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={employee.user.pictureUrl}
                    alt={fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={24} className="text-g-gray-700" />
                )}
              </div>

              <div className="text-center">
                <h2 className="text-heading-16 text-g-gray-1000 mb-1">
                  {fullName || "-"}
                </h2>
                <p className="text-label-13 text-g-gray-900 mb-2">
                  {employee.designation?.title || "-"}
                </p>
                <span className="inline-flex items-center h-[22px] px-2 rounded-[var(--g-radius-full)] bg-g-blue-100 text-g-blue-800 text-label-13">
                  {employee.status || "-"}
                </span>
              </div>
            </div>

            <div className="space-y-3 mb-5">
              <DetailRow
                label="Employee Code"
                value={employee.employeeCode || "-"}
                icon={<IdCard size={14} />}
              />
              <DetailRow
                label="Department"
                value={employee.department?.name || "-"}
                icon={<Users size={14} />}
              />
              <DetailRow
                label="Date Of Join"
                value={formatDate(employee.joiningDate)}
                icon={<Calendar size={14} />}
              />
            </div>

            <div className="border-t border-g-gray-alpha-400 my-6"></div>

            <h3 className="text-heading-14 text-g-gray-1000 mb-3">
              Basic Information
            </h3>
            <div className="space-y-3">
              <DetailRow
                label="Phone"
                value={employee.phoneNumber || "-"}
                icon={<Phone size={14} />}
              />
              <DetailRow
                label="Email"
                value={employee.user.email || "-"}
                icon={<Mail size={14} />}
              />
              <DetailRow
                label="Username"
                value={employee.user.userName || "-"}
                icon={<User size={14} />}
              />
            </div>
          </div>

          <div className="bg-g-background-100 border-[1px] border-g-gray-alpha-400 rounded-[var(--g-radius-md)] shadow-geist-card p-4 sm:p-6">
            <h3 className="text-heading-14 text-g-gray-1000 mb-3">
              Bank Information
            </h3>
            <div className="space-y-3">
              <DetailRow
                label="Bank Name"
                value={employee.bankName || "-"}
                icon={<Landmark size={14} />}
              />
              <DetailRow
                label="Account Number"
                value={employee.accountNumber || "-"}
                icon={<Wallet size={14} />}
              />
              <DetailRow
                label="IBAN Number"
                value={employee.ibanNumber || "-"}
                icon={<Banknote size={14} />}
              />
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-6">
          <div className="bg-g-background-100 border-[1px] border-g-gray-alpha-400 rounded-[var(--g-radius-md)] shadow-geist-card p-4 sm:p-6">
            <h3 className="text-heading-14 text-g-gray-1000 mb-3">
              Employment Details
            </h3>
            <div className="border-t border-g-gray-alpha-400 my-2"></div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-label-13 text-g-gray-900 mb-1">
                  Designation
                </p>
                <p className="text-label-14 text-g-gray-1000 font-medium">
                  {employee.designation?.title || "-"}
                </p>
              </div>
              <div>
                <p className="text-label-13 text-g-gray-900 mb-1">Shift</p>
                <p className="text-label-14 text-g-gray-1000 font-medium">
                  {employee.shift?.name || "-"}
                </p>
              </div>
              <div>
                <p className="text-label-13 text-g-gray-900 mb-1">Status</p>
                <p className="text-label-14 text-g-gray-1000 font-medium">
                  {employee.status || "-"}
                </p>
              </div>
              <div>
                <p className="text-label-13 text-g-gray-900 mb-1">Salary</p>
                <p className="text-label-14 text-g-gray-1000 font-medium">
                  {employee.salary != null ? employee.salary : "-"}
                </p>
              </div>
            </div>
          </div>

          <AISummaryCard employee={employee} />
        </div>
      </div>
      )}

      <CustomModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Employee"
        variant="bottom-full-no-rounded"
        className="h-full flex flex-col"
      >
        <CreateEmployee
          initialValues={{
            user: {
              userName: employee.user.userName || "",
              firstName: employee.user.firstName || "",
              lastName: employee.user.lastName || "",
              email: employee.user.email || "",
              password: "",
              pictureUrl: employee.user.pictureUrl || "",
            },
            employeeCode: employee.employeeCode || "",
            departmentId: employee.departmentId || "",
            designationId: employee.designationId || "",
            shiftId: employee.shiftId || "",
            joiningDate: employee.joiningDate || "",
            status: employee.status || "PERMANENT",
            benefitId: employee.benefitId || "",
            salary: employee.salary ?? "",
            phoneNumber: employee.phoneNumber || "",
            bankName: employee.bankName || "",
            ibanNumber: employee.ibanNumber || "",
            accountNumber: employee.accountNumber || "",
          }}
          onSubmit={handleEditEmployee}
          onCancel={() => setIsEditModalOpen(false)}
        />
      </CustomModal>

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onCancel={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        TextMessage="Employee will be deleted, and unfortunately, you won't be able to get it back."
      />

      <SuccessConfirmation
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        title="Success!"
        message={successMessage}
      />
    </div>
  );
}

export default EmployeeDetailsView;
