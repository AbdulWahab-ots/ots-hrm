import * as Yup from "yup";
export const createCompanyValidationSchema = Yup.object().shape({
  Name: Yup.string()
    .required('Company name is required')
    .min(2, 'Company name must be at least 2 characters')
    .max(50, 'Company name must not exceed 50 characters'),
  email: Yup.string()
    .required('Email is required')
    .email('Please enter a valid email address')
    .max(50, 'Email must not exceed 50 characters'),
 
});
export const getEmployeeValidationSchema = (isEdit: boolean) =>
  Yup.object().shape({
    firstName: Yup.string().required("First name is required"),
    lastName: Yup.string().required("Last name is required"),
    joiningDate: Yup.string().required("Joining date is required"),
      userName: Yup.string()
  .matches(/^\S+$/, "Username must not contain spaces")
  .required("Username is required"),

    email: Yup.string().email("Invalid email").required("Email is required"),
    password: isEdit
      ? Yup.string()
      : Yup.string()
          .min(8, "Password must be at least 8 characters")
          .required("Password is required"),
    confirmPassword: isEdit
      ? Yup.string()
      : Yup.string()
          .oneOf([Yup.ref("password")], "Passwords must match")
          .required("Confirm password is required"),
    departmentId: Yup.string().required("Department is required"),
    designationId: Yup.string().required("Designation is required"),
    status: Yup.string().required("Status is required"),
    phoneNumber: Yup.string().required("Phone number is required"),
    employeeCode: Yup.string().required("Employee code is required"),
  });

export const ForgotPasswordValidationSchema = Yup.object({
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
});


export const signInValidationSchema = Yup.object({
  // email: Yup.string()
  //   .email("Invalid email address")
  //   .required("Email is required"),
    userName: Yup.string()
  .matches(/^\S+$/, "Username must not contain spaces")
  .required("Username is required"),

  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

export const signUpValidationSchema = Yup.object({
  firstName: Yup.string().required("First Name is required"),
  lastName: Yup.string().required("Last Name is required"),
    userName: Yup.string()
  .matches(/^\S+$/, "Username must not contain spaces")
  .required("Username is required"),

  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match")
    .required("Confirm Password is required"),
  // agreeTerms: Yup.boolean()
  //   .oneOf([true], "You must accept the terms and conditions")
  //   .required("You must accept the terms and conditions"),
});

export const profileValidationSchema = Yup.object().shape({
  firstName: Yup.string().required("First name is required"),
  lastName: Yup.string().required("Last name is required"),
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  phone: Yup.string().required("Phone number is required"),
  address: Yup.string().required("Address is required"),
  country: Yup.string().required("Country is required"),
  state: Yup.string().required("State is required"),
  city: Yup.string().required("City is required"),
  postalCode: Yup.string().required("Postal code is required"),
  currentPassword: Yup.string().when({
    is: (val: string) => !!val,
    then: (schema) => schema.required("Current password is required"),
  }),
  newPassword: Yup.string().when("currentPassword", {
    is: (val: string) => !!val,
    then: (schema) =>
      schema
        .required("New password is required")
        .min(8, "Password must be at least 8 characters"),
  }),
  confirmPassword: Yup.string().when("newPassword", {
    is: (val: string) => !!val,
    then: (schema) =>
      schema
        .required("Confirm password is required")
        .oneOf([Yup.ref("newPassword")], "Passwords must match"),
  }),
});

export const OtpVerificationSchema = Yup.object({
  otp: Yup.string()
    .required("OTP is required")
    .matches(/^\d{6}$/, "OTP must be exactly 6 digits"),
})

export const ResetPasswordValidationSchema = Yup.object({
  newPassword: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], 'Passwords must match')
    .required('Confirm password is required'),
})

// Mirrors the backend's setPasswordSchema so client + server validation agree.
export const SetPasswordValidationSchema = Yup.object({
  newPassword: Yup.string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
      'Must include upper, lower, a number and a special character'
    ),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], 'Passwords must match')
    .required('Confirm password is required'),
})

export const addNewRoleValidationSchema = Yup.object().shape({
  name: Yup.string().required("Name is required")
});

export const addUserValidationSchema = Yup.object({
    username: Yup.string()
  .matches(/^\S+$/, "Username must not contain spaces")
  .required("Username is required"),

  email: Yup.string().email("Invalid email address").required("Email is required"),
  password: Yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match")
    .required("Confirm password is required"),
});

export const inviteUserValidationSchema = Yup.object({
  email: Yup.string().email("Invalid email address").required("Email is required"),
});

