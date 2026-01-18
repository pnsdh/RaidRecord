/**
 * Server selection utilities
 */

import { KR_SERVERS } from '../constants.js';
import { MESSAGES } from '../config/messages.js';

/**
 * Server selector class for managing server selection UI
 */
export class ServerSelector {
    constructor(ui) {
        this.ui = ui;
        this.servers = KR_SERVERS;
    }

    /**
     * Get all server names
     * @returns {string[]} List of all server names (English)
     */
    getAllServers() {
        return this.servers.map(s => s.nameEN);
    }

    /**
     * Get Korean display name for server
     * @param {string} serverEN - Server name in English
     * @returns {string} Server name in Korean (or English if not found)
     */
    getDisplayName(serverEN) {
        const server = this.servers.find(
            s => s.nameEN.toLowerCase() === serverEN.toLowerCase()
        );
        return server ? server.nameKR : serverEN;
    }

    /**
     * Show server selection UI for initial search (no server specified)
     * @param {string} characterName - Character name
     * @param {Function} onSelect - Callback when server is selected
     * @param {Object} serverExistsMap - Map of server -> exists (optional)
     */
    showInitialSelection(characterName, onSelect, serverExistsMap = null) {
        const servers = this.getAllServers();
        const message = MESSAGES.SEARCH.SELECT_SERVER(characterName);
        this.ui.showServerSelection(characterName, servers, onSelect, message, null, serverExistsMap);
    }

    /**
     * Show server selection UI when character not found
     * @param {string} characterName - Character name
     * @param {string} failedServer - Server where character was not found
     * @param {Function} onSelect - Callback when server is selected
     * @param {Object} serverExistsMap - Map of server -> exists (optional)
     */
    showNotFoundSelection(characterName, failedServer, onSelect, serverExistsMap = null) {
        const servers = this.getAllServers();
        const serverDisplayName = this.getDisplayName(failedServer);
        const message = MESSAGES.SEARCH.SELECT_OTHER_SERVER(characterName, serverDisplayName);
        this.ui.showServerSelection(characterName, servers, onSelect, message, failedServer, serverExistsMap);
        return true;
    }

    /**
     * Show server selection UI when no raid records found
     * @param {string} characterName - Character name
     * @param {string} currentServer - Server with no records
     * @param {Function} onSelect - Callback when server is selected
     * @param {Object} serverExistsMap - Map of server -> exists (optional)
     */
    showNoRecordsSelection(characterName, currentServer, onSelect, serverExistsMap = null) {
        const servers = this.getAllServers();
        const serverDisplayName = this.getDisplayName(currentServer);
        const message = MESSAGES.SEARCH.NO_RAID_RECORDS(characterName, serverDisplayName);
        this.ui.showServerSelection(characterName, servers, onSelect, message, currentServer, serverExistsMap);
        return true;
    }

    /**
     * Hide server selection UI
     */
    hide() {
        this.ui.hideServerSelection();
    }
}
