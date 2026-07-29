import { DataSource } from "typeorm";
import { log, error } from "console";

export class DatabaseManager {
    private static instance: DatabaseManager;
    private dataSource: DataSource | null = null;

    private constructor() {}

    public static getInstance(): DatabaseManager {
        if (!DatabaseManager.instance) {
            DatabaseManager.instance = new DatabaseManager();
        }
        return DatabaseManager.instance;
    }

    public setDataSource(dataSource: DataSource): void {
        this.dataSource = dataSource;
    }

    public getDataSource(): DataSource {
        if (!this.dataSource || !this.dataSource.isInitialized) {
            throw new Error("Database not initialized. Please ensure database connection is established.");
        }
        return this.dataSource;
    }

    public async isConnected(): Promise<boolean> {
        try {
            if (!this.dataSource || !this.dataSource.isInitialized) {
                return false;
            }
            
            await this.dataSource.query('SELECT 1');
            return true;
        } catch (err) {
            error("Database connection check failed:", err);
            return false;
        }
    }

    public async waitForConnection(timeoutMs: number = 30000): Promise<boolean> {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeoutMs) {
            if (await this.isConnected()) {
                return true;
            }
            
            // Wait 100ms before checking again
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        return false;
    }

    public async executeWithConnection<T>(
        operation: (dataSource: DataSource) => Promise<T>
    ): Promise<T> {
        const dataSource = this.getDataSource();
        
        if (!(await this.isConnected())) {
            throw new Error("Database connection is not available");
        }
        
        return await operation(dataSource);
    }    public async getConnectionInfo(): Promise<{
        isConnected: boolean;
        database: string;
        host: string;
        port: number;
    }> {
        const isConnected = await this.isConnected();
        const options = this.dataSource?.options as any;
        
        return {
            isConnected,
            database: options?.database || "Unknown",
            host: options?.host || "Unknown", 
            port: options?.port || 0
        };
    }
}

export const dbManager = DatabaseManager.getInstance();
