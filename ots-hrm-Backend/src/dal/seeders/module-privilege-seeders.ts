import { DataSource } from "typeorm";
import { createPrivilegesForModule } from "./privilege-seeder";

export const createUserModulePrivileges = async (dataSource: DataSource) => {
  return await createPrivilegesForModule(dataSource, "Users");
};

export const createCompanyModulePrivileges = async (dataSource: DataSource) => {
  return await createPrivilegesForModule(dataSource, "Company");
};

export const createRoleModulePrivileges = async (dataSource: DataSource) => {
  return await createPrivilegesForModule(dataSource, "Roles");
};

export const createTodoModulePrivileges = async (dataSource: DataSource) => {
  return await createPrivilegesForModule(dataSource, "To-Dos");
};

export const createAttendanceModulePrivileges = async (dataSource: DataSource) => {
  return await createPrivilegesForModule(dataSource, "Attendance");
};

export const createLeaveModulePrivileges = async (dataSource: DataSource) => {
  return await createPrivilegesForModule(dataSource, "Leave");
};

export const createReportsModulePrivileges = async (dataSource: DataSource) => {
  return await createPrivilegesForModule(dataSource, "Reports");
};
