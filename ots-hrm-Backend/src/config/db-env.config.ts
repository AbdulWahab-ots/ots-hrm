import { config } from "dotenv";
import { log, error } from "console";

// Load environment variables
config();

export interface DatabaseConfig {
    server: string;
    database: string;
    userId: string;
    password: string;
    port: number;
    nodeEnv: string;
    ssl: boolean | { rejectUnauthorized: boolean };
}

export interface AppConfig {
    port: number;
    nodeEnv: string;
}

class ConfigManager {
    private static instance: ConfigManager;
    private dbConfig: DatabaseConfig | null = null;
    private appConfig: AppConfig | null = null;
    private configLogged: boolean = false;

    private constructor() {}

    public static getInstance(): ConfigManager {
        if (!ConfigManager.instance) {
            ConfigManager.instance = new ConfigManager();
        }
        return ConfigManager.instance;
    }

    /**
     * Validates and returns database configuration
     */
    public getDatabaseConfig(shouldLog: boolean = false): DatabaseConfig {
        if (this.dbConfig) {
            if (shouldLog && !this.configLogged) {
                this.logDatabaseConfig(this.dbConfig);
            }
            return this.dbConfig;
        }

        const requiredEnvVars = [
            'DB_Server',
            'DB_DataBase', 
            'DB_userId',
            'DB_Password'
        ];

        const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

        if (missingVars.length > 0) {
            const errorMsg = `Missing required environment variables: ${missingVars.join(', ')}`;
            error(errorMsg);
            throw new Error(errorMsg);
        }

        const nodeEnv = process.env.NODE_ENV || 'local';
        
        this.dbConfig = {
            server: process.env.DB_Server!,
            database: process.env.DB_DataBase!,
            userId: process.env.DB_userId!,
            password: process.env.DB_Password!,
            port: process.env.DB_Port ? parseInt(process.env.DB_Port) : 5432,
            nodeEnv,
            ssl: nodeEnv === 'local' ? false : { rejectUnauthorized: false }
        };

        if (shouldLog && !this.configLogged) {
            this.logDatabaseConfig(this.dbConfig);
        }

        return this.dbConfig;
    }

    /**
     * Gets application configuration
     */
    public getAppConfig(): AppConfig {
        if (this.appConfig) {
            return this.appConfig;
        }

        this.appConfig = {
            port: process.env.PORT ? parseInt(process.env.PORT) : 8060,
            nodeEnv: process.env.NODE_ENV || 'development'
        };

        return this.appConfig;
    }

    /**
     * Validates if all required database environment variables are present
     */
    public isDatabaseConfigValid(): boolean {
        const requiredEnvVars = ['DB_Server', 'DB_DataBase', 'DB_userId', 'DB_Password'];
        return requiredEnvVars.every(varName => !!process.env[varName]);
    }

    /**
     * Gets database connection string for TypeORM
     */
    public getDatabaseConnectionString(): string {
        const config = this.getDatabaseConfig(false);
        return `postgresql://${config.userId}:${config.password}@${config.server}:${config.port}/${config.database}`;
    }    /**
     * Gets TypeORM configuration object
     */
    public getTypeOrmConfig() {
        const dbConfig = this.getDatabaseConfig(false);
        
        return {
            type: 'postgres' as const,
            host: dbConfig.server,
            database: dbConfig.database,
            username: dbConfig.userId,
            password: dbConfig.password,
            port: dbConfig.port,
            ssl: dbConfig.ssl,
            // Only auto-sync schema in local/dev. In staging/prod this can drop columns
            // and lose data on boot - rely on migrations there instead.
            //
            // DB_SYNCHRONIZE=true forces sync regardless of NODE_ENV. Needed on a fresh
            // managed database (e.g. Railway): the committed migrations are incremental-
            // only (no baseline that creates the core tables), so the schema must be built
            // from the entities on first boot. Turn it OFF once the schema exists and use
            // migrations for subsequent changes.
            synchronize:
                process.env.DB_SYNCHRONIZE === 'true' ||
                ['local', 'development'].includes(dbConfig.nodeEnv),
            logging: dbConfig.nodeEnv === 'development' ? ["query", "error"] as ("query" | "error")[] : false,
            logger: "advanced-console" as const
        };
    }

    /**
     * Logs database configuration (without password)
     */
    private logDatabaseConfig(config: DatabaseConfig): void {
        log('Database Configuration:');
        log(`- Server: ${config.server}`);
        log(`- Database: ${config.database}`);
        log(`- User: ${config.userId}`);
        log(`- Port: ${config.port}`);
        log(`- Environment: ${config.nodeEnv}`);
        log(`- SSL: ${typeof config.ssl === 'boolean' ? (config.ssl ? 'enabled' : 'disabled') : 'enabled'}`);
        this.configLogged = true;
    }

    /**
     * Resets the singleton instance (useful for testing)
     */
    public static reset(): void {
        ConfigManager.instance = null as any;
    }
}

// Export singleton instance
export const configManager = ConfigManager.getInstance();

// Convenience exports for backward compatibility
export const getDatabaseConfig = (shouldLog: boolean = false) => configManager.getDatabaseConfig(shouldLog);
export const getAppConfig = () => configManager.getAppConfig();
export const isDatabaseConfigValid = () => configManager.isDatabaseConfigValid();
export const getDatabaseConnectionString = () => configManager.getDatabaseConnectionString();
export const getTypeOrmConfig = () => configManager.getTypeOrmConfig();
