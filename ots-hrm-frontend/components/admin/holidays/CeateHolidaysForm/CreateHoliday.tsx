"use client";

import React, { useMemo, useEffect, useState } from "react";
import { format } from "date-fns";
import Button from "@/components/common/Button";
import InputField from "@/components/common/form/InputField";
import SearchableDropdown from "@/components/common/form/SearchableDropdown";
import CustomDropdown from "@/components/common/form/DropDown";
import ToggleButton from "@/components/common/form/ToggleButton";
import { Formik, Form, FormikHelpers } from "formik";
import TextArea from "@/components/common/form/TextArea";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store/store";
import { Department, Country, HolidayPayload } from "@/utils/types";
import { HolidayValidationSchema } from "@/utils/validationSchema";
import "react-datepicker/dist/react-datepicker.css";
import {
  fetchAllCountries,
  fetchAllDepartments,
} from "@/services/adminServices";
import DateRangePickerModal from "@/components/common/form/DateRangePickerModal";
import FormActionBar from "@/components/common/FormActionBar";

interface CreateHolidayProps {
  initialValues?: Partial<HolidayPayload>;
  onSubmit: (
    values: HolidayPayload,
    formikHelpers: FormikHelpers<HolidayPayload>
  ) => Promise<void>;
  onCancel: () => void;
}

