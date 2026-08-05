// LeaveType rows are freeform, company-configured (no fixed "kind" enum/code), so
// tenure-restricted leave types are identified by name - same convention already used
// elsewhere in this codebase for matching a shift's display kind by name substring.
// Shared between LeaveTypeService (dropdown/list filtering) and VacationService
// (submission-time validation) so the two can never drift apart.
export function requiresOneYearTenure(leaveTypeName: string | undefined | null): boolean {
    return (leaveTypeName ?? '').toLowerCase().includes('annual');
}
