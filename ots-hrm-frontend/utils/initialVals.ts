import { ForgotPasswordFormValues, SignInFormValues, SignUpFormValues, SignUpWithInvitePayload } from "./types";

export const signInInitialVals: SignInFormValues = {
    userName: "",
    password: "",
    // rememberMe: false,
};

export const signUpInitialVals: SignUpFormValues = {
    firstName: "",
    lastName: "",
    userName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
};

export const forgotPasswordInitialVals: ForgotPasswordFormValues = {
    email: "",
};

export const ResetFormValues = {
    newPassword: "",
    confirmPassword: "",
};

export const designationInitialVals = {
    title: "",
    departmentId: "",
    status: "",
};

export const newLeaveTypeInitialVals = {
    name: "",
    maxDaysPerYear: "",
};

export const departmentInitialVals = {
    name: "",
    status: "",
};

export const employeeInitialVals = {
    firstName: "",
    lastName: "",
    joiningDate: "",
    userName: "",
    email: "",
    password: "",
    confirmPassword: "",
    employeeCode: "",
    departmentId: "",
    designationId: "",
    status: "",
    phoneNumber: "",
};

export const employeeLeaveInitialVals = {
    typeId: "",
    fromDate: "",
    toDate: "",
    reason: "",
};


// src/utils/initialVals.ts
export const signUpInviteInitialVals = {
  inviteToken: "", // Added inviteToken
  firstName: "",
  lastName: "",
  userName: "",
  password: "",
  confirmPassword: "", // Added confirmPassword for form validation
};