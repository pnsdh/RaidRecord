/**
 * Main application controller
 */

import { initializeAPI, saveCredentials } from '../api.js';
import { RaidHistorySearch, sortRaidHistory } from '../search.js';
import { UIController } from '../ui.js';
import { STORAGE_KEYS, APP_CONFIG } from '../constants.js';
import { UI_CONFIG } from '../config.js';
import { SettingsModal, RaidSelectionModal } from './modals.js';
import { initializeElements, populateServerSelect, attachEventListeners } from './handlers.js';

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

        const characterName = this.elements.searchInput.value.trim();
        const serverName = this.elements.serverSelect.value;

        if (!characterName) {
            alert('캐릭터명을 입력해주세요.');
            return;
        }

        if (!serverName) {
            alert('서버를 선택해주세요.');
            return;
        }

        if (!this.api || !this.search) {
            alert('먼저 FFLogs API 설정을 완료해주세요.');
            this.settingsModal.open();
            return;
        }

        try {
            // Set searching state
            this.isSearching = true;
            this.search.resetCancel();
            this.updateSearchButton();

            // Save selected server
            localStorage.setItem(STORAGE_KEYS.SERVER, serverName);

            // Show loading
            this.ui.showLoading('캐릭터 검색 중...');

            // Build search query with server
            const searchQuery = `${characterName} ${serverName}`;

            // Search for character
            const character = await this.search.searchCharacter(searchQuery);

            // Update API usage after first query
            this.updateApiUsage();

            // Set progress callback
            this.search.setProgressCallback((progress) => {
                this.ui.updateProgress(progress);
            });

            // Get raid history
            this.ui.showLoading('레이드 이력 검색 중...');
            const raidHistory = await this.search.getRaidHistory(character);

            // Sort by newest first
            const sortedHistory = sortRaidHistory(raidHistory);

            // Render results
            this.ui.renderResults(character, sortedHistory);

            // Update API usage after all queries
            this.updateApiUsage();

        } catch (error) {
            this.ui.showError(error.message || '검색 중 오류가 발생했습니다.');

            // Still try to update API usage on error
            this.updateApiUsage();
        } finally {
            // Reset searching state
            this.isSearching = false;
            this.updateSearchButton();
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
