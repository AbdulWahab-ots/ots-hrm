"use client";

import React, { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { Formik, Form, FormikHelpers } from "formik";
import { useSelector, useDispatch } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import Button from "@/components/common/Button";
import InputField from "@/components/common/form/InputField";
import CustomDropdown from "@/components/common/form/DropDown";
import ImageUpload from "@/components/common/form/ImageUpload";
import {
  EmployeePayload,
  Department,
  Designation,
  Shift,
  Benefit,
  DropdownOption,
  Bank,
} from "@/utils/types";
import {
  fetchAllDepartments,
  fetchAllDesignations,
  fetchAllShifts,
  fetchAllBenefits,
  inviteUserAPI,
} from "@/services/adminServices";
import Image from "next/image";
import ATMCard from "../../../../public/ATMCard.svg";
import {
  EmployeeValidationSchema,
  EmployeeEditValidationSchema,
  InviteValidationSchema,
} from "@/utils/validationSchema";
import { pakistaniBanks } from "@/utils/constants";
import DateRangePickerModal from "@/components/common/form/DateRangePickerModal";
import FormActionBar from "@/components/common/FormActionBar";

interface CreateEmployeeProps {
  initialValues?: Partial<EmployeePayload>;
  onSubmit: (
    values: EmployeePayload,
    formikHelpers: FormikHelpers<EmployeePayload>,
    profileImage: File | null
  ) => Promise<void>;
  onCancel: () => void;
}

const CreateEmployee = ({
  initialValues,
  onSubmit,
  onCancel,
}: CreateEmployeeProps) => {
  const dispatch = useDispatch<AppDispatch>();
  // Presence of initialValues means we're editing an existing employee. Editing never
  // sets a password from this form — see EmployeeEditValidationSchema — password changes
  // only happen via the "Set Password" email flow (Employee Details page).
  const isEdit = !!initialValues;
  const



    departments = useSelector(
      (state: RootState) => state.department.departmentData
    );
  const designations = useSelector(
    (state: RootState) => state.designation.designationData
  );
  const shifts = useSelector((state: RootState) => state.shift.shiftData);
  const benefits = useSelector((state: RootState) => state.benefit.benefitData);
  const departmentLoading = useSelector(
    (state: RootState) => state.department.isLoading
  );
  const designationLoading = useSelector(
    (state: RootState) => state.designation.isLoading
  );
  const shiftLoading = useSelector((state: RootState) => state.shift.isLoading);
  const benefitLoading = useSelector(
    (state: RootState) => state.benefit.isLoading
  );
  const departmentError = useSelector(
    (state: RootState) => state.department.error
  );
  const designationError = useSelector(
    (state: RootState) => state.designation.error
  );
  const shiftError = useSelector((state: RootState) => state.shift.error);
  const benefitError = useSelector((state: RootState) => state.benefit.error);

  const [step, setStep] = useState(1);
  const [selectedBenefits, setSelectedBenefits] = useState<string[]>([]);
  const [formType, setFormType] = useState("add");
  const [inviteEmails, setInviteEmails] = useState<string[]>([]);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAllDepartments(dispatch);
    fetchAllDesignations(dispatch);
    fetchAllShifts(dispatch);
    fetchAllBenefits(dispatch);
  }, [dispatch]);

  useEffect(() => {
    if (initialValues?.benefitId) {
      setSelectedBenefits([initialValues.benefitId]);
    }
  }, [initialValues?.benefitId]);

  const departmentOptions: DropdownOption[] =
    departments?.map((dept: Department) => ({
      value: dept.id,
      label: dept.name,
    })) || [];

  const designationOptions: DropdownOption[] =
    designations?.map((des: Designation) => ({
      value: des.id,
      label: des.title,
    })) || [];

  const shiftOptions: DropdownOption[] =
    shifts?.map((shift: Shift) => ({
      value: shift.id,
      label: shift.name,
    })) || [];

  const bankOptions: DropdownOption[] = pakistaniBanks.map((bank: Bank) => ({
    value: bank.name,
    label: bank.name,
  }));

  const safeInitialValues: EmployeePayload = {
    user: {
      userName: "",
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      pictureUrl: initialValues?.user?.pictureUrl || "",
    },
    employeeCode: "",
    departmentId: "",
    designationId: "",
    shiftId: "",
    // Defaults to today for a new hire (the common case) — editing an existing
    // employee overrides this via ...initialValues below with their actual stored date.
    joiningDate: isEdit ? "" : format(new Date(), "yyyy-MM-dd"),
    status: "PERMANENT",
    benefitId: "",
    benefits: [],
    salary: initialValues?.salary ?? "",
    phoneNumber: "",
    bankName: "",
    ibanNumber: "",
    accountNumber: "",
    zkDeviceUserId: "",
    ...initialValues,
  };

  const toggleBenefitSelection = (
    benefitId: string,
    setFieldValue?: (field: string, value: any) => void
  ) => {
    let nextSelected: string[];
    if (selectedBenefits.includes(benefitId)) {
      nextSelected = selectedBenefits.filter((id) => id !== benefitId);
    } else {
      nextSelected = [...selectedBenefits, benefitId];
    }
    setSelectedBenefits(nextSelected);
    if (setFieldValue) {
      setFieldValue("benefitId", nextSelected[0] || "");
      setFieldValue(
        "benefits",
        nextSelected.map((id) => ({
          benefitId: id,
          effectiveDate: new Date().toISOString(),
        }))
      );
    }
  };

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => Math.max(1, prev - 1));

  const handleRemoveEmail = (emailToRemove: string) => {
    setInviteEmails(inviteEmails.filter((email) => email !== emailToRemove));
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleSendInvite = async () => {
    if (inviteEmails.length === 0) {
      return;
    }

    const payload = {
      invites: inviteEmails.map((email) => ({
        email,
        role: "employee",
      })),
    };

    try {
      const response = await inviteUserAPI(dispatch, payload);
      if (response) {
        setInviteEmails([]);
      } else {
        console.error("Failed to send invites.");
      }
    } catch (error) {
      console.error("Error sending invites:", error);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-[800px] lg:h-full rounded-[var(--g-radius-lg)]">
      <div className="flex gap-4 py-4">
        <button
          type="button"
          onClick={() => setFormType("add")}
          className={`px-4 py-2 rounded-[var(--g-radius-sm)] ${formType === "add"
            ? "bg-g-blue-100 text-g-gray-1000 border-[1px] border-g-blue-100 text-base"
            : "text-g-gray-800"
            }`}
        >
          Add
        </button>
        <button
          type="button"
          onClick={() => setFormType("invite")}
          className={`px-4 py-2 rounded-[var(--g-radius-sm)] ${formType === "invite"
            ? "bg-g-blue-100 text-g-gray-1000 border-[1px] border-g-blue-100 text-base"
            : "text-g-gray-800"
            }`}
        >
          Invite
        </button>
      </div>
      {formType === "add" ? (
        <div>
          <div className="bg-g-background-100 sticky top-0 z-10 p-6 mb-4 rounded-[var(--g-radius-lg)] border-[1px] border-g-gray-alpha-400 shadow-geist-card flex items-center justify-between w-full">
            {[
              { step: 1, name: "Basic Info" },
              { step: 2, name: "Benefits" },
              { step: 3, name: "Pay Details" },
            ].map((s, index) => (
              <React.Fragment key={s.step}>
                <div>
                  <div
                    className={`flex items-center justify-center sm:w-10 h-8 w-8 sm:h-10  rounded-full border-[1px] font-normal text-sm transition-colors duration-300 ${step >= s.step
                      ? "border-g-gray-1000 text-g-gray-1000"
                      : "border-g-gray-500 text-g-gray-700"
                      }`}
                  >
                    {s.step}
                  </div>
                  <p className="text-g-gray-700 text-label-12 text-nowrap mt-1">
                    {s.name}
                  </p>
                </div>
                {index < 2 && (
                  <div
                    className={`lg:w-72 sm:w-32 w-16 h-[1px] mx-2 mb-4 transition-colors duration-300 ${step > s.step ? "bg-g-blue-700" : "bg-g-gray-alpha-400"
                      }`}
                  ></div>
                )}
              </React.Fragment>
            ))}
          </div>

          <Formik
            initialValues={safeInitialValues}
            validationSchema={
              (isEdit ? EmployeeEditValidationSchema : EmployeeValidationSchema)[
                step - 1
              ]
            }
            onSubmit={async (values, formikHelpers) => {
              let updatedValues = { ...values };
              if (isEdit) {
                // Never submit a password from the edit form — see isEdit comment above.
                const { password, ...userWithoutPassword } = updatedValues.user;
                updatedValues.user = userWithoutPassword as typeof updatedValues.user;
              }
              if (step === 2) {
                updatedValues.benefitId =
                  selectedBenefits[0] || values.benefitId;
                updatedValues.benefits = selectedBenefits.map((id) => ({
                  benefitId: id,
                  effectiveDate: new Date().toISOString(),
                }));
                console.log("Updated form values with benefit:", updatedValues);
              }
              if (step < 3) {
                nextStep();
              } else {
                updatedValues.salary = Number(updatedValues.salary);
                if (updatedValues.benefitId && !updatedValues.benefits) {
                  updatedValues.benefits = [
                    {
                      benefitId: updatedValues.benefitId,
                      effectiveDate: new Date().toISOString(),
                    },
                  ];
                }

                await onSubmit(updatedValues, formikHelpers, profileImage);
              }
            }}
          >
            {({
              isSubmitting,
              isValid,
              setFieldValue,
              values,
              errors,
              touched,
            }) => (
              <Form>
                {step === 1 && (
                  <div>
                    <div className="bg-g-background-100 p-4 lg:p-6 lg:rounded-[var(--g-radius-lg)] rounded-[var(--g-radius-lg)] shadow-geist-card grid lg:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <ImageUpload
                          onImageChange={(file) => {
                            setProfileImage(file);
                            setFieldValue(
                              "user.pictureUrl",
                              file ? URL.createObjectURL(file) : ""
                            );
                          }}
                          initialImage={values.user.pictureUrl}
                          showDeleteButton={true}
                        />
                      </div>
                      <InputField
                        name="user.userName"
                        label="Username *"
                        placeholder="Write UserName"
                      />
                      <InputField
                        name="user.firstName"
                        label="First Name *"
                        placeholder="Write First Name"
                      />
                      <InputField
                        name="user.lastName"
                        label="Last Name *"
                        placeholder="Write Last Name"
                      />
                      <InputField
                        name="user.email"
                        label="Email *"
                        placeholder="Enter user Email"
                      />
                      {!isEdit && (
                        <InputField
                          name="user.password"
                          label="Password *"
                          type="password"
                          placeholder="password"
                        />
                      )}
                      <InputField
                        name="phoneNumber"
                        label="Phone Number *"
                        placeholder="000 000 000"
                      />
                      <InputField
                        name="employeeCode"
                        label="Employee Code *"
                        placeholder="EMP-000"
                      />
                      <CustomDropdown
                        id="departmentId"
                        name="departmentId"
                        label="Department *"
                        options={departmentOptions}
                        value={values.departmentId}
                        onChange={(e) => {
                          console.log("Selected department:", e.target.value);
                          setFieldValue("departmentId", e.target.value);
                        }}
                        placeholder={
                          departmentLoading
                            ? "Loading departments..."
                            : departmentError
                              ? "Error loading departments"
                              : departmentOptions.length
                                ? "Select Department"
                                : "No departments available"
                        }
                      />
                      <CustomDropdown
                        id="designationId"
                        name="designationId"
                        label="Designation *"
                        options={designationOptions}
                        value={values.designationId}
                        onChange={(e) => {
                          console.log("Selected designation:", e.target.value);
                          setFieldValue("designationId", e.target.value);
                        }}
                        placeholder={
                          designationLoading
                            ? "Loading designations..."
                            : designationError
                              ? "Error loading designations"
                              : designationOptions.length
                                ? "Select Designation"
                                : "No designations available"
                        }
                      />
                      <CustomDropdown
                        id="shiftId"
                        name="shiftId"
                        label="Shift *"
                        options={shiftOptions}
                        value={values.shiftId}
                        onChange={(e) => {
                          console.log("Selected shift:", e.target.value);
                          setFieldValue("shiftId", e.target.value);
                        }}
                        placeholder={
                          shiftLoading
                            ? "Loading shifts..."
                            : shiftError
                              ? "Error loading shifts"
                              : shiftOptions.length
                                ? "Select Shift"
                                : "No shifts available"
                        }
                      />
                      <div>
                        <label className="text-g-gray-900 text-label-14 font-medium block mb-2">
                          Joining Date *
                        </label>
                        <div
                          className={`
                            block w-full px-[14px] py-[10px]
                            border border-g-gray-alpha-400 rounded-[var(--g-radius-md)] focus-ring-geist
                            focus:outline-none transition-all duration-200 cursor-pointer
                            ${touched.joiningDate && errors.joiningDate
                              ? "border-g-red-600 shadow-[0_0_0_4px_var(--g-red-100)]"
                              : ""
                            }
                          `}
                          onClick={() => setIsDateModalOpen(true)}
                        >
                          {values.joiningDate || "Select Joining Date"}
                        </div>
                        {touched.joiningDate && errors.joiningDate && (
                          <div className="flex items-center mt-1 text-g-red-700">
                            <svg
                              className="h-4 w-4 mr-1"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span className="text-xs">
                              {errors.joiningDate}
                            </span>
                          </div>
                        )}
                      </div>
                      <CustomDropdown
                        id="status"
                        name="status"
                        label="Status *"
                        options={[
                          { value: "PERMANENT", label: "Permanent" },
                          { value: "PROBATION", label: "Probation" },
                        ]}
                        value={values.status}
                        onChange={(e) => {
                          console.log("Selected status:", e.target.value);
                          setFieldValue("status", e.target.value);
                        }}
                        placeholder="Select Status"
                      />
                    </div>
                  </div>
                )}
                {step === 2 && (
                  <div className="bg-g-background-100 p-4 lg:p-6 lg:rounded-[var(--g-radius-lg)] rounded-[var(--g-radius-lg)] shadow-geist-card gap-6 mb-4 border-[1px] border-g-gray-alpha-400 items-center justify-between w-full">
                    <h2 className="text-heading-24 text-g-gray-1000">
                      What are the benefits for your employee
                    </h2>
                    <p className="text-g-gray-800 text-copy-14 pb-6">
                      Here are some available benefits; please select one or
                      more.
                    </p>
                    {benefitLoading ? (
                      <p>Loading benefits...</p>
                    ) : benefitError ? (
                      <p className="text-g-red-700">{benefitError}</p>
                    ) : benefits.length === 0 ? (
                      <p>No benefits available</p>
                    ) : (
                      <div className="grid lg:grid-cols-3 sm:grid-cols-2 gap-4">
                        {benefits?.map((benefit: Benefit) => (
                          <div
                            key={benefit.id}
                            className={`flex flex-col items-center p-4 rounded-[var(--g-radius-md)] border-[1px] cursor-pointer transition-all ${selectedBenefits.includes(benefit.id)
                              ? "border-g-blue-700 shadow-geist-card bg-g-blue-100"
                              : "border-g-gray-alpha-400"
                              }`}
                            onClick={() =>
                              toggleBenefitSelection(benefit.id, setFieldValue)
                            }
                          >
                            <p className="text-copy-16 text-g-gray-1000">
                              {benefit.name}
                            </p>
                            <span className="text-g-gray-900 text-label-12 font-normal rounded-[var(--g-radius-sm)] bg-g-gray-100 px-2 py-[2px] my-2">
                              {benefit.frequency}
                            </span>
                            <p className="text-heading-24 text-g-gray-1000">
                              {benefit.value}{" "}
                              <span className="text-label-12 font-normal text-g-gray-1000">
                                PKR
                              </span>
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {step === 3 && (
                  <div className="bg-g-background-100 p-4 lg:p-6 lg:rounded-[var(--g-radius-lg)] rounded-[var(--g-radius-lg)] shadow-geist-card grid md:grid-cols-2 gap-6 mb-4 border-[1px] border-g-gray-alpha-400 items-center justify-between w-full">
                    <div className="lg:col-span-2 pb-12 relative">
                      <h1 className="text-heading-24 text-g-gray-1000">
                        Pay Details
                      </h1>
                      <Image
                        src={ATMCard}
                        alt="ATM Card"
                        className="absolute lg:block hidden opacity-20 -top-6 right-0"
                      />
                    </div>
                    <InputField
                      name="salary"
                      label="Salary *"
                      type="number"
                      isPriceField={true}
                      placeholder="00.00"
                      onChange={(e) => {
                        const parsed =
                          e.target.value === "" ? "" : Number(e.target.value);
                        setFieldValue("salary", parsed);
                      }}
                    />
                    <CustomDropdown
                      id="bankName"
                      name="bankName"
                      label="Select Bank *"
                      options={bankOptions}
                      value={values.bankName}
                      onChange={(e) => {
                        console.log("Selected bank:", e.target.value);
                        setFieldValue("bankName", e.target.value);
                      }}
                      placeholder={
                        bankOptions.length
                          ? "Select Bank"
                          : "No banks available"
                      }
                    />
                    <InputField
                      name="ibanNumber"
                      label="IBAN Number *"
                      placeholder="e.g., PK36SCBL0000001123456702"
                    />
                    <InputField
                      name="accountNumber"
                      label="Account Number *"
                      placeholder="e.g., 0000001123456702"
                    />
                  </div>
                )}

                <FormActionBar
                  onCancel={step > 1 ? prevStep : undefined}
                  cancelLabel="Back"
                >
                  <Button
                    type="submit"
                    variant="filled"
                    fullWidth={false}
                    rounded="full"
                    className="px-8"
                    label={
                      step < 3
                        ? "Next"
                        : initialValues
                          ? "Update Employee"
                          : "Create Employee"
                    }
                    isLoading={isSubmitting}
                    disabled={
                      step === 2
                        ? selectedBenefits.length === 0 || isSubmitting
                        : !isValid || isSubmitting
                    }
                  />
                </FormActionBar>
                <DateRangePickerModal
                  isOpen={isDateModalOpen}
                  onClose={() => setIsDateModalOpen(false)}
                  onSave={(range) => {
                    // toISOString() rolls local midnight back a day for any timezone
                    // ahead of UTC (e.g. PKT) — format() reads the local calendar date.
                    setFieldValue(
                      "joiningDate",
                      range.startDate ? format(range.startDate, "yyyy-MM-dd") : ""
                    );
                  }}
                  initialRange={{
                    startDate: values.joiningDate
                      ? new Date(values.joiningDate)
                      : null,
                    endDate: null,
                  }}
                  singleDateMode={true}
                />
              </Form>
            )}
          </Formik>
        </div>
      ) : (
        <div>
          <Formik
            initialValues={{ emailInput: "", departmentId: "", salary: "" }}
            validationSchema={InviteValidationSchema}
            onSubmit={async (values, { setSubmitting, resetForm }) => {
              const email = values.emailInput.trim();
              if (!inviteEmails.includes(email)) {
                setInviteEmails([...inviteEmails, email]);
              }
              resetForm();
              if (inputRef.current) {
                inputRef.current.focus();
              }
              setSubmitting(false);
            }}
          >
            {({
              isSubmitting,
              isValid,
              values,
              errors,
              handleChange,
              handleBlur,
              setFieldValue,
            }) => (
              <Form>
                <div className="bg-g-background-100 p-6 rounded-[var(--g-radius-lg)] shadow-geist-card border-[1px] border-g-gray-alpha-400">
                  <div className="gap-4">
                    <div className="grid md:grid-cols-6 gap-4 relative">
                      <div className="md:col-span-5 flex flex-row items-center gap-2 p-2 border border-g-gray-alpha-400 rounded-[var(--g-radius-sm)] w-full overflow-hidden">
                        {inviteEmails.map((email) => (
                          <div
                            key={email}
                            className="flex items-center border-g-gray-alpha-400 border-[1px] rounded-[var(--g-radius-sm)] px-2 py-1 text-g-gray-1000 text-label-14 whitespace-nowrap"
                          >
                            {email}
                            <button
                              type="button"
                              onClick={() => handleRemoveEmail(email)}
                              className="ml-1.5 text-g-gray-800 hover:text-g-gray-1000 cursor-pointer focus-ring-geist"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                        <input
                          ref={inputRef}
                          type="email"
                          name="emailInput"
                          value={values.emailInput}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          placeholder="Enter your emails"
                          className="flex-1 p-1 border-none outline-none"
                        />
                        {errors.emailInput && values.emailInput && (
                          <div className="text-g-red-700 text-label-12 mt-1 absolute -bottom-6 left-0">
                            {errors.emailInput}
                          </div>
                        )}
                      </div>
                      <div className="md:col-span-1">
                        <Button
                          type="submit"
                          label="Add Email"
                          variant="filled"
                          disabled={!isValid || isSubmitting}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 bg-g-background-100 p-4 lg:p-6 lg:rounded-[var(--g-radius-lg)] rounded-[var(--g-radius-lg)] shadow-geist-card gap-6 mb-4 border-[1px] border-g-gray-alpha-400 items-center justify-between w-full">
                  <h2 className="text-heading-24 text-g-gray-1000">
                    Basic Details
                  </h2>
                  <div className="grid lg:grid-cols-2 gap-6 mt-4">
                    <CustomDropdown
                      id="departmentId"
                      name="departmentId"
                      label="Department *"
                      options={departmentOptions}
                      value={values.departmentId}
                      onChange={(e) => {
                        setFieldValue("departmentId", e.target.value);
                      }}
                      placeholder={
                        departmentLoading
                          ? "Loading departments..."
                          : departmentError
                            ? "Error loading departments"
                            : departmentOptions.length
                              ? "Select Department"
                              : "No departments available"
                      }
                    />
                    <InputField
                      name="salary"
                      label="Salary *"
                      type="number"
                      isPriceField={true}
                      placeholder="00.00"
                    />
                  </div>
                </div>
                <div className="mt-4 bg-g-background-100 p-4 lg:p-6 lg:rounded-[var(--g-radius-lg)] rounded-[var(--g-radius-lg)] shadow-geist-card gap-6 mb-4 border-[1px] border-g-gray-alpha-400 items-center justify-between w-full">
                  <h2 className="text-heading-24 text-g-gray-1000">
                    What are the benefits for your employee
                  </h2>
                  <div className="mt-8 flex flex-wrap gap-2">
                    {benefits.length > 0 ? (
                      benefits.map((benefit: Benefit) => (
                        <span
                          key={benefit.id}
                          className={`p-4 text-label-14 text-g-gray-900 font-medium cursor-pointer border-[1px] rounded-[var(--g-radius-sm)] ${selectedBenefits.includes(benefit.id)
                            ? "bg-g-blue-100 border-g-blue-700"
                            : "border-g-gray-alpha-400"
                            }`}
                          onClick={() => toggleBenefitSelection(benefit.id)}
                        >
                          {benefit.name}
                        </span>
                      ))
                    ) : (
                      <p>No benefits available</p>
                    )}
                  </div>
                </div>
                <FormActionBar>
                  <Button
                    type="button"
                    variant="filled"
                    fullWidth={false}
                    rounded="full"
                    className="px-8"
                    label="Send Invite"
                    onClick={handleSendInvite}
                    disabled={inviteEmails.length === 0}
                  />
                </FormActionBar>
              </Form>
            )}
          </Formik>
        </div>
      )}
    </div>
  );
};

export default CreateEmployee;
