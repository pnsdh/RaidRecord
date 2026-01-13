/**
 * Storage utilities for API credentials and settings
 */

import { FFLogsAPI } from '../api.js';
import { STORAGE_KEYS } from '../config/config.js';

/**
 * Initialize API client from stored credentials
 */
export function initializeAPI() {
    const clientId = localStorage.getItem(STORAGE_KEYS.CLIENT_ID);
    const clientSecret = localStorage.getItem(STORAGE_KEYS.CLIENT_SECRET);

    if (!clientId || !clientSecret) {
        return null;
    }

    return new FFLogsAPI(clientId, clientSecret);
}

/**
 * Save API credentials
 */
export function saveCredentials(clientId, clientSecret) {
    localStorage.setItem(STORAGE_KEYS.CLIENT_ID, clientId);
    localStorage.setItem(STORAGE_KEYS.CLIENT_SECRET, clientSecret);
}
