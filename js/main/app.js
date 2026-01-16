/**
 * Main application controller
 */

import { initializeAPI, saveCredentials } from './storage.js';
import { RaidHistorySearch, sortRaidHistory } from '../search.js';
import { UIController } from '../ui.js';
import { STORAGE_KEYS, APP_CONFIG, TIMING, KR_SERVERS } from '../constants.js';
import { UI_CONFIG } from '../config/config.js';
import { SettingsModal, RaidSelectionModal } from './modals.js';
import { initializeElements, populateServerSelect, attachEventListeners } from './init.js';
import { parseCharacterInput } from '../utils/characterParser.js';

/**
 * Main App class
 */
export class App {
    constructor() {
        this.api = null;
        this.search = null;
        this.ui = new UIController();
        this.isSearching = false;

        // Initialize elements
        this.elements = initializeElements();
        populateServerSelect(this.elements.serverSelect);

        // Initialize modals
        this.settingsModal = new SettingsModal(this);
        this.raidSelectionModal = new RaidSelectionModal(this);

        // Attach event listeners
        attachEventListeners(this, this.elements, {
            settingsModal: this.settingsModal,
            raidSelectionModal: this.raidSelectionModal
        });

        // Load last search
        this.loadLastSearch();

        // Check credentials
        this.checkCredentials();
    }

    /**
     * Check if API credentials are saved
     */
    checkCredentials() {
        this.api = initializeAPI();

        if (!this.api) {
            // No credentials saved, show settings modal
            this.settingsModal.open();
        } else {
            // Credentials found, initialize search with fixed KR region
            this.search = new RaidHistorySearch(this.api, APP_CONFIG.REGION);
        }
    }

    /**
     * Save API settings
     */
    saveSettings() {
        const clientId = this.settingsModal.clientIdInput.value.trim();
        const clientSecret = this.settingsModal.clientSecretInput.value.trim();

        if (!clientId || !clientSecret) {
            alert('Client ID와 Client Secret을 입력해주세요.');
            return;
        }

        // Save credentials (region is fixed to KR)
        saveCredentials(clientId, clientSecret);

        // Reinitialize API
        this.api = initializeAPI();
        this.search = new RaidHistorySearch(this.api, APP_CONFIG.REGION);

        // Close modal
        this.settingsModal.close();

        alert('설정이 저장되었습니다.');
    }

    /**
     * Load last search from storage
     */
    loadLastSearch() {
        const lastCharacter = localStorage.getItem(STORAGE_KEYS.LAST_SEARCH);
        if (lastCharacter) {
            this.elements.searchInput.placeholder = lastCharacter;
        }
    }

    /**
     * Save last search to storage
     */
    saveLastSearch(characterName) {
        localStorage.setItem(STORAGE_KEYS.LAST_SEARCH, characterName);
    }

    /**
     * Perform character search with specified server
     * @param {string} characterName - Character name
     * @param {string} serverName - Server name (English)
     * @returns {Promise<{character: Object, raidHistory: Array}>} Search results
     */
    async performSearch(characterName, serverName) {
        // Save selected server for next search
        localStorage.setItem(STORAGE_KEYS.SERVER, serverName);

        // Save character name for next search
        this.saveLastSearch(characterName);

        // Update search fields (input and server dropdown)
        this.elements.searchInput.value = characterName;
        this.elements.serverSelect.value = serverName;

        // Update placeholder with last search
        this.elements.searchInput.placeholder = characterName;

        // Show loading
        this.ui.showLoading('캐릭터 검색 중...');

        // Build search query with server
        const searchQuery = `${characterName} ${serverName}`;

        // Search for character
        const character = await this.search.searchCharacter(searchQuery);

        // Update API usage after first query
        this.updateApiUsage();

        // Check if we have enough API points for the search
        const selectedTierCount = this.search.getSelectedTierCount();
        const requiredPoints = selectedTierCount * TIMING.POINTS_PER_TIER;

        if (!this.api.hasEnoughPoints(requiredPoints)) {
            const remainingPoints = this.api.getRemainingPoints();
            const resetMinutes = Math.ceil((this.api.getRateLimitInfo()?.pointsResetIn || 3600) / 60);
            throw new Error(
                `API 포인트가 부족합니다.\n` +
                `필요: 약 ${requiredPoints} 포인트\n` +
                `남은 포인트: ${remainingPoints} 포인트\n` +
                `${resetMinutes}분 후 리셋됩니다. 잠시 후 다시 시도해주세요.`
            );
        }

        // Set progress callback
        this.search.setProgressCallback((progress) => {
            this.ui.updateProgress(progress);
        });

        // Set API usage callback for real-time updates
        this.search.setApiUsageCallback(() => {
            this.updateApiUsage();
        });

        // Get raid history
        this.ui.showLoading('레이드 이력 검색 중...');
        const raidHistory = await this.search.getRaidHistory(character);

        return { character, raidHistory };
    }

