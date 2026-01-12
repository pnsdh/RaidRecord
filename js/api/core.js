/**
 * FFLogs API Core - Authentication and base query functionality
 */

import { API_CONFIG, STORAGE_KEYS, TIMING } from '../config.js';

export class FFLogsAPICore {
    constructor(clientId, clientSecret) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.accessToken = null;
        this.tokenExpiry = null;
        this.rateLimitData = null;
    }

    /**
     * Get OAuth access token (with caching)
     */
    async getAccessToken() {
        // Check if we have a valid cached token
        const cachedToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        const cachedExpiry = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);

        if (cachedToken && cachedExpiry) {
            const expiryTime = parseInt(cachedExpiry);
            const now = Date.now();

            // If token expires in more than the threshold, use it
            if (expiryTime - now > TIMING.TOKEN_REFRESH_THRESHOLD) {
                this.accessToken = cachedToken;
                this.tokenExpiry = expiryTime;
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
            throw new Error('Failed to obtain access token. Check your API credentials.');
        }

        const data = await response.json();
        this.accessToken = data.access_token;

        // Token expires in 'expires_in' seconds
        this.tokenExpiry = Date.now() + (data.expires_in * 1000);

        // Cache the token
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, this.accessToken);
        localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, this.tokenExpiry.toString());

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
            throw new Error(`API query failed: ${response.statusText}`);
        }

        const result = await response.json();

        if (result.errors) {
            throw new Error(result.errors[0].message);
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
     */
    getJobFromSpecId(specId) {
        // If specId is already a string (job name), return it directly
        if (typeof specId === 'string') {
            // Remove any spaces and convert to the expected format
            return specId.replace(/\s+/g, '');
        }

        // Otherwise, it's a numeric ID - map it
        const jobMap = {
            // Tanks
            19: 'Paladin',
            21: 'Warrior',
            32: 'DarkKnight',
            37: 'Gunbreaker',

            // Healers
            24: 'WhiteMage',
            28: 'Scholar',
            33: 'Astrologian',
            40: 'Sage',

            // Melee DPS
            20: 'Monk',
            22: 'Dragoon',
            30: 'Ninja',
            34: 'Samurai',
            39: 'Reaper',
            41: 'Viper',

            // Physical Ranged DPS
            23: 'Bard',
            31: 'Machinist',
            38: 'Dancer',

            // Magical Ranged DPS
            25: 'BlackMage',
            27: 'Summoner',
            35: 'RedMage',
            42: 'Pictomancer',

            // Limited Job
            36: 'BlueMage'
        };

        return jobMap[specId] || 'Unknown';
    }
}
