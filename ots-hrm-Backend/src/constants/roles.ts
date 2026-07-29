export enum DefaultRoles {
    SuperAdmin = "superAdmin",
    Admin = "admin", 
    Employee = "employee"
}

export const DefaultRoleDetails = {
    [DefaultRoles.SuperAdmin]: {
        name: "Super Admin",
        code: "superAdmin",
        description: "Full system access with all privileges"
    },
    [DefaultRoles.Admin]: {
        name: "Admin",
        code: "admin",
        description: "Company administrator with management privileges"
    },
    [DefaultRoles.Employee]: {
        name: "Employee", 
        code: "employee",
        description: "Standard employee with basic privileges"
    }
} as const;
