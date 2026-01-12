/**
 * Event handlers and initialization utilities
 */

import { STORAGE_KEYS, KR_SERVERS } from '../constants.js';

/**
 * Initialize DOM element references
 */
export function initializeElements() {
    return {
        serverSelect: document.getElementById('serverSelect'),
        searchInput: document.getElementById('characterSearch'),
        searchBtn: document.getElementById('searchBtn'),
        raidSelectBtn: document.getElementById('raidSelectBtn'),
        settingsBtn: document.getElementById('settingsBtn'),
        exportImageBtn: document.getElementById('exportImageBtn'),
        selectAllRaidsBtn: document.getElementById('selectAllRaidsBtn'),
        deselectAllRaidsBtn: document.getElementById('deselectAllRaidsBtn'),
        saveRaidSelectionBtn: document.getElementById('saveRaidSelectionBtn'),
        saveSettingsBtn: document.getElementById('saveSettingsBtn')
    };
}

/**
 * Populate server dropdown with Korean servers
 */
export function populateServerSelect(serverSelect) {
    KR_SERVERS.forEach(server => {
        const option = document.createElement('option');
        option.value = server.nameEN;
        option.textContent = server.nameKR; // Korean name only
        serverSelect.appendChild(option);
    });

    // Load saved server
    const savedServer = localStorage.getItem(STORAGE_KEYS.SERVER);
    if (savedServer) {
        serverSelect.value = savedServer;
    }
}

/**
 * Attach event listeners to application elements
 */
export function attachEventListeners(app, elements, modals) {
    const { searchBtn, searchInput, raidSelectBtn, settingsBtn, exportImageBtn,
            selectAllRaidsBtn, deselectAllRaidsBtn, saveRaidSelectionBtn, saveSettingsBtn } = elements;

    const { settingsModal, raidSelectionModal } = modals;

    // Search
    searchBtn.addEventListener('click', () => app.handleSearch());
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            app.handleSearch();
        }
    });

    // Raid Selection
    raidSelectBtn.addEventListener('click', () => raidSelectionModal.open());
    raidSelectionModal.closeRaidSelectModal.addEventListener('click', () => raidSelectionModal.close());
    selectAllRaidsBtn.addEventListener('click', () => raidSelectionModal.selectAll());
    deselectAllRaidsBtn.addEventListener('click', () => raidSelectionModal.deselectAll());
    saveRaidSelectionBtn.addEventListener('click', () => raidSelectionModal.save());

    // Settings
    settingsBtn.addEventListener('click', () => settingsModal.open());
    settingsModal.closeSettingsModal.addEventListener('click', () => settingsModal.close());
    saveSettingsBtn.addEventListener('click', () => app.saveSettings());

    // Export
    exportImageBtn.addEventListener('click', async () => {
        const { exportAsImage } = await import('../ui.js');
        exportAsImage();
    });

    // Close modals on outside click
    raidSelectionModal.raidSelectModal.addEventListener('click', (e) => {
        if (e.target === raidSelectionModal.raidSelectModal) {
            raidSelectionModal.close();
        }
    });
    settingsModal.settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal.settingsModal) {
            settingsModal.close();
        }
    });
}
