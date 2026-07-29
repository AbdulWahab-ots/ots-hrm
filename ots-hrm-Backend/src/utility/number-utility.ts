/**
 * Utility functions for handling numeric operations in payroll calculations
 */

/**
 * Converts any value to a number and ensures it's a valid number
 * @param value - The value to convert
 * @param defaultValue - Default value if conversion fails
 * @returns A valid number
 */
export function toNumber(value: any, defaultValue: number = 0): number {
    if (value === null || value === undefined) {
        return defaultValue;
    }
    
    const num = Number(value);
    return isNaN(num) ? defaultValue : num;
}

/**
 * Converts any value to an integer, removing decimal parts
 * @param value - The value to convert
 * @param defaultValue - Default value if conversion fails
 * @returns An integer value
 */
export function toInteger(value: any, defaultValue: number = 0): number {
    const num = toNumber(value, defaultValue);
    return Math.floor(num);
}

/**
 * Converts any value to a currency amount (removes decimal parts)
 * @param value - The value to convert
 * @param defaultValue - Default value if conversion fails
 * @returns A whole number representing currency (whole rupees for PKR)
 */
export function toCurrencyAmount(value: any, defaultValue: number = 0): number {
    const num = toNumber(value, defaultValue);
    return Math.floor(num);
}

/**
 * Ensures a value is within a valid range
 * @param value - The value to validate
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @param defaultValue - Default value if out of range
 * @returns A value within the valid range
 */
export function clampNumber(value: number, min: number, max: number, defaultValue: number = min): number {
    if (value < min || value > max) {
        return defaultValue;
    }
    return value;
}

/**
 * Safely adds multiple numbers, handling undefined/null values
 * @param values - Array of values to add
 * @returns Sum of all valid numbers
 */
export function safeSum(...values: any[]): number {
    return values.reduce((sum, value) => sum + toNumber(value, 0), 0);
}

/**
 * Safely multiplies multiple numbers, handling undefined/null values
 * @param values - Array of values to multiply
 * @returns Product of all valid numbers
 */
export function safeMultiply(...values: any[]): number {
    return values.reduce((product, value) => product * toNumber(value, 1), 1);
}

/**
 * Calculates percentage with safe number handling
 * @param value - The base value
 * @param percentage - The percentage to calculate
 * @returns The calculated percentage value
 */
export function calculatePercentage(value: any, percentage: any): number {
    const baseValue = toNumber(value, 0);
    const percent = toNumber(percentage, 0);
    return Math.floor((baseValue * percent) / 100);
} 