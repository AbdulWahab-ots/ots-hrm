import { DependencyContainer } from 'tsyringe'
import { CompanyController } from '../company-controller'
import { UserController } from '../user-controller';
import { UploadController } from '../upload-controller';
import { PrivilegeController } from '../privilege-controller';
import { RoleController } from '../role-controller';
import { ToDoController } from '../todo-controller';
import { AuthController } from '../auth-controller';
import { DepartmentController } from '../deparment-controller';
import { DesignationController } from '../designation-controller';
import { CandidateController } from '../candidate-controller';
import { ProjectController } from '../project-controller';
import { PerfSkillController } from '../perf-skill-controller';
import { PerfAssessmentController } from '../perf-assessment-controller';
import { CountryController } from '../country-controller';
import { LeaveTypeController } from '../leave-type-controller';
import { PublicHolidayController } from '../public-holiday-controller';
import { WorkingDaysController } from '../working-days-controller';
import { ShiftController } from '../shift-controller';
import { UserShiftController } from '../user-shift-controller';
import { EmployeeController } from '../employee-controller';
import { AttendanceController } from '../attendance-controller';
import { VacationController } from '../vacation-controller';
import { HookController } from '../hook-controller';
import { MasterEnumController } from '../master-enum-controller';
import { InviteController } from '../invite-controller';
import { RequestController } from '../request-controller';
import { BenefitController } from '../benefit-controller';
import { EmployeeBenefitController } from '../employee-benefit-controller';
import { PayrollController } from '../payroll-controller';
import { AttendanceSummaryController } from '../attendance-summary-controller';
import { AnnouncementController } from '../announcement-controller';
import { NotificationController } from '../notification-controller';

export const registerControllers = (container: DependencyContainer) => {
    container.register<HookController>('HookController', HookController);
    container.register<CompanyController>('CompanyController', CompanyController);
    container.register<UploadController>('UploadController', UploadController);
    container.register<MasterEnumController>('MasterEnumController', MasterEnumController);
    container.register<CountryController>('CountryController', CountryController);
    container.register<PrivilegeController>('PrivilegeController', PrivilegeController);
    container.register<ToDoController>('ToDoController', ToDoController);
    container.register<RoleController>('RoleController', RoleController);
    container.register<AuthController>('AuthController', AuthController);
    container.register<DepartmentController>('DepartmentController', DepartmentController);
    container.register<DesignationController>('DesignationController', DesignationController);
    container.register<CandidateController>('CandidateController', CandidateController);
    container.register<ProjectController>('ProjectController', ProjectController);
    container.register<PerfSkillController>('PerfSkillController', PerfSkillController);
    container.register<PerfAssessmentController>('PerfAssessmentController', PerfAssessmentController);
    container.register<LeaveTypeController>('LeaveTypeController', LeaveTypeController);
    container.register<PublicHolidayController>('PublicHolidayController', PublicHolidayController);
    container.register<WorkingDaysController>('WorkingDaysController', WorkingDaysController);
    container.register<ShiftController>('ShiftController', ShiftController);
    container.register<UserShiftController>('UserShiftController', UserShiftController);
    container.register<EmployeeController>('EmployeeController', EmployeeController);
    container.register<AttendanceController>('AttendanceController', AttendanceController);
    container.register<VacationController>('VacationController', VacationController);
    container.register<InviteController>('InviteController', InviteController);
    container.register<RequestController>('RequestController', RequestController);
    container.register<BenefitController>('BenefitController', BenefitController);
    container.register<EmployeeBenefitController>('EmployeeBenefitController', EmployeeBenefitController);
    container.register<PayrollController>('PayrollController', PayrollController);
    container.register<AttendanceSummaryController>('AttendanceSummaryController', AttendanceSummaryController);
    container.register<AnnouncementController>('AnnouncementController', AnnouncementController);
    container.register<NotificationController>('NotificationController', NotificationController);

    return {
        hookController: container.resolve(HookController),
        companyController: container.resolve(CompanyController),
        countryController: container.resolve(CountryController),
        uploadController: container.resolve(UploadController),
        masterEnumController: container.resolve(MasterEnumController),
        userController: container.resolve(UserController),
        privilegeController: container.resolve(PrivilegeController),
        roleController: container.resolve(RoleController),
        toDoController: container.resolve(ToDoController),
        authController: container.resolve(AuthController),
        departmentController: container.resolve(DepartmentController),
        designationController: container.resolve(DesignationController),
        candidateController: container.resolve(CandidateController),
        projectController: container.resolve(ProjectController),
        perfSkillController: container.resolve(PerfSkillController),
        perfAssessmentController: container.resolve(PerfAssessmentController),
        leaveTypeController: container.resolve(LeaveTypeController),
        publicHolidayController: container.resolve(PublicHolidayController),
        workingDaysController: container.resolve(WorkingDaysController),
        shiftController: container.resolve(ShiftController),
        userShiftController: container.resolve(UserShiftController),
        employeeController: container.resolve(EmployeeController),
        attendanceController: container.resolve(AttendanceController),
        vacationController: container.resolve(VacationController),
        inviteController: container.resolve(InviteController),
        requestController: container.resolve(RequestController),
        benefitController: container.resolve(BenefitController),
        employeeBenefitController: container.resolve(EmployeeBenefitController),
        payrollController: container.resolve(PayrollController),
        attendanceSummaryController: container.resolve(AttendanceSummaryController),
        announcementController: container.resolve(AnnouncementController),
        notificationController: container.resolve(NotificationController)
    }

}