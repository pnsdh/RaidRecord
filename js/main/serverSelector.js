/**
 * Server selection utilities
 */

import { KR_SERVERS } from '../constants.js';

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
     */
    showInitialSelection(characterName, onSelect) {
        const servers = this.getAllServers();
        const message = `<strong>${characterName}</strong> 캐릭터를 검색할 서버를 선택해주세요.`;
        this.ui.showServerSelection(characterName, servers, onSelect, message);
    }

    /**
     * Show server selection UI when character not found
     * @param {string} characterName - Character name
     * @param {string} failedServer - Server where character was not found
     * @param {Function} onSelect - Callback when server is selected
     */
    showNotFoundSelection(characterName, failedServer, onSelect) {
        const servers = this.getAllServers();
        const serverDisplayName = this.getDisplayName(failedServer);
        const message = `<strong>${characterName}@${serverDisplayName}</strong> 캐릭터를 찾을 수 없습니다.<br>다른 서버를 선택해주세요.`;
        this.ui.showServerSelection(characterName, servers, onSelect, message, failedServer);
        return true;
    }

    /**
     * Show server selection UI when no raid records found
     * @param {string} characterName - Character name
     * @param {string} currentServer - Server with no records
     * @param {Function} onSelect - Callback when server is selected
     */
    showNoRecordsSelection(characterName, currentServer, onSelect) {
        const servers = this.getAllServers();
        const serverDisplayName = this.getDisplayName(currentServer);
        const message = `<strong>${characterName}@${serverDisplayName}</strong> 캐릭터의 레이드 기록을 찾을 수 없습니다.<br>다른 서버를 선택해주세요.`;
        this.ui.showServerSelection(characterName, servers, onSelect, message, currentServer);
        return true;
    }

    /**
     * Hide server selection UI
     */
    hide() {
        this.ui.hideServerSelection();
    }
}
