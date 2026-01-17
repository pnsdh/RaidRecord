/**
 * Token storage interface for API authentication
 * Abstracts localStorage access to break circular dependency
 */

import { STORAGE_KEYS } from '../config/config.js';

/**
 * Token storage implementation using localStorage
 */
export const TokenStorage = {
    /**
     * Get cached access token
     * @returns {string|null}
     */
    getToken() {
        return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    },

    /**
     * Save access token
     * @param {string} token
     */
    saveToken(token) {
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
    },

    /**
     * Get token expiry time
     * @returns {number|null}
     */
    getExpiry() {
        const expiry = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
        return expiry ? parseInt(expiry, 10) : null;
    },

    /**
     * Save token expiry time
     * @param {number} expiry
     */
    saveExpiry(expiry) {
        localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiry.toString());
    }
};
