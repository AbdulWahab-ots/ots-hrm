// Types for the admin-only Employee Performance feature.

export interface Skill {
  id: string;
  name: string;
  key: string;
  description?: string;
  scaleMin: number;
  scaleMax: number;
  weight: number;
  sortOrder?: number;
  active: boolean;
}

export interface SkillPayload {
  name: string;
  scaleMin?: number;
  scaleMax?: number;
  weight?: number;
  sortOrder?: number;
  active?: boolean;
}

export interface AssessmentScore {
  id: string;
  skillId: string;
  score: number;
  skill?: {
    id: string;
    name: string;
    key: string;
    scaleMin: number;
    scaleMax: number;
    weight: number;
  };
}

export interface Assessment {
  id: string;
  employeeId: string;
  assessedOn: string;
  assessor?: string;
  note?: string;
  scores: AssessmentScore[];
  overall: number;
}

export interface AssessmentPayload {
  employeeId: string;
  assessedOn: string;
  assessor?: string;
  note?: string;
  scores: { skillId: string; score: number }[];
}
