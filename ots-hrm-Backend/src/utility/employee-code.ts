import { EmployeeRepository } from "../dal";

/**
 * Generate the next per-company employee code, e.g. "EMP-001".
 *
 * Single source of truth for both the admin "add employee" flow and invite signup,
 * which previously had divergent logic (the invite path counted only non-deleted rows
 * and had no collision check, so it could reissue an existing code after a soft-delete).
 *
 * Counts ALL employees (including soft-deleted) so a deletion can't free up a number,
 * then bumps past any code that already exists.
 *
 * ponytail: tiny race window if two employees are created at the exact same moment
 * (both read the same count). Harmless at HR scale; a UNIQUE(companyId, employeeCode)
 * index is the real guard if it ever matters.
 */
export async function generateEmployeeCode(
    employeeRepository: EmployeeRepository,
    companyId: string
): Promise<string> {
    const count = await employeeRepository.entityCount({ companyId } as any);
    let num = count + 1;
    let code = `EMP-${String(num).padStart(3, '0')}`;
    while ((await employeeRepository.entityCount({ companyId, employeeCode: code } as any)) > 0) {
        num++;
        code = `EMP-${String(num).padStart(3, '0')}`;
    }
    return code;
}
