"use client";

import Button from "@/components/common/Button";
import InputField from "@/components/common/form/InputField";
import { Formik, Form } from "formik";
import React, { useState } from "react";
import { X } from "lucide-react";
import SuccessConfirmation from "@/components/common/SuccessConfirmation";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";
import {
  addAdminValidationSchema,
  inviteAdminValidationSchema,
} from "@/utils/validationSchema";
import { DefaultAdmin, InvitedUser } from "@/utils/company";
import {
  addUserAPI,
  inviteUserAPI,
  updateAdminAPI,
} from "@/services/superAdminServices";

interface AddAdminFormProps {
  onClose: () => void;
  companyData: {
    name: string;
    email: string;
    companyId: string;
  };
  viewMode: "users" | "invites";
  onSuccess: () => void;
  initialValues?: {
    userName: string;
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    confirmPassword: string;
  };
  userId?: string;
}

const AddAdminForm: React.FC<AddAdminFormProps> = ({
  onClose,
  companyData,
  viewMode,
  onSuccess,
  initialValues,
  userId,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [isCreating, setIsCreating] = useState(false);
  const [addedUsers, setAddedUsers] = useState<DefaultAdmin[]>([]);
  const [invitedUsers, setInvitedUsers] = useState<InvitedUser[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSuccessHandled, setIsSuccessHandled] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [updatedUserData, setUpdatedUserData] = useState<any>(null);

  const handleSubmit = async (values: any, { resetForm }: any) => {
    if (!companyData.companyId) {
      console.error("Company ID is missing. Cannot add or invite users.");
      return;
    }

    if (viewMode === "users" && !initialValues) {
      const { confirmPassword, ...userData } = values;
      const newUser: DefaultAdmin = {
        username: userData.userName,
        email: userData.email,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
      };
      setAddedUsers((prev) => [...prev, newUser]);
      resetForm();
    } else if (viewMode === "users" && initialValues && userId) {
      // Store updated form values for edit case and trigger confirm
      const updatedData = {
        userName: values.userName,
        email: values.email,
        firstName: values.firstName,
        lastName: values.lastName,
        companyId: companyData.companyId,
      };
      setUpdatedUserData(updatedData);
      await handleConfirm(); // Trigger API call immediately for edit case
    } else if (viewMode === "invites") {
      const newInvite: InvitedUser = {
        id: "",
        email: values.email,
        role: "admin",
        companyId: companyData.companyId,
        status: "PENDING",
        selected: false,
      };
      setInvitedUsers((prev) => [...prev, newInvite]);
      resetForm();
    }
  };

  const handleDeleteAddedUser = (index: number) => {
    setAddedUsers(addedUsers.filter((_, i) => i !== index));
  };

  const handleDeleteInvitedUser = (index: number) => {
    setInvitedUsers(invitedUsers.filter((_, i) => i !== index));
  };

  const handleConfirm = async () => {
    if (!companyData.companyId) {
      console.error("Company ID is missing. Cannot add or invite users.");
      return;
    }

    if (isSuccessHandled) return;

    setIsCreating(true);
    setIsSuccessHandled(true);

    try {
      let success = false;

      const message =
        viewMode === "users" && initialValues
          ? "User has been updated successfully."
          : viewMode === "users"
          ? "User(s) have been added successfully."
          : "User(s) have been invited successfully.";
      setSuccessMessage(message);

      if (viewMode === "users" && initialValues && userId && updatedUserData) {
        success = await updateAdminAPI(dispatch, userId, updatedUserData);
      } else if (viewMode === "users" && addedUsers.length > 0) {
        const payload = {
          users: addedUsers.map((user) => ({
            userName: user.username,
            email: user.email,
            password: user.password,
            firstName: user.firstName,
            lastName: user.lastName,
            companyId: companyData.companyId,
          })),
        };
        success = await addUserAPI(dispatch, payload);
      } else if (viewMode === "invites" && invitedUsers.length > 0) {
        const payload = {
          invites: invitedUsers.map((invite) => ({
            email: invite.email,
            role: invite.role,
            companyId: invite.companyId,
          })),
        };
        success = await inviteUserAPI(dispatch, payload);
      }

      if (success) {
        setShowSuccessModal(true);
      } else {
        setIsSuccessHandled(false);
      }
    } catch (error) {
      console.error("Error adding/inviting users:", error);
      setIsSuccessHandled(false);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    setAddedUsers([]);
    setInvitedUsers([]);
    setIsSuccessHandled(false);
    setSuccessMessage("");
    setUpdatedUserData(null);
    onSuccess();
    onClose();
  };

  return (
    <div className="flex w-[700px] flex-col relative">
      <Formik
        initialValues={
          viewMode === "users"
            ? {
                userName: initialValues?.userName || "",
                email: initialValues?.email || "",
                firstName: initialValues?.firstName || "",
                lastName: initialValues?.lastName || "",
                password: initialValues?.password || "",
                confirmPassword: initialValues?.confirmPassword || "",
              }
            : { email: "" }
        }
        validationSchema={
          viewMode === "users"
            ? addAdminValidationSchema
            : inviteAdminValidationSchema
        }
        validationContext={{ isEdit: !!initialValues }}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ isSubmitting }) => (
          <Form className="flex flex-col">
            <div className="min-h-[640px]">
              <div className="pt-4 px-4 bg-g-background-100 rounded-[var(--g-radius-md)] border-g-gray-alpha-400 border-[1px]">
                {viewMode === "users" ? (
                  <>
                    <div className="grid gap-4 md:grid-cols-2 pb-6">
                      <InputField
                        name="userName"
                        label="Username *"
                        type="text"
                        placeholder="Enter username"
                      />
                      <InputField
                        name="email"
                        label="Email *"
                        type="email"
                        placeholder="Enter email"
                      />
                      <InputField
                        name="firstName"
                        label="First Name *"
                        type="text"
                        placeholder="Enter first name"
                      />
                      <InputField
                        name="lastName"
                        label="Last Name *"
                        type="text"
                        placeholder="Enter last name"
                      />
                      {!initialValues && (
                        <>
                          <InputField
                            name="password"
                            label="Password *"
                            type="password"
                            placeholder="Enter password"
                          />
                          <InputField
                            name="confirmPassword"
                            label="Confirm Password *"
                            type="password"
                            placeholder="Confirm password"
                          />
                        </>
                      )}
                    </div>
                    <div className="pb-6">
                      <Button
                        variant="filled"
                        type="submit"
                        label={initialValues ? "Update User" : "Add User"}
                        disabled={isSubmitting || isCreating}
                      />
                    </div>
                    {addedUsers.length > 0 && (
                      <>
                        <h3 className="text-heading-16 text-g-gray-1000 mb-4">
                          Added Users
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-6">
                          {addedUsers.map((user, index) => (
                            <div
                              key={`added-${index}`}
                              className="relative flex flex-col items-center p-4 bg-g-gray-100 border border-g-gray-alpha-400 rounded-[var(--g-radius-md)]"
                            >
                              <button
                                onClick={() => handleDeleteAddedUser(index)}
                                className="absolute top-1 right-1 bg-g-background-100 rounded-full p-1 shadow-sm border border-g-gray-alpha-400 focus-ring-geist"
                              >
                                <X className="h-3 w-3 text-g-gray-800" />
                              </button>
                              <img
                                src="https://placehold.co/400x400"
                                alt="Profile"
                                className="w-12 h-12 bg-g-background-100 rounded-full mb-2"
                              />
                              <p className="text-copy-14 font-medium">{user.username}</p>
                              <p className="text-copy-13 text-g-gray-800">
                                {user.email}
                              </p>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <div className="grid gap-4 md:grid-cols-5 pb-6">
                      <div className="md:col-span-4">
                        <InputField
                          name="email"
                          label="Email *"
                          type="email"
                          placeholder="Enter email"
                        />
                      </div>
                      <div className="pt-6">
                        <Button
                          variant="filled"
                          type="submit"
                          label="Invite User"
                          isLoading={isCreating}
                          disabled={isSubmitting || isCreating}
                        />
                      </div>
                    </div>
                    {invitedUsers.length > 0 && (
                      <>
                        <h3 className="text-heading-16 text-g-gray-1000 mb-4">
                          Invited Users
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 pb-6 gap-2">
                          {invitedUsers.map((user, index) => (
                            <div
                              key={`invited-${index}`}
                              className="relative flex flex-col items-center p-4 bg-g-gray-100 border border-g-gray-alpha-400 rounded-[var(--g-radius-md)]"
                            >
                              <button
                                onClick={() => handleDeleteInvitedUser(index)}
                                className="absolute top-1 right-1 bg-g-background-100 rounded-full p-1 shadow-sm border border-g-gray-alpha-400 focus-ring-geist"
                              >
                                <X className="h-3 w-3 text-g-gray-800" />
                              </button>
                              <img
                                src="https://placehold.co/400x400"
                                alt="Profile"
                                className="w-12 sr-only h-12 bg-g-background-100 rounded-full mb-2"
                              />
                              <p className="text-copy-14 text-g-gray-1000 font-medium">
                                Invited User
                              </p>
                              <p className="text-copy-13 text-g-gray-700">
                                {user.email}
                              </p>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="rounded-[var(--g-radius-md)] mt-4 bg-g-background-100 py-6 px-4 shadow-geist-modal">
              <div className="flex justify-between items-center max-w-4xl mx-auto">
                <button
                  type="button"
                  className="text-button-14 text-primary-navy-blue cursor-pointer hover:underline focus-ring-geist"
                  onClick={onClose}
                >
                  Back
                </button>
                <div className="flex gap-4">
                  {!initialValues && (
                    <Button
                      type="button"
                      variant="filled"
                      label={isCreating ? "Processing..." : "Confirm"}
                      onClick={handleConfirm}
                      disabled={
                        isSuccessHandled ||
                        (addedUsers.length === 0 && invitedUsers.length === 0)
                      }
                      isLoading={isCreating}
                    />
                  )}
                </div>
              </div>
            </div>
          </Form>
        )}
      </Formik>

      <SuccessConfirmation
        isOpen={showSuccessModal}
        onClose={handleSuccessClose}
        title={
          viewMode === "users" && initialValues ? "User Updated!" : "Success!"
        }
        message={successMessage}
      />
    </div>
  );
};

export default AddAdminForm;
