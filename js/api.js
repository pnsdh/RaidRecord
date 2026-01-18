/**
 * FFLogs API Client - Main export file
 * Combines core, character, and reports API functionality
 */

import { FFLogsAPICore } from './api/core.js';
import { CharacterAPI } from './api/character.js';
import { ReportsAPI } from './api/reports.js';

/**
 * Main FFLogs API class that combines all API functionality
 */
export class FFLogsAPI extends FFLogsAPICore {
    /**
     * @param {string} clientId - FFLogs API client ID
     * @param {string} clientSecret - FFLogs API client secret
     * @param {Object} tokenStorage - Token storage interface
     */
    constructor(clientId, clientSecret, tokenStorage) {
        super(clientId, clientSecret, tokenStorage);

        // Initialize sub-APIs with reference to this instance (core)
        this.characterAPI = new CharacterAPI(this);
        this.reportsAPI = new ReportsAPI(this);
    }

    /**
     * Character API methods - delegated to CharacterAPI
     */
    async searchCharacter(characterName, serverName, serverRegion) {
        return this.characterAPI.searchCharacter(characterName, serverName, serverRegion);
    }

    async getBatchTierData(characterId, tiers) {
        return this.characterAPI.getBatchTierData(characterId, tiers);
    }

    /**
     * Reports API methods - delegated to ReportsAPI
     */
    async getBatchPartyMembers(reportFights) {
        return this.reportsAPI.getBatchPartyMembers(reportFights);
    }

    /**
     * Check if there are enough API points remaining for a search
     * @param {number} requiredPoints - Number of points required
     * @returns {boolean} - True if enough points available
     */
    hasEnoughPoints(requiredPoints) {
        const rateLimitInfo = this.getRateLimitInfo();
        if (!rateLimitInfo) {
            // If no rate limit data yet, assume we have enough
            return true;
        }

        const { limitPerHour, pointsSpentThisHour } = rateLimitInfo;
        const remainingPoints = limitPerHour - pointsSpentThisHour;
        return remainingPoints >= requiredPoints;
    }

    /**
     * Get remaining API points
     * @returns {number|null} - Remaining points or null if no data
     */
    getRemainingPoints() {
        const rateLimitInfo = this.getRateLimitInfo();
        if (!rateLimitInfo) {
            return null;
        }

        const { limitPerHour, pointsSpentThisHour } = rateLimitInfo;
        return limitPerHour - pointsSpentThisHour;
    }
}
