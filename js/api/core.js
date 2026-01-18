/**
 * FFLogs API Core - Authentication and base query functionality
 */

import { API_CONFIG, TIMING } from '../config/config.js';
import { getJobFromSpecId as mapJobFromSpecId } from '../config/jobs.js';
import { AppError, ErrorCodes } from '../errors.js';

export class FFLogsAPICore {
    /**
     * @param {string} clientId - FFLogs API client ID
     * @param {string} clientSecret - FFLogs API client secret
     * @param {Object} tokenStorage - Token storage interface with getToken, saveToken, getExpiry, saveExpiry
     */
    constructor(clientId, clientSecret, tokenStorage) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.tokenStorage = tokenStorage;
        this.accessToken = null;
        this.tokenExpiry = null;
        this.rateLimitData = null;
    }

    /**
     * Get OAuth access token (with caching)
     */
    async getAccessToken() {
        // Check if we have a valid cached token
        const cachedToken = this.tokenStorage.getToken();
        const cachedExpiry = this.tokenStorage.getExpiry();

        if (cachedToken && cachedExpiry) {
            const now = Date.now();

            // If token expires in more than the threshold, use it
            if (cachedExpiry - now > TIMING.TOKEN_REFRESH_THRESHOLD) {
                this.accessToken = cachedToken;
                this.tokenExpiry = cachedExpiry;
                return this.accessToken;
            }
        }

        // Request new token
        const credentials = btoa(`${this.clientId}:${this.clientSecret}`);

        const response = await fetch(API_CONFIG.TOKEN_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `grant_type=${API_CONFIG.GRANT_TYPE}`
        });

        if (!response.ok) {
            throw new AppError('Failed to obtain access token. Check your API credentials.', ErrorCodes.AUTH_ERROR);
        }

        const data = await response.json();
        this.accessToken = data.access_token;

        // Token expires in 'expires_in' seconds (typically 360 days)
        this.tokenExpiry = Date.now() + (data.expires_in * 1000);

        // Cache the token
        this.tokenStorage.saveToken(this.accessToken);
        this.tokenStorage.saveExpiry(this.tokenExpiry);

        return this.accessToken;
    }

    /**
     * Execute a GraphQL query
     */
    async query(queryString, variables = {}, includeRateLimit = false) {
        const token = await this.getAccessToken();

        // Add rate limit data to query if requested
        let finalQuery = queryString;
        if (includeRateLimit && !queryString.includes('rateLimitData')) {
            finalQuery = queryString.replace(
                /query(\([^)]*\))?\s*{/,
                `query$1 {
                    rateLimitData {
                        limitPerHour
                        pointsSpentThisHour
                        pointsResetIn
                    }`
            );
        }

        const response = await fetch(API_CONFIG.API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: finalQuery,
                variables
            })
        });

        if (!response.ok) {
            throw new AppError(`API query failed: ${response.statusText}`, ErrorCodes.NETWORK_ERROR);
        }

        const result = await response.json();

        // GraphQL can return partial data with errors
        // Only throw if there's no data at all
        if (result.errors && !result.data) {
            throw new AppError(result.errors[0].message, ErrorCodes.NETWORK_ERROR);
        }

        // Extract and store rate limit data if present
        if (result.data && result.data.rateLimitData) {
            this.rateLimitData = result.data.rateLimitData;
        }

        return result.data;
    }

    /**
     * Get current rate limit information
     */
    getRateLimitInfo() {
        return this.rateLimitData;
    }

    /**
     * Map FFLogs spec ID or spec name to job name
     * Delegates to jobs.js utility function
     */
    getJobFromSpecId(specId) {
        return mapJobFromSpecId(specId);
    }
}
