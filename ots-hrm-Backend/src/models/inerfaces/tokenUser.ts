export interface ITokenUser {
    id: string;
    name: string;
    companyId: string;
    roleId: string;
    role: string;
    employeeId?: string;
    privileges: Array<string>
}