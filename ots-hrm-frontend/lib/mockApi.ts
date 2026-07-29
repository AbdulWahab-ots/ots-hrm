import { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import * as mock from "./mockData";

// A hand-rolled axios adapter that answers every request from in-memory fixtures
// instead of hitting the real backend. Wired in from lib/api.ts behind
// NEXT_PUBLIC_USE_MOCK_API. Resets on every full page reload.

const NETWORK_DELAY_MS = 150;

function parsePath(config: AxiosRequestConfig): string {
  let url = config.url || "";
  const base = (config.baseURL || "").replace(/\/+$/, "");
  if (base && url.startsWith(base)) url = url.slice(base.length);
  url = url.split("?")[0];
  return url.replace(/^\/+/, "").replace(/\/+$/, "");
}

function parseBody(config: AxiosRequestConfig): any {
  const data = config.data;
  if (!data) return {};
  if (typeof FormData !== "undefined" && data instanceof FormData) return data;
  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
  }
  return data;
}

function ok(config: AxiosRequestConfig, data: any, status = 200): Promise<AxiosResponse> {
  const response: AxiosResponse = {
    data,
    status,
    statusText: "OK",
    headers: {},
    config: config as any,
    request: {},
  };
  return new Promise((resolve) => setTimeout(() => resolve(response), NETWORK_DELAY_MS));
}

function fail(config: AxiosRequestConfig, status: number, data: any): Promise<never> {
  const response: AxiosResponse = {
    data,
    status,
    statusText: status === 401 ? "Unauthorized" : status === 404 ? "Not Found" : "Error",
    headers: {},
    config: config as any,
    request: {},
  };
  const error = new AxiosError(data?.message || "Request failed", String(status), config as any, {}, response);
  return new Promise((_, reject) => setTimeout(() => reject(error), NETWORK_DELAY_MS));
}

const success = (message: string, result: any) => ({ success: true, message, result });

function paginate(items: any[], body: any) {
  const paged = body?.pagedListRequest || {};
  const total = items.length;
  const pageSize = paged.getAllRecords ? Math.max(total, 1) : paged.pageSize || 10;
  const pageNo = paged.pageNo || 1;
  const start = (pageNo - 1) * pageSize;
  const pageItems = paged.getAllRecords ? items : items.slice(start, start + pageSize);
  return {
    data: pageItems,
    total,
    pageStartsFrom: total === 0 ? 0 : start + 1,
    pageEndsAt: Math.min(start + pageItems.length, total),
    numberOfPages: Math.max(1, Math.ceil(total / (pageSize || 1))),
  };
}

function currentUserFromAuthHeader(config: AxiosRequestConfig) {
  const authHeader = (config.headers as any)?.Authorization || (config.headers as any)?.authorization;
  const token = typeof authHeader === "string" ? authHeader.replace(/^Bearer\s+/i, "") : "";
  const userId = token.startsWith("mock-token-") ? token.slice("mock-token-".length) : "";
  return mock.users.find((u) => u.id === userId) || mock.adminUser;
}

const RESOURCE_STORES: Record<string, any[]> = {
  department: mock.departments,
  designation: mock.designations,
  role: mock.roles,
  shift: mock.shifts,
  benefit: mock.benefits,
  "leave-type": mock.leaveTypes,
  "public-holiday": mock.holidays,
  employee: mock.employees,
  user: mock.users,
  invite: mock.invites,
  company: mock.companies,
  country: mock.countries,
  vacation: mock.vacations,
  request: mock.requests,
  payroll: mock.payrolls,
  attendance: mock.attendanceRecords,
};

