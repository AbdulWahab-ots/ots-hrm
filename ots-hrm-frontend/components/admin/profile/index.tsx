"use client";
import React, { useState } from "react";
import ImageUpload from "../../common/form/ImageUpload";
import InputField from "../../common/form/InputField";
import Dropdown from "../../common/form/DropDown";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { countryOptions, stateOptions, cityOptions } from "@/utils/constants";
import { Eye, EyeOff } from "lucide-react";
import { profileValidationSchema } from "@/utils/validationSchema";

const AddProfile = () => {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const initialValues = {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    country: "",
    state: "",
    city: "",
    postalCode: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  };

  const handleSubmit = (values: typeof initialValues) => {
    console.log(values);
    // Handle form submission here
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <h1 className="text-heading-24">Profile</h1>
      </div>

      <div className="rounded-[var(--g-radius-md)] p-6 mb-6 bg-g-background-100 shadow-geist-card">
        <h2 className="text-heading-16 text-g-gray-1000">
          Basic Information
        </h2>
        <div className="border-b border-gray-200 w-full my-3"></div>
        <Formik
          initialValues={initialValues}
          validationSchema={profileValidationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, values, setFieldValue }) => (
            <Form className="pt-4">
              <ImageUpload />

              <div className="mt-4 space-y-1">
                <div className="flex items-center gap-4 flex-wrap">
                  <label className="w-32 text-label-14 text-g-gray-900 mr-4">
                    First Name
                  </label>
                  <div className="flex-1 max-w-sm">
                    <InputField
                      name="firstName"
                      type="text"
                      className="mb-0"
                      hideLabel
                    />
                  </div>

                  <label className="w-32 text-label-14 text-g-gray-900 ml-2 mr-4">
                    Last Name
                  </label>
                  <div className="flex-1 max-w-sm">
                    <InputField
                      name="lastName"
                      type="text"
                      className="mb-0"
                      hideLabel
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                  <label className="w-32 text-label-14 text-g-gray-900 mr-4">
                    Email
                  </label>
                  <div className="flex-1 max-w-sm">
                    <InputField
                      name="email"
                      type="email"
                      className="mb-0"
                      hideLabel
                    />
                  </div>

                  <label className="w-32 text-label-14 text-g-gray-900 ml-2 mr-4">
                    Phone
                  </label>
                  <div className="flex-1 max-w-sm">
                    <InputField
                      name="phone"
                      type="tel"
                      className="mb-0"
                      hideLabel
                    />
                  </div>
                </div>
              </div>

              <h2 className="text-heading-16 text-g-gray-1000 pt-8">
                Address Information
              </h2>
              <div className="border-b border-gray-200 w-full my-3"></div>

              <div className="space-y-1">
                <div className="flex items-center gap-4 flex-wrap">
                  <label className="w-32 text-label-14 text-g-gray-900 mr-4">
                    Address
                  </label>
                  <div className="flex-1">
                    <InputField
                      name="address"
                      type="text"
                      className="mb-0"
                      hideLabel
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-4 flex-wrap">
                  <label className="w-32 text-label-14 text-g-gray-900 mr-4">
                    Country
                  </label>
                  <div className="flex-1 max-w-sm">
                    <Dropdown
                      id="country"
                      name="country"
                      options={countryOptions}
                      className="mb-0"
                      value={values.country}
                      onChange={(e) => setFieldValue("country", e.target.value)}
                    />
                  </div>

                  <label className="w-32 text-label-14 text-g-gray-900 ml-2 mr-4">
                    State
                  </label>
                  <div className="flex-1 max-w-sm">
                    <Dropdown
                      id="state"
                      name="state"
                      options={stateOptions}
                      className="mb-0"
                      value={values.state}
                      onChange={(e) => setFieldValue("state", e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                  <label className="w-32 text-label-14 text-g-gray-900 mr-4">
                    City
                  </label>
                  <div className="flex-1 max-w-sm">
                    <Dropdown
                      id="city"
                      name="city"
                      options={cityOptions}
                      className="mb-0"
                      value={values.city}
                      onChange={(e) => setFieldValue("city", e.target.value)}
                    />
                  </div>

                  <label className="w-32 text-label-14 text-g-gray-900 ml-2 mr-4">
                    Postal Code
                  </label>
                  <div className="flex-1 max-w-sm">
                    <InputField
                      name="postalCode"
                      type="text"
                      className="mb-0"
                      hideLabel
                    />
                  </div>
                </div>
              </div>

              <h2 className="text-heading-16 text-g-gray-1000 pt-8">
                Change Password
              </h2>
              <div className="border-b border-gray-200 w-full my-3"></div>

              <div className="flex items-center gap-4">
                <label className="w-32 text-label-14 text-g-gray-900 mr-4">
                  Current Password
                </label>
                <div className="flex-1 max-w-sm">
                  <InputField
                    name="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    className="mb-0"
                    hideLabel
                    // icon={
                    //   <button
                    //     type="button"
                    //     className="text-gray-500 hover:text-gray-700"
                    //     onClick={() =>
                    //       setShowCurrentPassword(!showCurrentPassword)
                    //     }
                    //   >
                    //     {showCurrentPassword ? (
                    //       <EyeOff size={18} />
                    //     ) : (
                    //       <Eye size={18} />
                    //     )}
                    //   </button>
                    // }
                  />
                </div>

                <label className="w-32 text-label-14 text-g-gray-900 ml-2 mr-4">
                  New Password
                </label>
                <div className="flex-1 max-w-sm">
                  <InputField
                    name="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    className="mb-0"
                    hideLabel
                    // icon={
                    //   <button
                    //     type="button"
                    //     className="text-gray-500 hover:text-gray-700"
                    //     onClick={() => setShowNewPassword(!showNewPassword)}
                    //   >
                    //     {showNewPassword ? (
                    //       <EyeOff size={18} />
                    //     ) : (
                    //       <Eye size={18} />
                    //     )}
                    //   </button>
                    // }
                  />
                </div>

                <label className="w-32 text-label-14 text-g-gray-900 ml-2 mr-4">
                  Confirm Password
                </label>
                <div className="flex-1 max-w-sm">
                  <InputField
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    className="mb-0"
                    hideLabel
                    // icon={
                    //   <button
                    //     type="button"
                    //     className="text-gray-500 hover:text-gray-700"
                    //     onClick={() =>
                    //       setShowConfirmPassword(!showConfirmPassword)
                    //     }
                    //   >
                    //     {showConfirmPassword ? (
                    //       <EyeOff size={18} />
                    //     ) : (
                    //       <Eye size={18} />
                    //     )}
                    //   </button>
                    // }
                  />
                </div>
              </div>

              <div className="border-t border-gray-200 w-full mt-4 mb-2"></div>
              <div className="flex justify-end gap-4 mt-4">
                <button
                  type="button"
                  className="px-6 py-2 border border-g-gray-alpha-400 rounded-[var(--g-radius-sm)] text-g-gray-900 text-button-14 hover:bg-g-gray-100 focus-ring-geist"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-g-blue-700 text-white rounded-[var(--g-radius-sm)] text-button-14 hover:bg-g-blue-800 focus-ring-geist"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Save"}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </>
  );
};

export default AddProfile;
