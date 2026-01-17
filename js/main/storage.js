/**
 * Storage utilities for API credentials and settings
 */

import { FFLogsAPI } from '../api.js';
import { STORAGE_KEYS } from '../config/config.js';

/**
 * Centralized storage service for all localStorage operations
 */
export class StorageService {
    /**
     * Get a value from storage
     * @param {string} key - Key from STORAGE_KEYS
     * @returns {string|null}
     */
    static get(key) {
        return localStorage.getItem(STORAGE_KEYS[key]);
    }

    /**
     * Set a value in storage
     * @param {string} key - Key from STORAGE_KEYS
     * @param {string} value - Value to store
     */
    static set(key, value) {
        localStorage.setItem(STORAGE_KEYS[key], value);
    }

    /**
     * Get a JSON value from storage
     * @param {string} key - Key from STORAGE_KEYS
     * @param {*} defaultValue - Default value if not found or invalid
     * @returns {*}
     */
    static getJSON(key, defaultValue = null) {
        const value = this.get(key);
        if (!value) return defaultValue;
        try {
            return JSON.parse(value);
        } catch {
            return defaultValue;
        }
    }

    /**
     * Set a JSON value in storage
     * @param {string} key - Key from STORAGE_KEYS
     * @param {*} value - Value to store
     */
    static setJSON(key, value) {
        this.set(key, JSON.stringify(value));
    }

    // Domain-specific methods

    /**
     * Get API credentials
     * @returns {{clientId: string|null, clientSecret: string|null}}
     */
    static getCredentials() {
        return {
            clientId: this.get('CLIENT_ID'),
            clientSecret: this.get('CLIENT_SECRET')
        };
    }

    /**
     * Save API credentials
     * @param {string} clientId
     * @param {string} clientSecret
     */
    static saveCredentials(clientId, clientSecret) {
        this.set('CLIENT_ID', clientId);
        this.set('CLIENT_SECRET', clientSecret);
    }

    /**
     * Get last searched character name
     * @returns {string|null}
     */
    static getLastSearch() {
        return this.get('LAST_SEARCH');
    }

    /**
     * Save last searched character name
     * @param {string} name
     */
    static saveLastSearch(name) {
        this.set('LAST_SEARCH', name);
    }

    /**
     * Get selected server
     * @returns {string|null}
     */
    static getServer() {
        return this.get('SERVER');
    }

    /**
     * Save selected server
     * @param {string} server
     */
    static saveServer(server) {
        this.set('SERVER', server);
    }

    /**
     * Get selected raid IDs
     * @returns {string[]|null}
     */
    static getSelectedRaids() {
        return this.getJSON('SELECTED_RAIDS', null);
    }

    /**
     * Save selected raid IDs
     * @param {string[]} ids
     */
    static saveSelectedRaids(ids) {
        this.setJSON('SELECTED_RAIDS', ids);
    }

    /**
     * Get access token
     * @returns {string|null}
     */
    static getAccessToken() {
        return this.get('ACCESS_TOKEN');
    }

    /**
     * Save access token
     * @param {string} token
     */
    static saveAccessToken(token) {
        this.set('ACCESS_TOKEN', token);
    }

    /**
     * Get token expiry time
     * @returns {number|null}
     */
    static getTokenExpiry() {
        const expiry = this.get('TOKEN_EXPIRY');
        return expiry ? parseInt(expiry, 10) : null;
    }

    /**
     * Save token expiry time
     * @param {number} expiry
     */
    static saveTokenExpiry(expiry) {
        this.set('TOKEN_EXPIRY', expiry.toString());
    }
}

/**
 * Initialize API client from stored credentials
 */
export function initializeAPI() {
    const { clientId, clientSecret } = StorageService.getCredentials();

    if (!clientId || !clientSecret) {
        return null;
    }

    return new FFLogsAPI(clientId, clientSecret);
}

/**
 * Save API credentials (for backward compatibility)
 */
export function saveCredentials(clientId, clientSecret) {
    StorageService.saveCredentials(clientId, clientSecret);
}
