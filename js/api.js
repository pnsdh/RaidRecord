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

    async getCombinedTierData(characterId, zoneId, encounterId, difficulty, partition) {
        return this.characterAPI.getCombinedTierData(characterId, zoneId, encounterId, difficulty, partition);
    }

    /**
     * Reports API methods - delegated to ReportsAPI
     */
    async getPartyMembers(reportCode, fightId) {
        return this.reportsAPI.getPartyMembers(reportCode, fightId);
    }
}