function genericCrud(resource: string, store: any[], rest: string[], method: string, body: any) {
  const action = rest[0];

  if (action === "get_all" && method === "post") {
    return success("Fetched successfully", paginate(store, body));
  }

  if (action === "get_by_id" && method === "get") {
    const id = rest[1];
    if (resource === "department" && rest[2] === "designations") {
      return success("Fetched successfully", mock.designations.filter((d) => d.departmentId === id));
    }
    const item = store.find((x) => x.id === id) || store[0] || null;
    return success("Fetched successfully", item);
  }

  if (action === "add" && method === "post") {
    if (resource === "user" && Array.isArray(body?.users)) {
      const created = body.users.map((u: any) => {
        const item = { id: mock.genId(resource), companyId: mock.COMPANY_ID, active: true, createdAt: mock.now(), ...u };
        store.push(item);
        return item;
      });
      return success("Created successfully", created);
    }
    if (resource === "invite" && Array.isArray(body?.invites)) {
      const created = body.invites.map((inv: any) => {
        const item = { id: mock.genId(resource), companyId: mock.COMPANY_ID, status: "PENDING", createdAt: mock.now(), ...inv };
        store.push(item);
        return item;
      });
      return success("Invited successfully", created);
    }
    const item = { id: mock.genId(resource), companyId: mock.COMPANY_ID, active: true, createdAt: mock.now(), ...body };
    store.push(item);
    return success("Created successfully", item);
  }

  if (action === "update" && method === "put") {
    const id = rest[1] === "status" ? rest[2] : rest[1];
    const idx = store.findIndex((x) => x.id === id);
    if (idx > -1) store[idx] = { ...store[idx], ...body, modifiedAt: mock.now() };
    return success("Updated successfully", idx > -1 ? store[idx] : { id, ...body });
  }

  if (action === "delete" && method === "delete") {
    const id = rest[1];
    const idx = store.findIndex((x) => x.id === id);
    if (idx > -1) store.splice(idx, 1);
    return success("Deleted successfully", { id });
  }

  if (action === "resend" && method === "post") {
    return success("Invite resent successfully", { id: rest[1] });
  }

  return success("OK (unhandled mock route)", {});
}

