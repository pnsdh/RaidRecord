/**
 * FFLogs API Client - Main export file
 * Combines core, character, and reports API functionality
 */

import { FFLogsAPICore } from './api/core.js';
import { CharacterAPI } from './api/character.js';
import { ReportsAPI } from './api/reports.js';
import { STORAGE_KEYS } from './config.js';

/**
 * Main FFLogs API class that combines all API functionality
 */
export class FFLogsAPI extends FFLogsAPICore {
    constructor(clientId, clientSecret) {
        super(clientId, clientSecret);

        // Initialize sub-APIs with reference to this instance
        this.characterAPI = new CharacterAPI();
        this.reportsAPI = new ReportsAPI();

        // Bind query method to sub-APIs
        this.characterAPI.query = this.query.bind(this);
        this.characterAPI.getJobFromSpecId = this.getJobFromSpecId.bind(this);
        this.reportsAPI.query = this.query.bind(this);
        this.reportsAPI.getJobFromSpecId = this.getJobFromSpecId.bind(this);
    }

    /**
     * Character API methods - delegated to CharacterAPI
     */
    async searchCharacter(characterName, serverName, serverRegion) {
        return this.characterAPI.searchCharacter(characterName, serverName, serverRegion);
    }

    async getCharacterRankings(characterId, zoneId, difficulty, partition) {
        return this.characterAPI.getCharacterRankings(characterId, zoneId, difficulty, partition);
    }

    async getCharacterEncounterParses(characterId, encounterId, difficulty, partition) {
        return this.characterAPI.getCharacterEncounterParses(characterId, encounterId, difficulty, partition);
    }

    async getEarliestClear(characterId, zoneId, encounterId, difficulty, partition) {
        return this.characterAPI.getEarliestClear(characterId, zoneId, encounterId, difficulty, partition);
    }

    async getAllStarPoints(characterId, zoneId, partition) {
        return this.characterAPI.getAllStarPoints(characterId, zoneId, partition);
    }

    /**
     * Reports API methods - delegated to ReportsAPI
     */
    async getZoneEncounters(zoneId) {
        return this.reportsAPI.getZoneEncounters(zoneId);
    }

    async getReportFights(reportCode) {
        return this.reportsAPI.getReportFights(reportCode);
    }

    async getPartyMembers(reportCode, fightId) {
        return this.reportsAPI.getPartyMembers(reportCode, fightId);
    }

    async getEncounterRankings(encounterId, characterName, serverName, serverRegion, difficulty, partition) {
        return this.reportsAPI.getEncounterRankings(encounterId, characterName, serverName, serverRegion, difficulty, partition);
    }
}

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
