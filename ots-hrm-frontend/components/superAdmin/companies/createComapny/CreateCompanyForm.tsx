"use client";

import Button from "@/components/common/Button";
import ImageUpload from "@/components/common/form/ImageUpload";
import InputField from "@/components/common/form/InputField";
import { Formik, Form } from "formik";
import React, { useState } from "react";
import { createCompanyValidationSchema } from "@/utils/validationSchema";
import { CreateCompanyFormValues } from "@/utils/types";

interface CreateCompanyFormProps {
  onClose: () => void;
  onAddUserClick?: (companyData: {
    name: string;
    email: string;
    logo?: File;
  }) => void;
  onEditCompanyClick?: (companyData: {
    id: string;
    name: string;
    email: string;
    logo?: File | undefined | null;
  }) => void;
  companyToEdit?: {
    id?: string;
    name: string;
    email: string;
    logoUrl?: string | null;
  } | null;
}

const CreateCompanyForm: React.FC<CreateCompanyFormProps> = ({
  onClose,
  onAddUserClick,
  onEditCompanyClick,
  companyToEdit,
}) => {
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [logoUrl] = useState<string | null | undefined>(companyToEdit?.logoUrl);
  console.log(companyToEdit);
  const initialValues: CreateCompanyFormValues = {
    name: companyToEdit?.name || "",
    email: companyToEdit?.email || "",
  };

  return (
    <div className="flex w-[700px] flex-col">
      <Formik
        initialValues={initialValues}
        validationSchema={createCompanyValidationSchema}
        onSubmit={() => {}} // No form submission here
      >
        {({ values }) => (
          <Form className="flex flex-col">
            <div className="min-h-[640px]">
              <div className="pt-4 px-4 bg-g-background-100 rounded-[var(--g-radius-md)] border-g-gray-alpha-400 border-[1px]">
                <ImageUpload
                  onImageChange={(file) => setProfileImage(file)}
                  description="Upload your company logo (max 4MB)"
                  initialImage={logoUrl || ""}
                />
                <div className="grid gap-4 md:grid-cols-2 mt-4 py-6">
                  <InputField
                    name="name"
                    label="Company Name *"
                    type="text"
                    placeholder="Enter company name"
                  />
                  <InputField
                    name="email"
                    label="Company Email *"
                    type="email"
                    placeholder="Enter company email"
                  />
                </div>
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
                  {companyToEdit ? (
                    <Button
                      type="button"
                      variant="filled"
                      label="Edit Company"
                      onClick={() => handleEditCompanyClick(values)}
                      disabled={!values.name || !values.email}
                    />
                  ) : (
                    <Button
                      type="button"
                      variant="filled"
                      label="Add User"
                      onClick={() => handleAddUserClick(values)}
                      disabled={!values.name || !values.email}
                    />
                  )}
                </div>
              </div>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );

  function handleAddUserClick(values: CreateCompanyFormValues) {
    if (!onAddUserClick) return;

    const companyData = {
      name: values.name,
      email: values.email,
      logo: profileImage || undefined,
    };
    onAddUserClick(companyData);
  }

  function handleEditCompanyClick(values: CreateCompanyFormValues) {
    if (!onEditCompanyClick || !companyToEdit?.id) return;

    const companyData = {
      id: companyToEdit.id,
      name: values.name,
      email: values.email,
      logo: profileImage,
    };
    onEditCompanyClick(companyData);
  }
};

export default CreateCompanyForm;
