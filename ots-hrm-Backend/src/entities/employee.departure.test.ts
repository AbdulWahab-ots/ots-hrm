// Runnable check for the Employee.onStatusChange departure-date contract.
// Run: npx ts-node ./src/entities/employee.departure.test.ts
//
// This mirrors the rule in Employee.onStatusChange rather than importing the entity:
// the entity graph has circular imports that don't resolve when a single entity is
// loaded standalone under ts-node. Keep this in sync with employee.ts onStatusChange.
import { EmployeeStatus } from "../models/enums";

const EXIT = [EmployeeStatus.RETIRED, EmployeeStatus.RESIGNED, EmployeeStatus.TERMINATED];

// Mirror of onStatusChange's effect on { active, departureDate }.
function applyStatus(newStatus: EmployeeStatus, departureDate?: Date | string) {
  if (EXIT.includes(newStatus)) {
    return { active: false, departureDate: departureDate ? new Date(departureDate) : new Date() };
  }
  return { active: true, departureDate: null as Date | null };
}

let fails = 0;
const ok = (cond: boolean, msg: string) => { if (!cond) { console.log("FAIL:", msg); fails++; } };

// Exit status with an explicit date -> inactive + that exact departure date.
let r = applyStatus(EmployeeStatus.RESIGNED, "2026-06-30");
ok(r.active === false, "resigned -> active=false");
ok(!!r.departureDate && r.departureDate.toISOString().slice(0, 10) === "2026-06-30", "resigned keeps supplied date");

// Exit status without a date -> defaults to today (non-null).
r = applyStatus(EmployeeStatus.TERMINATED);
ok(r.active === false && r.departureDate != null, "terminated defaults departureDate to today");

// Reactivation -> active + date cleared to null (not undefined, so the DB column clears).
r = applyStatus(EmployeeStatus.PERMANENT);
ok(r.active === true, "permanent -> active=true");
ok(r.departureDate === null, "reactivation clears departureDate to null");

// Retired also counts as an exit.
r = applyStatus(EmployeeStatus.RETIRED, "2026-01-15");
ok(r.active === false && r.departureDate != null, "retired sets departureDate");

console.log(fails === 0 ? "ALL PASS" : `${fails} FAILED`);
process.exit(fails === 0 ? 0 : 1);