export async function mockAdapter(config: AxiosRequestConfig): Promise<AxiosResponse> {
  const method = (config.method || "get").toLowerCase();
  const path = parsePath(config);
  const segments = path.split("/").filter(Boolean);
  const body = parseBody(config);

  console.info(`[mock-api] ${method.toUpperCase()} /${path}`);

  // ---- auth ----
  if (segments[0] === "auth") {
    const sub = segments[1];

    if (sub === "login" && method === "post") {
      const { userName, password } = body || {};
      const match = mock.DUMMY_CREDENTIALS.find(
        (c) => c.userName.toLowerCase() === String(userName || "").toLowerCase() && c.password === password
      );
      if (!match) return fail(config, 401, { message: "Invalid username or password" });
      const token = `mock-token-${match.user.id}`;
      return ok(config, success("Logged in successfully", { ...mock.userToProfile(match.user), token }));
    }

    if (sub === "signup" && method === "post") {
      const newUser = {
        id: mock.genId("user"),
        active: true,
        createdAt: mock.now(),
        createdBy: "System",
        createdById: "sys-0000",
        modifiedAt: null,
        modifiedBy: null,
        modifiedById: null,
        companyId: mock.COMPANY_ID,
        userName: body.userName,
        email: body.email,
        firstName: body.firstName,
        middleName: null,
        lastName: body.lastName,
        pictureUrl: null,
        dateOfBirth: null,
        gender: "other",
        status: 0,
        lastLogin: null,
        lastOnline: null,
        roleId: "role-employee",
        isGoogleSignup: false,
        isEmailVerified: "true",
        isPhoneVerified: null,
        phoneNumber: null,
      };
      mock.users.push(newUser);
      const token = `mock-token-${newUser.id}`;
      return ok(config, success("Signed up successfully", { ...mock.userToProfile(newUser as any), token }));
    }

    if (sub === "profile" && method === "get") {
      const user = currentUserFromAuthHeader(config);
      return ok(config, success("Fetched successfully", mock.userToProfile(user)));
    }

    if (sub === "verify" || sub === "resend-code" || sub === "forgot-password") {
      return ok(config, success("Done", {}));
    }

    if (sub === "reset-password" || sub === "signup-with-invite") {
      return ok(config, success("Done", {}));
    }

    if (sub === "logout") {
      return ok(config, success("Logged out successfully", {}));
    }
  }

  // ---- company statistics (used to gate onboarding) ----
  if (segments[0] === "company" && segments[1] === "statistics" && method === "get") {
    return ok(
      config,
      success("Fetched successfully", {
        departments: mock.departments.length,
        shifts: mock.shifts.length,
        leaveTypes: mock.leaveTypes.length,
        designations: mock.designations.length,
        benefits: mock.benefits.length,
      })
    );
  }

  // ---- countries: response is NOT wrapped in {success, result} per GetCountriesResponse ----
  if (segments[0] === "country" && segments[1] === "get_all" && method === "post") {
    return ok(config, paginate(mock.countries, body));
  }

  // ---- user profile-level actions ----
  if (segments[0] === "user" && segments[1] === "change-password" && method === "post") {
    return ok(config, success("Password changed successfully", {}));
  }

  // ---- uploads ----
  if (segments[0] === "upload") {
    return ok(config, success("Uploaded successfully", { url: "https://placehold.co/200x200?text=Mock" }));
  }

  // ---- employee stats ----
  if (segments[0] === "employee" && segments[1] === "stats" && method === "get") {
    return ok(
      config,
      success("Fetched successfully", {
        total: mock.employees.length,
        active: mock.employees.filter((e) => e.status === "ACTIVE").length,
      })
    );
  }

  // ---- attendance ----
  if (segments[0] === "attendance") {
    if (segments[1] === "status" && method === "get") {
      return ok(config, success("Fetched successfully", { status: "NOT_CLOCKED_IN", checkInTime: null, checkOutTime: null }));
    }
    if ((segments[1] === "check-in" || segments[1] === "check-out") && method === "post") {
      return ok(config, success("Recorded successfully", {}));
    }
    if (segments[1] === "stats" && method === "post") {
      return ok(
        config,
        success("Fetched successfully", {
          present: mock.attendanceRecords.filter((a) => a.status === "PRESENT").length,
          late: mock.attendanceRecords.filter((a) => a.status === "Late").length,
          absent: mock.attendanceRecords.filter((a) => a.status === "Absent").length,
          onLeave: mock.attendanceRecords.filter((a) => a.status === "ON_LEAVE").length,
        })
      );
    }
  }

  // ---- requests approve/reject ----
  if (segments[0] === "request" && (segments[1] === "approve" || segments[1] === "reject") && method === "put") {
    const id = segments[2];
    const idx = mock.requests.findIndex((r) => r.id === id);
    if (idx > -1) mock.requests[idx] = { ...mock.requests[idx], status: segments[1] === "approve" ? "APPROVED" : "CANCELED", reviewNotes: body?.reviewNotes ?? null };
    return ok(config, success("Updated successfully", { success: true }));
  }

  // ---- vacation status update ----
  if (segments[0] === "vacation" && segments[1] === "update" && segments[2] === "status" && method === "put") {
    const id = segments[3];
    const idx = mock.vacations.findIndex((v) => v.id === id);
    if (idx > -1) mock.vacations[idx] = { ...mock.vacations[idx], status: body?.status, reason: mock.vacations[idx].reason };
    return ok(config, success("Updated successfully", { success: true }));
  }

  // ---- payroll extras ----
  if (segments[0] === "payroll") {
    if (segments[1] === "generate-salary-slips" && method === "post") return ok(config, success("Salary slips generated", {}));
    if (segments[1] === "status-update" && method === "post") {
      const idx = mock.payrolls.findIndex((p) => p.id === body?.payrollId);
      if (idx > -1) mock.payrolls[idx] = { ...mock.payrolls[idx], status: body?.status };
      return ok(config, success("Updated successfully", {}));
    }
    if (segments[1] === "adjustment" && method === "get") {
      const payroll = mock.payrolls.find((p) => p.id === segments[2]);
      return ok(config, success("Fetched successfully", payroll?.adjustments || []));
    }
    if (segments[1] === "adjustment" && method === "post") {
      const payroll = mock.payrolls.find((p) => p.id === segments[2]);
      if (payroll) payroll.adjustments.push(...(body?.adjustments || []));
      return ok(config, success("Added successfully", payroll?.adjustments || []));
    }
    if (segments[1] === "adjustment" && method === "delete") {
      mock.payrolls.forEach((p) => {
        p.adjustments = p.adjustments.filter((a: any) => a.id !== segments[2]);
      });
      return ok(config, success("Deleted successfully", {}));
    }
  }

  // ---- generic CRUD fallback for known list resources ----
  const store = RESOURCE_STORES[segments[0]];
  if (store) {
    return ok(config, genericCrud(segments[0], store, segments.slice(1), method, body));
  }

  console.warn(`[mock-api] no handler matched for ${method.toUpperCase()} /${path} - returning generic empty success`);
  return ok(config, success("OK (unhandled mock route)", { data: [], total: 0, pageStartsFrom: 0, pageEndsAt: 0, numberOfPages: 0 }));
}
