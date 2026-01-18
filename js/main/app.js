/**
 * Main application controller
 */

import { createAPIFromCredentials, saveCredentials, StorageService } from './storage.js';
import { RaidHistorySearch, sortRaidHistory } from '../search.js';
import { UIController } from '../ui.js';
import { FFLogsAPI } from '../api.js';
import { APP_CONFIG, UI_CONFIG, TIMING } from '../config/config.js';
import { MESSAGES } from '../config/messages.js';
import { SettingsModal, RaidSelectionModal } from './modals.js';
import { initializeElements, attachEventListeners } from './init.js';
import { parseCharacterInput } from '../utils/characterParser.js';
import { isCharacterNotFoundError } from '../errors.js';
import { ServerSelector } from './serverSelector.js';
import { KR_SERVERS } from '../constants.js';

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

        // Initialize server selector
        this.serverSelector = new ServerSelector(this.ui);

        // Initialize modals
        this.settingsModal = new SettingsModal();
        this.raidSelectionModal = new RaidSelectionModal();

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
        this.api = createAPIFromCredentials(FFLogsAPI);

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
            alert(MESSAGES.SETTINGS.MISSING_CREDENTIALS);
            return;
        }

        // Save credentials (region is fixed to KR)
        saveCredentials(clientId, clientSecret);

        // Reinitialize API
        this.api = createAPIFromCredentials(FFLogsAPI);
        this.search = new RaidHistorySearch(this.api, APP_CONFIG.REGION);

        // Close modal
        this.settingsModal.close();

        alert(MESSAGES.SETTINGS.SAVED);
    }

    /**
     * Load last search from storage
     */
    loadLastSearch() {
        const lastCharacter = StorageService.getLastSearch();
        if (lastCharacter) {
            this.elements.searchInput.placeholder = lastCharacter;
        }
    }

    /**
     * Save last search to storage
     */
    saveLastSearch(characterName) {
        StorageService.saveLastSearch(characterName);
    }

    /**
     * Perform character search with specified server
     * @param {string} characterName - Character name
     * @param {string} serverName - Server name (English)
     * @param {string} searchInput - Original search input to save
     * @returns {Promise<{character: Object, raidHistory: Array}>} Search results
     */
    async performSearch(characterName, serverName, searchInput) {
        // Save original search input for next search
        this.saveLastSearch(searchInput);

        // Update search field and placeholder
        this.elements.searchInput.value = searchInput;
        this.elements.searchInput.placeholder = searchInput;

        // Show loading
        this.ui.showLoading(MESSAGES.SEARCH.SEARCHING_CHARACTER);

        // Build search query with server
        const searchQuery = `${characterName} ${serverName}`;

        // Search for character ID
        const characterId = await this.search.searchCharacterId(searchQuery);

        // Update API usage after first query
        this.updateApiUsage();

        // Check if we have enough API points for the search
        const selectedTierCount = this.search.getSelectedTierCount();
        const requiredPoints = selectedTierCount * TIMING.POINTS_PER_TIER;

        if (!this.api.hasEnoughPoints(requiredPoints)) {
            const remainingPoints = this.api.getRemainingPoints();
            const resetMinutes = Math.ceil((this.api.getRateLimitInfo()?.pointsResetIn || 3600) / 60);
            throw new Error(MESSAGES.API.INSUFFICIENT_POINTS(requiredPoints, remainingPoints, resetMinutes));
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
        this.ui.showLoading(MESSAGES.SEARCH.SEARCHING_RAID_HISTORY);
        const raidHistory = await this.search.getRaidHistory(characterId);

        // Build character object for rendering
        const character = {
            id: characterId,
            name: characterName,
            server: { name: serverName }
        };

        return { character, raidHistory };
    }

    /**
     * Handle character search
     */
    async handleSearch() {
        // If already searching, confirm cancellation
        if (this.isSearching) {
            const confirmCancel = confirm(MESSAGES.GENERAL.CONFIRM_CANCEL_SEARCH);
            if (confirmCancel) {
                this.cancelSearch();
            }
            return;
        }

        let inputValue = this.elements.searchInput.value.trim();

        // If no input, use last search
        if (!inputValue) {
            inputValue = StorageService.getLastSearch() || '';
        }

        if (!inputValue) {
            alert(MESSAGES.SEARCH.ENTER_CHARACTER_NAME);
            return;
        }

        if (!this.api || !this.search) {
            alert(MESSAGES.SETTINGS.COMPLETE_API_SETTINGS);
            this.settingsModal.open();
            return;
        }

        // Parse character input
        const { characterName, serverName: parsedServer } = parseCharacterInput(inputValue);

        if (!characterName) {
            alert(MESSAGES.SEARCH.INVALID_CHARACTER_NAME);
            return;
        }

        // Save original user input for storage
        const originalInput = inputValue;

        // If server specified in input, search directly
        if (parsedServer) {
            await this.searchWithServer(characterName, parsedServer, originalInput);
            return;
        }

        // No server specified, check all servers
        const serverExistsMap = await this.checkCharacterOnServers(characterName);

        // Get list of servers where character exists
        const existingServers = Object.entries(serverExistsMap)
            .filter(([, id]) => id)
            .map(([server]) => server);

        // If character not found on any server, show error message and clear input
        if (existingServers.length === 0) {
            this.ui.showError(MESSAGES.SEARCH.NOT_FOUND_ON_ANY_SERVER(characterName));
            this.elements.searchInput.value = '';
            return;
        }

        // If character exists on exactly one server, search directly
        if (existingServers.length === 1) {
            const server = existingServers[0];
            await this.searchWithServer(characterName, server, originalInput);
            return;
        }

        // Otherwise show server selection
        this.showServerSelectionDialog(characterName, originalInput, 'initial', null, serverExistsMap);
    }

    /**
     * Search character on specified server
     * @param {string} characterName - Character name
     * @param {string} serverName - Server name (English)
     * @param {string} searchInput - Original search input to save
     */
    async searchWithServer(characterName, serverName, searchInput) {
        try {
            this.startSearchSession();

            const { character, raidHistory } = await this.performSearch(characterName, serverName, searchInput);
            const sortedHistory = this.displaySearchResults(character, raidHistory);

            // If no results, offer to search other servers
            if (sortedHistory.length === 0) {
                if (await this.handleEmptyResults(characterName, serverName, searchInput)) {
                    return;
                }
            }
        } catch (error) {
            if (isCharacterNotFoundError(error)) {
                if (await this.handleCharacterNotFound(characterName, serverName, searchInput)) {
                    return;
                }
            }
            this.ui.showError(error.message || MESSAGES.SEARCH.SEARCH_ERROR);
            this.updateApiUsage();
        } finally {
            this.endSearchSession();
        }
    }

    /**
     * Check if character exists on servers
     * @param {string} characterName - Character name
     * @param {string} excludeServer - Server to exclude from search (optional)
     * @returns {Object} Map of server -> characterId (or null if not found)
     */
    async checkCharacterOnServers(characterName, excludeServer = null) {
        try {
            let servers = KR_SERVERS.map(s => s.nameEN);

            if (excludeServer) {
                servers = servers.filter(s => s.toLowerCase() !== excludeServer.toLowerCase());
            }

            const result = await this.api.searchCharacterOnServers(
                characterName,
                servers,
                APP_CONFIG.REGION
            );

            // Update API usage after query
            this.updateApiUsage();

            return result;
        } catch {
            // If batch search fails, return empty map
            return {};
        }
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
     * Start search session - set searching state and update UI
     */
    startSearchSession() {
        this.isSearching = true;
        this.search.resetCancel();
        this.updateSearchButton();
        this.ui.disableControls();
        this.serverSelector.hide();
    }

    /**
     * End search session - reset searching state and update UI
     */
    endSearchSession() {
        this.isSearching = false;
        this.updateSearchButton();
        this.ui.enableControls();
    }

    /**
     * Handle empty search results - check other servers
     * @returns {boolean} Whether alternative servers were shown
     */
    async handleEmptyResults(characterName, serverName, searchInput) {
        const serverExistsMap = await this.checkCharacterOnServers(characterName, serverName);
        return this.showServerSelectionDialog(characterName, searchInput, 'noRecords', serverName, serverExistsMap);
    }

    /**
     * Handle character not found error - check other servers
     * @returns {boolean} Whether alternative servers were shown
     */
    async handleCharacterNotFound(characterName, serverName, searchInput) {
        const serverExistsMap = await this.checkCharacterOnServers(characterName, serverName);

        // Check if character exists on any other server
        const existsOnOtherServer = Object.values(serverExistsMap).some(id => id);
        if (!existsOnOtherServer) {
            this.ui.showError(MESSAGES.SEARCH.NOT_FOUND_ON_ANY_SERVER(characterName));
            this.elements.searchInput.value = '';
            return true;
        }

        return this.showServerSelectionDialog(characterName, searchInput, 'notFound', serverName, serverExistsMap);
    }

    /**
     * Display search results and clear input
     */
    displaySearchResults(character, raidHistory) {
        const sortedHistory = sortRaidHistory(raidHistory);
        this.ui.renderResults(character, sortedHistory);
        this.elements.searchInput.value = '';
        this.updateApiUsage();
        return sortedHistory;
    }

    /**
     * Show server selection dialog with unified callback
     * @param {string} characterName - Character name
     * @param {string} searchInput - Original search input
     * @param {'initial'|'noRecords'|'notFound'} type - Selection type
     * @param {string|null} failedServer - Server that failed (for noRecords/notFound)
     * @param {Object} serverExistsMap - Map of server -> characterId
     * @returns {boolean} Whether dialog was shown
     */
    showServerSelectionDialog(characterName, searchInput, type, failedServer, serverExistsMap) {
        const callback = (chosenServer) => {
            this.searchWithServer(characterName, chosenServer, searchInput);
        };

        switch (type) {
            case 'initial':
                this.serverSelector.showInitialSelection(characterName, callback, serverExistsMap);
                return true;
            case 'noRecords':
                return this.serverSelector.showNoRecordsSelection(
                    characterName, failedServer, callback, serverExistsMap
                );
            case 'notFound':
                return this.serverSelector.showNotFoundSelection(
                    characterName, failedServer, callback, serverExistsMap
                );
            default:
                return false;
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
