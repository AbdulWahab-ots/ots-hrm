export interface ISkillRequest {
    name: string;
    key?: string;
    description?: string;
    scaleMin?: number;
    scaleMax?: number;
    weight?: number;
    sortOrder?: number;
    active?: boolean;
}
