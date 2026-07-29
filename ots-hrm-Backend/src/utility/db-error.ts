import { QueryFailedError } from 'typeorm';

export function parseDbError(error: any): { message: string; statusCode: number } {
    const DUPLICATE_ERROR_CODE = '23505';
    const FOREIGN_KEY_VIOLATION_CODE = '23503';

    if (error instanceof QueryFailedError) {
        const code = error.driverError?.code;
        const detail: string = error.driverError?.detail || '';
        const table: string = error.driverError?.table || 'Unknown Table';
        const errorMessage: string = error.message || '';

        // Duplicate Entry Handling
        if (code === DUPLICATE_ERROR_CODE) {
            const message = parseDuplicateKeyDetail(detail, table);
            return {
                message,
                statusCode: 409
            };
        }

        // Foreign Key Violation Handling
        if (code === FOREIGN_KEY_VIOLATION_CODE) {
            // Check if it's a deletion/update constraint violation
            if (errorMessage.includes('update or delete on table') && errorMessage.includes('violates foreign key constraint')) {
                const message = parseDeletionConstraintViolation(errorMessage);
                return {
                    message,
                    statusCode: 409 // Conflict - record is being used elsewhere
                };
            }
            
            // Regular foreign key violation (invalid reference during insert/update)
            const message = parseForeignKeyDetail(detail, table);
            return {
                message,
                statusCode: 422
            };
        }
    }

    // Default fallback
    return {
        message: 'Internal Server Error',
        statusCode: 500
    };
}

function parseDuplicateKeyDetail(detail: string, table: string): string {
    // Extract field names and values from the detail message
    // Supports formats like:
    // Key ("companyId", code)=(value1, value2) already exists.
    // Key (name)=(value) already exists.
    
    const keyMatch = detail.match(/Key \(([^)]+)\)=\(([^)]+)\) already exists\./);
    
    if (!keyMatch) {
        return detail || 'Duplicate entry detected.';
    }

    const fieldsStr = keyMatch[1];
    
    // Parse field names - handle both quoted and unquoted field names
    const fieldNames = fieldsStr
        .split(',')
        .map(field => field.trim().replace(/"/g, ''));
    
    // Convert field names to readable format
    const readableFields = fieldNames.map(field => 
        field
            .replace(/([A-Z])/g, ' $1') // Add space before capital letters
            .replace(/id$/i, '') // Remove 'id' suffix
            .trim()
            .toLowerCase()
            .replace(/^\w/, c => c.toUpperCase()) // Capitalize first letter
    );

    if (readableFields.length === 1) {
        return `${table} ${readableFields[0]} already exists.`;
    } else {
        return `${table} ${readableFields[1]} already exists.`;
    }
}

function parseForeignKeyDetail(detail: string, table: string): string {
    // Parse foreign key constraint violations
    // Common formats:
    // Key (userId)=(123) is not present in table "users".
    // insert or update on table "orders" violates foreign key constraint "FK_orders_userId"
    
    // Try to match the key format
    const keyMatch = detail.match(/Key \(([^)]+)\)=\(([^)]+)\) is not present in table "([^"]+)"/);
    
    if (keyMatch) {
        const fieldName = keyMatch[1].replace(/"/g, '');
        const referencedTable = keyMatch[3];
        
        // Convert field name to readable format
        const readableField = fieldName
            .replace(/([A-Z])/g, ' $1')
            .replace(/id$/i, '')
            .trim()
            .toLowerCase()
            .replace(/^\w/, c => c.toUpperCase());
        
        const readableTable = referencedTable
            .replace(/([A-Z])/g, ' $1')
            .trim()
            .toLowerCase()
            .replace(/^\w/, c => c.toUpperCase());
        
        return `Invalid ${readableField}. The specified ${readableTable.slice(0, -1)} does not exist.`;
    }
    
    // Try to match constraint violation format
    const constraintMatch = detail.match(/violates foreign key constraint "([^"]+)"/);
    
    if (constraintMatch) {
        const constraintName = constraintMatch[1];
        
        // Extract field name from constraint (assuming format like FK_table_field)
        const fieldMatch = constraintName.match(/FK_\w+_(\w+)/);
        
        if (fieldMatch) {
            const fieldName = fieldMatch[1];
            const readableField = fieldName
                .replace(/([A-Z])/g, ' $1')
                .replace(/id$/i, '')
                .trim()
                .toLowerCase()
                .replace(/^\w/, c => c.toUpperCase());
            
            return `Invalid ${readableField}. Referenced record does not exist.`;
        }
    }
    
    // Fallback for unmatched patterns
    return 'Invalid reference. Referenced record does not exist.';
}

function parseDeletionConstraintViolation(errorMessage: string): string {
    // Parse deletion/update constraint violations
    // Format: update or delete on table "Role" violates foreign key constraint "FK_xxx" on table "User"
    
    const constraintMatch = errorMessage.match(/update or delete on table "([^"]+)" violates foreign key constraint "[^"]+" on table "([^"]+)"/);
    
    if (constraintMatch) {
        const sourceTable = constraintMatch[1]; // Table being deleted/updated (e.g., "Role")
        const referencingTable = constraintMatch[2]; // Table that references it (e.g., "User")
        
        // Convert table names to readable format
        const readableSourceTable = sourceTable
            .replace(/([A-Z])/g, ' $1')
            .trim()
            .toLowerCase()
            .replace(/^\w/, c => c.toUpperCase());
        
        const readableReferencingTable = referencingTable
            .replace(/([A-Z])/g, ' $1')
            .trim()
            .toLowerCase()
            .replace(/^\w/, c => c.toUpperCase());
        
        return `Cannot delete ${readableSourceTable}. It is currently being used by existing ${readableReferencingTable} records. Please remove associated ${readableReferencingTable.toLowerCase()} records first or enable cascade deletion.`;
    }
    
    // Fallback for unmatched patterns
    return 'Cannot delete record. It is currently being used by other records in the system.';
}