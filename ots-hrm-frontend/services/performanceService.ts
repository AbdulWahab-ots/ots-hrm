import { apiHandler } from "@/services/adminServices";
import { AppDispatch } from "@/store/store";
import { Assessment, AssessmentPayload, Skill, SkillPayload } from "@/utils/performanceTypes";

interface ListResult<T> {
  result: { data: T[]; total: number };
}
interface OneResult<T> {
  result: T;
}

// ─── Skills ──────────────────────────────────────────────────────────────────

export const getSkillsAPI = async (dispatch: AppDispatch): Promise<Skill[]> => {
  const res = await apiHandler<ListResult<Skill>>(dispatch, "post", "/perf-skill/get_all", {
    data: {
      pagedListRequest: { pageNo: 1, pageSize: 200, getAllRecords: true },
      queryOptionsRequest: { sortRequest: [{ field: "sortOrder", direction: 1, priority: 1 }] },
    },
    showSuccessToast: false,
  });
  return res?.result?.data ?? [];
};

export const createSkillAPI = async (dispatch: AppDispatch, payload: SkillPayload): Promise<boolean> => {
  const res = await apiHandler(dispatch, "post", "/perf-skill/add", {
    data: payload,
    successMessage: "Skill added",
    showSuccessToast: true,
  });
  return !!res;
};

export const updateSkillAPI = async (
  dispatch: AppDispatch,
  payload: Partial<SkillPayload>,
  id: string
): Promise<boolean> => {
  const res = await apiHandler(dispatch, "put", `/perf-skill/update/${id}`, {
    data: payload,
    successMessage: "Skill updated",
    showSuccessToast: true,
  });
  return !!res;
};

export const deleteSkillAPI = async (dispatch: AppDispatch, id: string): Promise<boolean> => {
  const res = await apiHandler(dispatch, "delete", `/perf-skill/delete/${id}`, {
    successMessage: "Skill removed",
    showSuccessToast: true,
  });
  return !!res;
};

// ─── Assessments ─────────────────────────────────────────────────────────────

export const getEmployeeAssessmentsAPI = async (
  dispatch: AppDispatch,
  employeeId: string
): Promise<Assessment[]> => {
  const res = await apiHandler<{ result: Assessment[] }>(
    dispatch,
    "get",
    `/perf-assessment/employee/${employeeId}`,
    { showSuccessToast: false }
  );
  return res?.result ?? [];
};

export const saveAssessmentAPI = async (
  dispatch: AppDispatch,
  payload: AssessmentPayload
): Promise<boolean> => {
  const res = await apiHandler(dispatch, "post", "/perf-assessment/add", {
    data: payload,
    successMessage: "Assessment saved",
    showSuccessToast: true,
  });
  return !!res;
};

export const deleteAssessmentAPI = async (dispatch: AppDispatch, id: string): Promise<boolean> => {
  const res = await apiHandler(dispatch, "delete", `/perf-assessment/delete/${id}`, {
    successMessage: "Assessment deleted",
    showSuccessToast: true,
  });
  return !!res;
};
