import { DataSource } from "typeorm";
import { log, error } from "console";
import path from "path";
import { Company, MasterEnum, Country, Privilege, Role, PublicHoliday, User, ToDo, ActivityLog, AuditLog, Verification, Department, Designation, LeaveType, Employee, Attendance, AttendanceBreak, Vacation, WorkingDays, Shift, UserShift, Scheduler, Invite, Request, Benefit, EmployeeBenefit, Payroll, PayrollAdjustment, AttendanceSummary, Announcement, Notification, Candidate, Project, Skill, Assessment, AssessmentScore } from "../../entities";
import pg from 'pg';
import { runAllSeeders } from "../seeders";
import { dbManager } from "../../utility/database-manager";
import { configManager, getTypeOrmConfig } from "../../config/db-env.config";

// Get database configuration
const dbConfig = getTypeOrmConfig();

// Resolve migrations relative to this file so it works both under ts-node
// (running .ts from src/) and when compiled (running .js from dist/).
const migrationsGlob = path.join(
    __dirname,
    "../migrations",
    __filename.endsWith(".ts") ? "*.ts" : "*.js"
);

export const dataSource = new DataSource({
    driver: pg,
    ...dbConfig,
    migrations: [migrationsGlob],
    entities: [ Company, Country, MasterEnum, User, Role, Privilege, ToDo, ActivityLog, AuditLog, Verification, Department, Designation, LeaveType, PublicHoliday, Employee, Attendance, AttendanceBreak, Vacation, WorkingDays, Shift, UserShift, Scheduler, Invite, Request, Benefit, EmployeeBenefit, Payroll, PayrollAdjustment, AttendanceSummary, Announcement, Notification, Candidate, Project, Skill, Assessment, AssessmentScore ]
});


const initializeDatabase = async () => {
    try {
        // Validate environment configuration first and log it
        const dbConfig = configManager.getDatabaseConfig(true);
        log("Environment configuration validated successfully!");
        
        // Initialize the database connection
        await dataSource.initialize();
        log("Database connection established successfully!");

        // Set the dataSource in database manager
        dbManager.setDataSource(dataSource);

        // Seeders completed successfully!");
        // await runAllSeeders(dataSource);

        // log("All database operations completed successfully!");
        return dataSource;
        
    } catch (err) {
        error("Error during database initialization:", err);
        
        // Attempt to close connection if it was partially established
        if (dataSource.isInitialized) {
            try {
                await dataSource.destroy();
                log("Database connection closed after error");
            } catch (closeErr) {
                error("Error closing database connection:", closeErr);
            }
        }
        
        // Exit the process or throw error based on your needs
        throw err;
    }
};

// Initialize database when module loads
initializeDatabase();

// Function to check database health
export const checkDatabaseHealth = async (): Promise<boolean> => {
    try {
        if (!dataSource.isInitialized) {
            return false;
        }
        
        await dataSource.query('SELECT 1');
        return true;
    } catch (err) {
        error("Database health check failed:", err);
        return false;
    }
};

// Function to get initialized dataSource
export const getDataSource = (): DataSource => {
    if (!dataSource.isInitialized) {
        throw new Error("Database not initialized yet. Please wait for initialization to complete.");
    }
    return dataSource;
};

// Function to gracefully close database connection
export const closeDatabaseConnection = async (): Promise<void> => {
    try {
        if (dataSource.isInitialized) {
            await dataSource.destroy();
            log("Database connection closed gracefully");
        }
    } catch (err) {
        error("Error closing database connection:", err);
        throw err;
    }
};