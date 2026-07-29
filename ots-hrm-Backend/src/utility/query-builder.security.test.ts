/**
 * Regression test for the cross-tenant scope bypass in `queryOptionsMapper`.
 * Background: SECURITY-tenant-scope-bypass.md (cross-tenant data disclosure, CRITICAL).
 *
 * Security invariant: EVERY where-branch the mapper returns must carry the caller's
 * full tenant scope (companyId, plus active/deleted and any relation guards), and no
 * caller-supplied filter may remove it (Or / omitted operator) or overwrite it
 * (field:"companyId" / "active" / "deleted" / a guarded relation key). If any branch
 * loses a scope key, TypeORM ORs in an under-scoped branch -> cross-tenant / guard read.
 *
 * No test runner / DB needed: the mapper is pure. Run:
 *   npm test
 *   (or: npx ts-node src/utility/query-builder.tenant-scope.test.ts)
 */
import assert from "node:assert/strict";
import { queryOptionsMapper } from "./query-builder";
import { FilterMatchModes, FilterOperators } from "../models";

const CALLER = "company-A";
const VICTIM = "company-B";

type Opts = { active?: boolean; includes?: any; filterRelations?: boolean };
// dontGetDeleted is always true here (the app default), so `deleted:false` is always part of scope.
const map = (filters: any[], opts: Opts = {}) =>
    queryOptionsMapper(filters as any, opts.active ?? false, true, CALLER, opts.includes, opts.filterRelations ?? false) as any[];

const SCOPE = { companyId: CALLER, deleted: false };

/**
 * Assert every returned where-branch carries the expected tenant scope, un-overwritten,
 * and that the caller's own filter key(s) still take effect.
 */
function assertScoped(label: string, branches: any[], expectScope: Record<string, any>, expectKeys: string[] = []) {
    assert.ok(branches.length > 0, `${label}: mapper returned no where-branch`);
    for (const branch of branches) {
        for (const [key, value] of Object.entries(expectScope)) {
            assert.deepEqual(
                branch[key],
                value,
                `${label}: a where-branch dropped/overwrote scope key "${key}" ` +
                `(got ${JSON.stringify(branch[key])}, want ${JSON.stringify(value)}) -> TENANT BOUNDARY BREACH`,
            );
        }
    }
    for (const key of expectKeys) {
        assert.ok(branches.some((b) => key in b), `${label}: caller filter "${key}" was silently dropped`);
    }
}

const cases: Array<[string, () => void]> = [
    // --- Vector A: Or / omitted operator must not append an under-scoped branch ---
    ["Or-operator filter stays scoped", () =>
        assertScoped("Or filter", map([{ field: "name", matchMode: FilterMatchModes.Equal, value: "x", operator: FilterOperators.Or }]), SCOPE, ["name"])],
    ["omitted-operator filter stays scoped", () =>
        assertScoped("omitted operator", map([{ field: "name", matchMode: FilterMatchModes.Equal, value: "x" }]), SCOPE, ["name"])],
    ["Or-only filter is scoped and effective", () =>
        assertScoped("Or-only", map([{ field: "status", matchMode: FilterMatchModes.Equal, value: "active", operator: FilterOperators.Or }]), SCOPE, ["status"])],
    ["multiple Or branches are ALL scoped", () =>
        assertScoped("multi-Or", map([
            { field: "status", matchMode: FilterMatchModes.Equal, value: "active", operator: FilterOperators.Or },
            { field: "status", matchMode: FilterMatchModes.Equal, value: "pending", operator: FilterOperators.Or },
        ]), SCOPE, ["status"])], // 2 branches -> exercises the per-branch scope check across >1 branch

    // --- Vector B: caller cannot overwrite a scope key ---
    ["companyId overwrite via And is neutralised", () =>
        assertScoped("companyId And", map([{ field: "companyId", matchMode: FilterMatchModes.Equal, value: VICTIM, operator: FilterOperators.And }]), SCOPE)],
    ["companyId overwrite via omitted operator is neutralised", () =>
        assertScoped("companyId omitted", map([{ field: "companyId", matchMode: FilterMatchModes.Equal, value: VICTIM }]), SCOPE)],
    ["companyId overwrite via Or is neutralised", () =>
        assertScoped("companyId Or", map([{ field: "companyId", matchMode: FilterMatchModes.Equal, value: VICTIM, operator: FilterOperators.Or }]), SCOPE)],
    ["companyId NotEqual whole-table dump is neutralised", () =>
        assertScoped("companyId NotEqual", map([{ field: "companyId", matchMode: FilterMatchModes.NotEqual, value: CALLER }]), SCOPE)],
    ["deleted guard cannot be overwritten", () =>
        assertScoped("deleted overwrite", map([{ field: "deleted", matchMode: FilterMatchModes.Equal, value: true }]), SCOPE)],
    ["active guard cannot be overwritten", () =>
        assertScoped("active overwrite", map([{ field: "active", matchMode: FilterMatchModes.Equal, value: false }], { active: true }),
            { companyId: CALLER, active: true, deleted: false })],

    // relation guard: with filterRelations, a guarded relation key must keep its {companyId, deleted} guard,
    // not the caller's value.
    ["relation guard cannot be overwritten", () =>
        assertScoped("relation overwrite",
            map([{ field: "department", matchMode: FilterMatchModes.Equal, value: "x", operator: FilterOperators.And }],
                { includes: ["department"], filterRelations: true }),
            { companyId: CALLER, deleted: false, department: { deleted: false, companyId: CALLER } })],

    // --- semantics: scope AND (andFilters) AND (or1 OR or2) for DISTINCT fields ---
    ["mixed And+Or (distinct fields) stays scoped and keeps both filters", () =>
        assertScoped("mixed And+Or", map([
            { field: "name", matchMode: FilterMatchModes.Equal, value: "x", operator: FilterOperators.And },
            { field: "status", matchMode: FilterMatchModes.Equal, value: "active", operator: FilterOperators.Or },
        ]), SCOPE, ["name", "status"])],

    // Known, accepted limitation (Codex Q2): And+Or on the SAME field collapses by key (a flat
    // FindOptionsWhere can't hold two conditions on one field; the old code had this too, while leaking).
    // We only pin that the tenant scope still holds in this degenerate shape -- security, not the filter combo.
    ["same-field And+Or still keeps the tenant scope", () =>
        assertScoped("same-field And+Or", map([
            { field: "status", matchMode: FilterMatchModes.Equal, value: "active", operator: FilterOperators.And },
            { field: "status", matchMode: FilterMatchModes.Equal, value: "pending", operator: FilterOperators.Or },
        ]), SCOPE)],

    // control: an And filter is scoped on both old and new code (sanity that the harness can pass).
    ["And-operator control stays scoped", () =>
        assertScoped("And control", map([{ field: "name", matchMode: FilterMatchModes.Equal, value: "x", operator: FilterOperators.And }]), SCOPE, ["name"])],
];

let failed = 0;
for (const [name, run] of cases) {
    try {
        run();
        console.log(`ok   - ${name}`);
    } catch (e: any) {
        failed++;
        console.error(`FAIL - ${name}\n       ${e.message}`);
    }
}

if (failed) {
    console.error(`\n${failed}/${cases.length} tenant-scope assertions FAILED - tenant boundary breach present.`);
    process.exit(1);
}
console.log(`\nPASS: all ${cases.length} tenant-scope assertions hold - every where-branch keeps full tenant scope.`);
