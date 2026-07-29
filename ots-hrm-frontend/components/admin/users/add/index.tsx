"use client";
import React from "react";
import { Formik, Form, FormikHelpers } from "formik";
import * as Yup from "yup";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";
import InputField from "@/components/common/form/InputField";
import Dropdown from "@/components/common/form/DropDown";
import Button from "@/components/common/Button";
import { createUserAPI } from "@/services/adminServices";

// Employee logins are created via the "Create Employee" flow (Employees section),
// which also creates the linked Employee record — Add User only creates a bare
// login account, so Employee is intentionally not offered as a role here.
const roleOptions = [{ value: "admin", label: "Admin" }];

interface AddUserValues {
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
}

const initialValues: AddUserValues = {
  firstName: "",
  lastName: "",
  userName: "",
  email: "",
  password: "",
  confirmPassword: "",
  role: "admin",
};

// Mirrors the backend createUserSchema so client + server validation agree.
const validationSchema = Yup.object({
  firstName: Yup.string()
    .required("First name is required")
    .matches(/^[a-zA-Z\s]+$/, "First name can only contain letters and spaces"),
  lastName: Yup.string()
    .required("Last name is required")
    .matches(/^[a-zA-Z\s]+$/, "Last name can only contain letters and spaces"),
  userName: Yup.string()
    .required("Username is required")
    .min(3, "Username must be at least 3 characters")
    .matches(/^[a-zA-Z0-9._-]+$/, "Only letters, numbers, dots, hyphens and underscores"),
  email: Yup.string().required("Email is required").email("Invalid email format"),
  password: Yup.string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
      "Must include upper, lower, a number and a special character"
    ),
  confirmPassword: Yup.string()
    .required("Please confirm the password")
    .oneOf([Yup.ref("password")], "Passwords do not match"),
  role: Yup.string().required("Role is required").oneOf(["admin"]),
});

function AddUser() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const handleSubmit = async (
    values: AddUserValues,
    helpers: FormikHelpers<AddUserValues>
  ) => {
    try {
      const res = await createUserAPI(dispatch, {
        userName: values.userName,
        email: values.email,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
        role: values.role,
      });
      if (res) {
        router.push("/admin/users");
      }
    } catch (error: any) {
      // Surface field-level errors returned by the backend, if any.
      if (error?.errors && Array.isArray(error.errors)) {
        helpers.setErrors(
          error.errors.reduce(
            (acc: any, e: { field: string; message: string }) => ({
              ...acc,
              [e.field]: e.message,
            }),
            {}
          )
        );
      } else {
        helpers.setStatus("Could not create the user. Please try again.");
      }
    } finally {
      helpers.setSubmitting(false);
    }
  };

  return (
    <div className="rounded-[var(--g-radius-md)] p-6 bg-g-background-100 space-y-6 shadow-geist-card border border-g-gray-alpha-400">
      <div>
        <h1 className="text-heading-24 text-g-gray-1000">Add User</h1>
        <p className="text-label-13 text-g-gray-700 mt-1">
          Create a login account and assign a role.
        </p>
        <div className="border-b border-g-gray-alpha-400 w-full my-3" />
      </div>

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, values, setFieldValue, errors, touched, status }) => (
          <Form>
            {status && (
              <p className="mb-4 text-label-14 text-g-red-700">{status}</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="First Name" name="firstName" />
              <InputField label="Last Name" name="lastName" />
              <InputField label="User Name" name="userName" />
              <InputField label="Email" name="email" type="email" />
              <InputField label="Password" name="password" type="password" />
              <InputField
                label="Confirm Password"
                name="confirmPassword"
                type="password"
              />
              <div>
                <Dropdown
                  id="role"
                  name="role"
                  label="Role"
                  options={roleOptions}
                  value={values.role}
                  onChange={(e: { target: { value: string } }) =>
                    setFieldValue("role", e.target.value)
                  }
                />
                {touched.role && errors.role && (
                  <p className="mt-1 text-label-13 text-g-red-700">{errors.role}</p>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-4 justify-center md:flex-row md:justify-end mt-6">
              <Button
                label="Cancel"
                variant="outline"
                type="button"
                onClick={() => router.push("/admin/users")}
              />
              <Button
                className="md:max-w-36"
                type="submit"
                label={isSubmitting ? "Saving..." : "Save"}
                disabled={isSubmitting}
              />
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}

export default AddUser;
