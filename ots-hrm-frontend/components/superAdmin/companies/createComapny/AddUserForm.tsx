"use client";

import Button from "@/components/common/Button";
import InputField from "@/components/common/form/InputField";
import { Formik, Form } from "formik";
import React, { useState } from "react";
import {
  addUserValidationSchema,
  inviteUserValidationSchema,
} from "@/utils/validationSchema";
import { X } from "lucide-react";
import SuccessConfirmation from "@/components/common/SuccessConfirmation";
import {
  createCompanyAPI,
  uploadCompanyLogoAPI,
} from "@/services/superAdminServices";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";
import { CreateCompanyPayload, DefaultUser, InvitedUser } from "@/utils/types";

interface AddUserFormProps {
  onClose: () => void;
  companyData: {
    name: string;
    email: string;
    logo?: File;
  };
}

const AddUserForm: React.FC<AddUserFormProps> = ({ onClose, companyData }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [isCreatingCompany, setIsCreatingCompany] = useState(false);
  const [addedUsers, setAddedUsers] = useState<DefaultUser[]>([]);
  const [invitedUsers, setInvitedUsers] = useState<InvitedUser[]>([]);
  const [formType, setFormType] = useState<"add" | "invite">("add");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleSubmit = (values: any, { resetForm }: any) => {
    if (formType === "add") {
      const { confirmPassword, ...userData } = values;
      const newUser: DefaultUser = {
        username: userData.username,
        email: userData.email,
        password: userData.password,
      };
      setAddedUsers((prevUsers) => {
        const updatedUsers = [...prevUsers, newUser];
        console.log("Updated users array:", updatedUsers);
        return updatedUsers;
      });
    } else {
      setInvitedUsers((prev) => [...prev, { email: values.email }]);
    }
    resetForm();
  };

  const handleDeleteAddedUser = (index: number) => {
    setAddedUsers(addedUsers.filter((_, i) => i !== index));
  };

  const handleDeleteInvitedUser = (index: number) => {
    setInvitedUsers(invitedUsers.filter((_, i) => i !== index));
  };

  const handleCreateCompany = async () => {
    setIsCreatingCompany(true);
    try {
      const payload: CreateCompanyPayload = {
        name: companyData.name,
        email: companyData.email,
        ...(addedUsers.length > 0 && { defaultUser: addedUsers }),
        ...(invitedUsers.length > 0 && { invites: invitedUsers }),
      };

      const response = await createCompanyAPI(dispatch, payload);

      if (response && response.result?.id) {
        if (companyData.logo) {
          await uploadCompanyLogoAPI(
            dispatch,
            response.result.id,
            companyData.logo
          );
        }
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error("Error creating company:", error);
    } finally {
      setIsCreatingCompany(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    onClose();
  };

  return (
    <div className="flex w-[700px] flex-col relative">
      <Formik
        initialValues={
          formType === "add"
            ? { username: "", email: "", password: "", confirmPassword: "" }
            : { email: "" }
        }
        validationSchema={
          formType === "add"
            ? addUserValidationSchema
            : inviteUserValidationSchema
        }
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, resetForm }) => (
          <Form className="flex flex-col">
            <div className="min-h-[640px]">
              <div className="pt-4 px-4 bg-g-background-100 rounded-[var(--g-radius-md)] border-g-gray-alpha-400 border-[1px]">
                <div className="flex gap-4 py-4">
                  <button
                    type="button"
                    onClick={() => {
                      setFormType("add");
                      resetForm();
                    }}
                    className={`px-4 py-2 rounded-[var(--g-radius-sm)] focus-ring-geist ${
                      formType === "add"
                        ? "bg-g-blue-100 text-g-gray-1000"
                        : "text-g-gray-700"
                    }`}
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormType("invite");
                      resetForm();
                    }}
                    className={`px-4 py-2 rounded-[var(--g-radius-sm)] focus-ring-geist ${
                      formType === "invite"
                        ? "bg-g-blue-100 text-g-gray-1000"
                        : "text-g-gray-700"
                    }`}
                  >
                    Invite
                  </button>
                </div>

                {formType === "add" ? (
                  <>
                    <div className="grid gap-4 md:grid-cols-2 pb-6">
                      <InputField
                        name="username"
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
                    </div>
                    <div className="pb-6">
                      <Button variant="filled" type="submit" label="Add User" />
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
                        <Button label="Invite" type="submit" />
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
                              className="flex relative flex-col items-center p-4 bg-g-gray-100 border border-g-gray-alpha-400 rounded-[var(--g-radius-md)]"
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
                  <Button
                    type="button"
                    variant="filled"
                    label={isCreatingCompany ? "Creating..." : "Confirm"}
                    onClick={handleCreateCompany}
                    disabled={
                      addedUsers.length === 0 && invitedUsers.length === 0
                    }
                    isLoading={isCreatingCompany}
                  />
                </div>
              </div>
            </div>
          </Form>
        )}
      </Formik>

      <SuccessConfirmation
        isOpen={showSuccessModal}
        onClose={handleSuccessClose}
        title="Company Created!"
        message="Company has been created successfully with all the users."
      />
    </div>
  );
};

export default AddUserForm;