const CreateHoliday = ({
  initialValues,
  onSubmit,
  onCancel,
}: CreateHolidayProps) => {
  const departments = useSelector(
    (state: RootState) => state.department.departmentData
  );
  const countries = useSelector(
    (state: RootState) => state.country.countryData
  );
  const isCountryLoading = useSelector(
    (state: RootState) => state.country.isLoading
  );

  const dispatch = useDispatch<AppDispatch>();
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Fetch data when component mounts
  useEffect(() => {
    if (!countries?.data || countries.data.length === 0) {
      dispatch(fetchAllCountries);
    }
    if (!departments || departments.length === 0) {
      dispatch(fetchAllDepartments);
    }
  }, [dispatch, countries?.data, departments]);

  // Memoize options to prevent unnecessary re-renders
  const departmentOptions = useMemo(() => {
    const options = [
      { value: "", label: "Select Department" },
      ...(departments?.map((dept: Department) => ({
        value: dept.id,
        label: dept.name,
      })) || []),
    ];
    return options;
  }, [departments]);

  const countryOptions = useMemo(() => {
    const options = [
      { value: "", label: "Select Country" },
      ...(countries?.data?.map((country: Country) => ({
        value: country.id,
        label: country.name,
      })) || []),
    ];
    return options;
  }, [countries?.data]);

  const leaveTypeOptions = useMemo(() => {
    const options = [
      { value: "", label: "Select Leave Type" },
      { value: "NATIONAL", label: "National" },
      { value: "RELIGIOUS", label: "Religious" },
      { value: "CULTURAL", label: "Cultural" },
      { value: "REGIONAL", label: "Regional" },
      { value: "COMPANY", label: "Company" },
      { value: "OTHER", label: "Other" },
    ];
    return options;
  }, []);

  const safeInitialValues: HolidayPayload = {
    name: initialValues?.name || "",
    dates: initialValues?.dates || [],
    isMultiple: initialValues?.isMultiple ?? false,
    type: initialValues?.type || "",
    description: initialValues?.description || "",
    whichCountryId: initialValues?.whichCountryId || "",
    departmentId: initialValues?.departmentId || "",
  };

  const handleOpenDateModal = () => setIsDateModalOpen(true);
  const handleCloseDateModal = () => setIsDateModalOpen(false);

  return (
    <div className="flex flex-col justify-between w-[800px]">
      <Formik
        initialValues={safeInitialValues}
        validationSchema={HolidayValidationSchema}
        validateOnMount
        onSubmit={async (values, formikHelpers) => {
          try {
            const submissionValues: HolidayPayload = {
              ...values,
              dates: values.dates.map(
                (date) => new Date(date).toISOString().split("T")[0]
              ),
            };
            await onSubmit(submissionValues, formikHelpers);
          } catch (error: any) {
            if (error?.errors && Array.isArray(error.errors)) {
              error.errors.forEach(
                (err: { field: string; message: string }) => {
                  formikHelpers.setFieldError(err.field, err.message);
                }
              );
            } else {
              formikHelpers.setStatus(
                error?.response?.data?.message ||
                "An unexpected error occurred. Please try again."
              );
            }
          } finally {
            formikHelpers.setSubmitting(false);
          }
        }}
      >
        {({
          isSubmitting,
          isValid,
          setFieldValue,
          values,
          status,
          touched,
          errors,
        }) => (
          <Form className="">
            <div>
              <div className="p-6 bg-g-background-100 sm:rounded-3xl rounded-2xl lg:rounded-[32px] border-(--genrel-light-stroke) border-[1px]">
                <div className="flex pb-4 items-center gap-4">
                  <ToggleButton
                    initialValue={values.isMultiple}
                    onChange={(value) => {
                      setFieldValue("isMultiple", value);
                      if (!value) {
                        setFieldValue(
                          "dates",
                          values.dates[0] ? [values.dates[0]] : []
                        );
                      }
                    }}
                    disabled={false}
                    trueBgColor="#597BE8"
                    falseBgColor="#F5F5F5"
                  />
                  <label className="text-g-gray-900 font-medium text-sm">
                    Is Multiple
                  </label>
                </div>
                <div className="grid lg:grid-cols-2 gap-6">
                  <InputField
                    name="name"
                    label="Holiday Name *"
                    type="text"
                    placeholder="Enter holiday name"
                  />
                  <div>
                    <label className="text-g-gray-900 font-medium text-sm block mb-1">
                      Dates *
                    </label>
                    <div
                      className={`
                        block w-full px-[14px] py-[10px]
                        border border-g-gray-alpha-400 rounded-[var(--g-radius-md)]
                        focus:outline-none transition-all duration-200 cursor-pointer focus-ring-geist
                        ${touched.dates && errors.dates
                          ? "border-g-red-500"
                          : ""
                        }
                      `}
                      onClick={handleOpenDateModal}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                    >
                      {values.dates.length > 0
                        ? values.dates
                          .map(
                            (date) =>
                              new Date(date).toISOString().split("T")[0]
                          )
                          .join(", ")
                        : values.isMultiple
                          ? "Select multiple dates"
                          : "Select date"}
                    </div>
                    {touched.dates && errors.dates && (
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
                        <span className="text-xs">{errors.dates}</span>
                      </div>
                    )}
                  </div>
                  <CustomDropdown
                    id="type"
                    name="type"
                    label="Leave Type *"
                    className="w-full"
                    options={leaveTypeOptions}
                    value={values.type}
                    onChange={(e) => setFieldValue("type", e.target.value)}
                    placeholder="Select Leave Type"
                  />

                  <CustomDropdown
                    id="departmentId"
                    name="departmentId"
                    label="Department"
                    className="w-full"
                    options={departmentOptions}
                    value={values.departmentId}
                    onChange={(e) =>
                      setFieldValue("departmentId", e.target.value)
                    }
                    placeholder="Select Department"
                  />
                  <SearchableDropdown
                    id="whichCountryId"
                    name="whichCountryId"
                    label="Country *"
                    className="w-full"
                    options={countryOptions}
                    value={values.whichCountryId}
                    onChange={(e) =>
                      setFieldValue("whichCountryId", e.target.value)
                    }
                    placeholder={
                      isCountryLoading
                        ? "Loading Countries..."
                        : "Select Country"
                    }
                    searchable={true}
                  />
                  <div className="lg:col-span-2">
                    <TextArea
                      name="description"
                      label="Description"
                      placeholder="Enter your description"
                      rows={4}
                    />
                  </div>
                </div>
              </div>
            </div>
            <DateRangePickerModal
              isOpen={isDateModalOpen}
              onClose={handleCloseDateModal}
              onSave={(range) => {
                // toISOString() rolls local midnight back a day for any timezone
                // ahead of UTC (e.g. PKT) — format() reads the local calendar date.
                if (values.isMultiple) {
                  setFieldValue(
                    "dates",
                    range.startDate && range.endDate
                      ? [
                        format(range.startDate, "yyyy-MM-dd"),
                        format(range.endDate, "yyyy-MM-dd"),
                      ]
                      : []
                  );
                } else {
                  setFieldValue(
                    "dates",
                    range.startDate ? [format(range.startDate, "yyyy-MM-dd")] : []
                  );
                }
                handleCloseDateModal();
              }}
              initialRange={{
                startDate:
                  values.dates[0] && values.isMultiple
                    ? new Date(values.dates[0])
                    : values.dates[0]
                      ? new Date(values.dates[0])
                      : null,
                endDate:
                  values.dates[1] && values.isMultiple
                    ? new Date(values.dates[1])
                    : null,
              }}
              singleDateMode={!values.isMultiple}
            />
            <FormActionBar onCancel={onCancel} cancelLabel="Back">
              <Button
                type="submit"
                variant="filled"
                fullWidth={false}
                rounded="full"
                className="px-8"
                label={
                  initialValues?.name ? "Update Holiday" : "Create Holiday"
                }
                isLoading={isSubmitting}
                disabled={isSubmitting || !isValid}
              />
            </FormActionBar>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default CreateHoliday;
