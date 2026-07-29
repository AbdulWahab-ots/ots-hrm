import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "./features/auth/authSlice";
import globalReducer from "./features/global/globalSlice"
import departmentReducer from "./features/admin/department/departmentSlice";
import designationReducer from "./features/admin/designation/designationSlice";
import AttendanceReducer from "./features/employee/attendance/attendanceSlice";
import countryReducer from "./features/admin/countrySlice";
import leaveTypeReducer from "./features/admin/leaveTypeSlice";
// import { setIsLoading } from "./features/global/globalSlice";
import shiftReducer from "./features/admin/Shift/shiftSlice";
import benefitReducer from "./features/admin/Benefit/benefitSlice";
// Admin Imports
import adminRolesReducer from "./features/admin/roles/rolesSlice";
// import adminCourseReducer from "./features/admin/course/adminCourseSlice";
// import adminChecklistReducer from "./features/admin/checklist/adminChecklistSlice"
// import adminMarketingReducer from "./features/admin/marketing/adminMarketingSlice"
// import adminCategoryReducer from "./features/admin/category/adminCategorySlice"
// import adminExpenseReducer from "./features/admin/expense/adminExpenseSlice";
// import adminPharmacyReducer from "./features/admin/pharmacy/adminPharmacySlice";

// Pharmacy Imports
// import pharmacyExpenseReducer from "./features/pharmacy/expense/pharmacyExpenseSlice";
// import operationsExpenseReducer from "./features/pharmacy/operations/operationsExpenseSlice"
// import pharmacyOnboardingExpenseReducer from "./features/pharmacy/onboarding/pharmacyOnboardingExpenseSlice"
// import pharmacyCourseReducer from "./features/pharmacy/course/pharmacyCourseSlice"
// import pharmacyMarketingReducer from "./features/pharmacy/marketing/pharmacyMarketingSlice"
// import pharmacyDocumentVerificationReducer from "./features/pharmacy/document/DocumentVerificationSlice"
import attendanceRequestReducer from "./features/admin/attendanceRequestSlice";
const rootReducer = combineReducers({
    auth: authReducer,
    global: globalReducer,
    department: departmentReducer,
    designation: designationReducer,
  country: countryReducer,
  leaveType: leaveTypeReducer,
 shift: shiftReducer,
  benefit: benefitReducer,
    // Admin Reducers
  roles: adminRolesReducer,
   attendanceRequest: attendanceRequestReducer, 
    // course: adminCourseReducer,
    // checklist: adminChecklistReducer,
    // marketing: adminMarketingReducer,
    // category: adminCategoryReducer,
    // expense: adminExpenseReducer,
    // pharmacy: adminPharmacyReducer,

    // Employeee Reducers
    attendance: AttendanceReducer,
    // operations: operationsExpenseReducer,
    // onboarding: pharmacyOnboardingExpenseReducer,
    // pharmacyCourse: pharmacyCourseReducer,
    // pharmacyMarketing: pharmacyMarketingReducer,
    // DocumentVerification: pharmacyDocumentVerificationReducer,

});

export default rootReducer;
