/**
 * Modal management utilities
 */

import { STORAGE_KEYS, RAID_TIERS, getAllRaidTiers } from '../constants.js';

/**
 * Settings modal functionality
 */
export class SettingsModal {
    constructor(app) {
        this.app = app;
        this.settingsModal = document.getElementById('settingsModal');
        this.closeSettingsModal = document.getElementById('closeSettingsModal');
        this.clientIdInput = document.getElementById('clientId');
        this.clientSecretInput = document.getElementById('clientSecret');
    }

    /**
     * Open settings modal
     */
    open() {
        // Load current settings
        const clientId = localStorage.getItem(STORAGE_KEYS.CLIENT_ID) || '';
        const clientSecret = localStorage.getItem(STORAGE_KEYS.CLIENT_SECRET) || '';

        this.clientIdInput.value = clientId;
        this.clientSecretInput.value = clientSecret;

        this.settingsModal.style.display = 'flex';
    }

    /**
     * Close settings modal
     */
    close() {
        this.settingsModal.style.display = 'none';
    }
}

/**
 * Raid selection modal functionality
 */
export class RaidSelectionModal {
    constructor(app) {
        this.app = app;
        this.raidSelectModal = document.getElementById('raidSelectModal');
        this.closeRaidSelectModal = document.getElementById('closeRaidSelectModal');
        this.raidSelectionList = document.getElementById('raidSelectionList');
    }

    /**
     * Open raid selection modal
     */
    open() {
        // Generate raid selection UI
        this.render();
        this.raidSelectModal.style.display = 'flex';
    }

    /**
     * Close raid selection modal
     */
    close() {
        this.raidSelectModal.style.display = 'none';
    }

    /**
     * Render raid selection UI
     */
    render() {
        const selectedIds = JSON.parse(localStorage.getItem(STORAGE_KEYS.SELECTED_RAIDS) || 'null');
        const allTiers = getAllRaidTiers();

        let html = '';

        for (const expansionKey in RAID_TIERS) {
            const expansion = RAID_TIERS[expansionKey];
            const expansionName = expansion.expansion;

            html += `<div class="expansion-group">`;
            html += `<div class="expansion-header" data-expansion="${expansionKey}">${expansionName}</div>`;
            html += `<div class="tier-checkbox-list">`;

            for (const tier of expansion.tiers) {
                const tierId = `${tier.zoneId}-${tier.partition}`;
                const isChecked = !selectedIds || selectedIds.includes(tierId);
                const typeClass = tier.type === 'SAVAGE' ? 'tier-type-savage' : 'tier-type-ultimate';
                const typeLabel = tier.type === 'SAVAGE' ? '영식' : '절';

                html += `
                    <div class="tier-checkbox-item">
                        <input type="checkbox" id="raid-${tierId}" value="${tierId}" ${isChecked ? 'checked' : ''} data-expansion="${expansionKey}">
                        <label for="raid-${tierId}">
                            <span class="tier-type-badge ${typeClass}">${typeLabel}</span>
                            <span class="tier-name">${tier.fullName}</span>
                        </label>
                    </div>
                `;
            }

            html += `</div></div>`;
        }

        this.raidSelectionList.innerHTML = html;

        // Add expansion header click handlers
        document.querySelectorAll('.expansion-header').forEach(header => {
            header.addEventListener('click', (e) => {
                const expansionKey = e.target.dataset.expansion;
                this.toggleExpansionSelection(expansionKey);
            });
        });
    }

    /**
     * Toggle all checkboxes in an expansion
     */
    toggleExpansionSelection(expansionKey) {
        const checkboxes = document.querySelectorAll(`input[data-expansion="${expansionKey}"]`);
        const allChecked = Array.from(checkboxes).every(cb => cb.checked);

        checkboxes.forEach(cb => {
            cb.checked = !allChecked;
        });
    }

    /**
     * Select all raids
     */
    selectAll() {
        document.querySelectorAll('.tier-checkbox-item input[type="checkbox"]').forEach(cb => {
            cb.checked = true;
        });
    }

    /**
     * Deselect all raids
     */
    deselectAll() {
        document.querySelectorAll('.tier-checkbox-item input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
        });
    }

    /**
     * Save raid selection
     */
    save() {
        const selectedIds = [];
        document.querySelectorAll('.tier-checkbox-item input[type="checkbox"]:checked').forEach(cb => {
            selectedIds.push(cb.value);
        });

        localStorage.setItem(STORAGE_KEYS.SELECTED_RAIDS, JSON.stringify(selectedIds));
        this.close();
        alert(`${selectedIds.length}개의 레이드가 선택되었습니다.`);
    }
}
