/**
 * Custom error classes and error handling utilities
 */

/**
 * Base application error class
 */
export class AppError extends Error {
    constructor(message, code) {
        super(message);
        this.name = 'AppError';
        this.code = code;
    }
}

/**
 * Error codes for the application
 */
export const ErrorCodes = {
    CHARACTER_NOT_FOUND: 'CHARACTER_NOT_FOUND',
    NO_RAID_RECORDS: 'NO_RAID_RECORDS',
    API_RATE_LIMIT: 'API_RATE_LIMIT',
    SEARCH_CANCELLED: 'SEARCH_CANCELLED',
    NETWORK_ERROR: 'NETWORK_ERROR',
    AUTH_ERROR: 'AUTH_ERROR',
    INVALID_INPUT: 'INVALID_INPUT'
};

/**
 * Check if an error matches a specific error code
 * @param {Error} error - The error to check
 * @param {string} code - The error code to match
 * @returns {boolean}
 */
export function isErrorCode(error, code) {
    return error instanceof AppError && error.code === code;
}

/**
 * Check if an error is a "character not found" error
 * @param {Error} error - The error to check
 * @returns {boolean}
 */
export function isCharacterNotFoundError(error) {
    return isErrorCode(error, ErrorCodes.CHARACTER_NOT_FOUND);
}