export const BasicInfoValidationSchema = Yup.object().shape({
  firstName: Yup
    .string()
    .required("First name is required")
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must be less than 50 characters")
    .matches(/^[aA-zZ\s]+$/, "Only alphabets are allowed for first name"),

  lastName: Yup
    .string()
    .required("Last name is required")
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must be less than 50 characters")
    .matches(/^[aA-zZ\s]+$/, "Only alphabets are allowed for last name"),

  email: Yup
    .string()
    .required("Email is required")
    .email("Please enter a valid email address")
    .max(100, "Email must be less than 100 characters"),
});

export const PasswordSecuritySchema = Yup.object().shape({
  currentPassword: Yup.string().required("Current password is required"),
  newPassword: Yup
    .string()
    .required("New password is required")
    .min(8, "Password must be at least 8 characters")   .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      "Password must contain at least one uppercase, one lowercase, one number and one special character"
    ),
  confirmPassword: Yup
    .string()
    .required("Please confirm your password")
    .oneOf([Yup.ref("newPassword")], "Passwords must match"),
});


export  const LeaveTypevalidationSchema = Yup.object().shape({
  name: Yup.string()
    .required("Leave type name is required")
    .min(1, "Leave type name cannot be empty"),
  maxDaysPerYear: Yup.number()
    .required("Max days per year is required")
    .min(1, "Max days must be at least 1")
    .max(365, "Max days per year cannot exceed 365"),
  maxConsecutiveDays: Yup.number()
    .required("Max consecutive days is required")
    .min(1, "Max consecutive days must be at least 1")
    .max(365, "Max consecutive days cannot exceed 365"),
  isPaid: Yup.boolean().required("Paid status is required"),
  requiresApproval: Yup.boolean().required("Approval status is required"),
  description: Yup.string(),
  departmentId: Yup.string()
    .required("Department is required")
    .notOneOf([""], "Please select a department"),
});
  export const addAdminValidationSchema = Yup.object({
  userName: Yup.string()
  .matches(/^\S+$/, "Username must not contain spaces")
  .required("Username is required")
    .max(50, "Username must be at most 50 characters"),
  email: Yup.string()
    .email("Invalid email")
    .required("Email is required"),
  firstName: Yup.string()
    .required("First Name is required")
    .max(50, "First Name must be at most 50 characters"),
  lastName: Yup.string()
    .required("Last Name is required")
    .max(50, "Last Name must be at most 50 characters"),
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .max(50, "Password must be at most 50 characters")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    )
    .when("$isEdit", {
      is: false,
      then: (schema) => schema.required("Password is required"),
      otherwise: (schema) => schema.optional(),
    }),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match")
    .when("$isEdit", {
      is: false,
      then: (schema) => schema.required("Confirm Password is required"),
      otherwise: (schema) => schema.optional(),
    }),
});

export const inviteAdminValidationSchema = Yup.object({
  email: Yup.string()
    .email("Invalid email")
    .required("Email is required"),
});

export const signupInviteValidationSchema = Yup.object({
  firstName: Yup.string().required("First name is required").min(3, "First name must be at most 3 characters").max(50, "First name must be at most 50 characters"),
  lastName: Yup.string().required("Last name is required").min(3, "Last name must be at most 3 characters").max(50, "Last name must be at most 50 characters"),
  userName: Yup.string().matches(/^\S+$/, "Username must not contain spaces")
.required("Username is required").min(3, "User name must be at most 3 characters").max(50, "Username must be at most 50 characters"),


  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    )
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match")
    .required("Confirm password is required"),
});

export const HolidayValidationSchema = Yup.object().shape({
  name: Yup.string().required("Holiday name is required"),
  dates: Yup.array()
    .of(Yup.string().required("Date is required"))
    .min(1, "At least one date is required"),
  type: Yup.string().required("Leave type is required"),
  whichCountryId: Yup.string().required("Country is required"),
  departmentId: Yup.string().required("department is required"),
  description: Yup.string(),
  isMultiple: Yup.boolean(),
});


export const ShiftValidationSchema = Yup.object().shape({
  name: Yup.string()
    .required("Shift name is required")
    .min(3, "Shift name must be at least 3 characters"),
  shiftType: Yup.string().required("Shift type is required"),
  startTime: Yup.string()
    .required("Start time is required")
    .matches(
      /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/,
      "Start time must be in HH:MM or HH:MM:SS format"
    ),
  endTime: Yup.string()
    .required("End time is required")
    .matches(
      /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/,
      "End time must be in HH:MM or HH:MM:SS format"
    ),
  breakDuration: Yup.number()
    .required("Break duration is required")
    .min(0, "Break duration cannot be negative"),
  departmentId: Yup.string().required("Department is required"),
});