    /**
     * Handle character search
     */
    async handleSearch() {
        // If already searching, confirm cancellation
        if (this.isSearching) {
            const confirmCancel = confirm('검색을 취소하시겠습니까?');
            if (confirmCancel) {
                this.cancelSearch();
            }
            return;
        }

        let inputValue = this.elements.searchInput.value.trim();
        const selectedServer = this.elements.serverSelect.value;

        // If no input, use last search
        if (!inputValue) {
            inputValue = localStorage.getItem(STORAGE_KEYS.LAST_SEARCH) || '';
        }

        if (!inputValue) {
            alert('캐릭터명을 입력해주세요.');
            return;
        }

        if (!this.api || !this.search) {
            alert('먼저 FFLogs API 설정을 완료해주세요.');
            this.settingsModal.open();
            return;
        }

        // Parse character input
        const { characterName, serverName: parsedServer } = parseCharacterInput(inputValue);

        if (!characterName) {
            alert('올바른 캐릭터명을 입력해주세요.');
            return;
        }

        // Determine which server to use
        let targetServer = parsedServer || selectedServer;

        // If no server specified at all, show all server options
        if (!targetServer) {
            const allServers = KR_SERVERS.map(s => s.nameEN);
            this.ui.showServerSelection(
                characterName,
                allServers,
                (chosenServer) => {
                    this.searchWithServer(characterName, chosenServer);
                },
                `<strong>${characterName}</strong> 캐릭터를 검색할 서버를 선택해주세요.`
            );
            return;
        }

        // Perform search with determined server
        await this.searchWithServer(characterName, targetServer);
    }

    /**
     * Search character on specified server
     * @param {string} characterName - Character name
     * @param {string} serverName - Server name (English)
     */
    async searchWithServer(characterName, serverName) {
        try {
            // Set searching state
            this.isSearching = true;
            this.search.resetCancel();
            this.updateSearchButton();
            this.ui.disableControls();
            this.ui.hideServerSelection();

            // Perform search
            const { character, raidHistory } = await this.performSearch(characterName, serverName);

            // Sort by newest first
            const sortedHistory = sortRaidHistory(raidHistory);

            // Check if we got any results
            if (sortedHistory.length === 0) {
                // No results found, show server selection for other servers
                const otherServers = KR_SERVERS
                    .map(s => s.nameEN)
                    .filter(s => s.toLowerCase() !== serverName.toLowerCase());

                if (otherServers.length > 0) {
                    this.ui.showServerSelection(
                        characterName,
                        otherServers,
                        (chosenServer) => {
                            this.searchWithServer(characterName, chosenServer);
                        },
                        `<strong>${characterName}@${this.getServerDisplayName(serverName)}</strong> 캐릭터의 레이드 기록을 찾을 수 없습니다.<br>다른 서버를 선택해주세요.`
                    );
                    return;
                }
            }

            // Render results
            this.ui.renderResults(character, sortedHistory);

            // Update API usage after all queries
            this.updateApiUsage();

        } catch (error) {
            // Check if it's a "character not found" error
            if (error.message.includes('Character not found') || error.message.includes('캐릭터를 찾을 수 없습니다')) {
                // Show server selection for other servers
                const otherServers = KR_SERVERS
                    .map(s => s.nameEN)
                    .filter(s => s.toLowerCase() !== serverName.toLowerCase());

                if (otherServers.length > 0) {
                    this.ui.showServerSelection(
                        characterName,
                        otherServers,
                        (chosenServer) => {
                            this.searchWithServer(characterName, chosenServer);
                        },
                        `<strong>${characterName}@${this.getServerDisplayName(serverName)}</strong> 캐릭터를 찾을 수 없습니다.<br>다른 서버를 선택해주세요.`
                    );
                    return;
                }
            }

            this.ui.showError(error.message || '검색 중 오류가 발생했습니다.');

            // Still try to update API usage on error
            this.updateApiUsage();
        } finally {
            // Reset searching state
            this.isSearching = false;
            this.updateSearchButton();
            this.ui.enableControls();
        }
    }

    /**
     * Get display name for server (Korean)
     */
    getServerDisplayName(serverEN) {
        const server = KR_SERVERS.find(s => s.nameEN.toLowerCase() === serverEN.toLowerCase());
        return server ? server.nameKR : serverEN;
    }

    /**
     * Cancel ongoing search
     */
    cancelSearch() {
        if (this.search) {
            this.search.cancel();
        }
    }

    /**
     * Update search button text based on searching state
     */
    updateSearchButton() {
        if (this.isSearching) {
            this.elements.searchBtn.textContent = '취소';
            this.elements.searchBtn.style.backgroundColor = UI_CONFIG.CANCEL_BUTTON_COLOR;
            this.elements.searchBtn.style.color = 'white';
        } else {
            this.elements.searchBtn.textContent = '검색';
            this.elements.searchBtn.style.backgroundColor = '';
            this.elements.searchBtn.style.color = '';
        }
    }

    /**
     * Update API usage display
     */
    updateApiUsage() {
        if (this.api) {
            const rateLimitInfo = this.api.getRateLimitInfo();
            this.ui.updateApiUsage(rateLimitInfo);
        }
    }
}
