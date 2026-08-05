import { CompanyRepository } from "../dal";

const CODE_PREFIX = 'EMP-';
const PAD_WIDTH = 3;

function formatEmployeeCode(num: number): string {
    return `${CODE_PREFIX}${String(num).padStart(PAD_WIDTH, '0')}`;
}

// Extracts the trailing number from a code matching the "EMP-NNN" convention, or null
// if it doesn't match (e.g. a freeform manually-typed code in some other shape) - the
// counter can't be synced from a code it can't parse a number out of.
function parseEmployeeCodeNumber(code: string): number | null {
    const match = code.match(/^EMP-(\d+)$/);
    return match ? parseInt(match[1], 10) : null;
}

/**
 * Read-only preview of the next Employee Code, for pre-filling the Create Employee
 * form. Does NOT reserve/consume the number - repeatedly loading (or abandoning) the
 * form never creates gaps in the sequence, since nothing is written until an employee
 * is actually created.
 */
export async function previewNextEmployeeCode(companyRepository: CompanyRepository, companyId: string): Promise<string> {
    const counter = await companyRepository.getEmployeeCodeCounter(companyId);
    return formatEmployeeCode(counter + 1);
}

/**
 * Atomically reserves and returns the next Employee Code, for when the caller creates
 * an employee without supplying one. Backed by a single `UPDATE ... RETURNING` on the
 * company's counter (see CompanyRepository.reserveNextEmployeeCodeNumber) - Postgres's
 * row-level locking serializes concurrent calls, so two employees created at the same
 * instant can never be handed the same code.
 *
 * The counter lives on Company, independent of the Employee table, so it survives a
 * resigned or (in the rare no-history case) hard-deleted employee - the number is
 * never reissued.
 */
export async function reserveNextEmployeeCode(companyRepository: CompanyRepository, companyId: string): Promise<string> {
    const num = await companyRepository.reserveNextEmployeeCodeNumber(companyId);
    return formatEmployeeCode(num);
}

/**
 * Call after successfully creating (or updating) an employee with an explicitly-
 * provided employeeCode (a manual override, or an unmodified auto-suggestion sent back
 * as-is). If the code follows the "EMP-NNN" convention and its number is higher than
 * the counter, moves the counter up to match - so a manually typed jump-ahead code
 * (e.g. EMP-050 when the counter was only at 10) is correctly reflected in future
 * suggestions (EMP-051 next), without ever moving the counter backwards. A no-op for
 * codes that don't match the convention at all.
 */
export async function syncEmployeeCodeCounter(
    companyRepository: CompanyRepository,
    companyId: string,
    providedCode: string
): Promise<void> {
    const num = parseEmployeeCodeNumber(providedCode);
    if (num === null) return;
    await companyRepository.bumpEmployeeCodeCounterIfHigher(companyId, num);
}