// src/utils/validationSchema.ts


export const BenefitValidationSchema = Yup.object().shape({
  name: Yup.string().required("Benefit name is required"),
  type: Yup.string().required("Benefit type is required"),
  value: Yup.number()
    .required("Value is required")
    .min(0, "Value must be greater than or equal to 0"),
  valueType: Yup.string().required("Value type is required"),
  frequency: Yup.string().required("Frequency is required"),
  // startDate: Yup.string().required("Start date is required"),
  // endDate: Yup.string()
  //   .required("End date is required")
  //   .test(
  //     "is-after-start",
  //     "End date must be after start date",
  //     function (value) {
  //       const { startDate } = this.parent;
  //       if (!startDate || !value) return true;
  //       return new Date(value) > new Date(startDate);
  //     }
  //   ),
  departmentId: Yup.string().required("Department is required"),
  description: Yup.string().optional(),
});


// src/utils/validationSchema.ts


export const EmployeeValidationSchema = [
  // Step 1: Basic Info
  Yup.object({
    user: Yup.object({
   userName: Yup.string()
  .matches(/^\S+$/, "Username must not contain spaces")
  .required("Username is required"),

      firstName: Yup.string().required("First name is required"),
      lastName: Yup.string().required("Last name is required"),
      email: Yup.string().email("Invalid email").required("Email is required"),
      password: Yup.string()
        .min(8, "Password must be at least 8 characters")
        .matches(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
          "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
        )
        .required("Password is required"),
    }),
    phoneNumber: Yup.string().required("Phone number is required"),
    employeeCode: Yup.string()
      .matches(/^EMP-.+$/, "Employee code must be in format EMP-XXX")
      .required("Employee code is required"),
    departmentId: Yup.string().required("Department is required"),
    designationId: Yup.string().required("Designation is required"),
    shiftId: Yup.string().required("Shift is required"),
    joiningDate: Yup.string().required("Joining date is required"),
    status: Yup.string().required("Status is required"),
  }),
  // Step 2: Benefits Selection
  Yup.object({
    benefitId: Yup.string().required("Please select a benefit"),
  }),
  // Step 3: Salary and Bank Details
  Yup.object({
    salary: Yup.number()
      .min(0, "Salary must be a positive number")
      .required("Salary is required"),
    bankName: Yup.string().required("Bank name is required"),
    ibanNumber: Yup.string()
      .matches(
        /^PK\d{2}[A-Z0-9]{4}\d{16}$/,
        "IBAN must be in format PKXXBBBBXXXXXXXXXXXXXXXX (e.g., PK36SCBL0000001123456702)"
      )
      .required("IBAN number is required"),
    accountNumber: Yup.string()
      .matches(/^\d{12,16}$/, "Account number must be 12–16 digits")
      .required("Account number is required"),
  }),
];

// Editing an employee never sets/displays a password from this form — password changes
// only happen via the "Set Password" email flow — so step 1 drops that requirement.
export const EmployeeEditValidationSchema = [
  Yup.object({
    user: Yup.object({
      userName: Yup.string()
        .matches(/^\S+$/, "Username must not contain spaces")
        .required("Username is required"),
      firstName: Yup.string().required("First name is required"),
      lastName: Yup.string().required("Last name is required"),
      email: Yup.string().email("Invalid email").required("Email is required"),
    }),
    phoneNumber: Yup.string().required("Phone number is required"),
    employeeCode: Yup.string()
      .matches(/^EMP-.+$/, "Employee code must be in format EMP-XXX")
      .required("Employee code is required"),
    departmentId: Yup.string().required("Department is required"),
    designationId: Yup.string().required("Designation is required"),
    shiftId: Yup.string().required("Shift is required"),
    joiningDate: Yup.string().required("Joining date is required"),
    status: Yup.string().required("Status is required"),
  }),
  EmployeeValidationSchema[1],
  EmployeeValidationSchema[2],
];

export const InviteValidationSchema = Yup.object().shape({
  emailInput: Yup.string()
    .email("Please enter a valid email address")
    .required("Email is required"),
});


// /DesignationValidationSchema 


export const DesignationValidationSchema = Yup.object().shape({
  title: Yup.string()
    .required("Designation title is required")
    .min(2, "Designation title must be at least 2 characters")
    .max(100, "Designation title cannot exceed 100 characters"),
  departmentId: Yup.string().required("Department is required"),
});