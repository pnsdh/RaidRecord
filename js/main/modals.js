/**
 * Modal management utilities
 */

import { RAID_TIERS, getAllRaidTiers } from '../constants.js';
import { StorageService } from './storage.js';
import { MESSAGES } from '../config/messages.js';

/**
 * Base modal class with common functionality
 */
class BaseModal {
    constructor(modalId, closeButtonId) {
        this.modal = document.getElementById(modalId);
        this.closeButton = document.getElementById(closeButtonId);

        this.setupEventListeners();
    }

    /**
     * Setup common event listeners
     */
    setupEventListeners() {
        // Close button click
        if (this.closeButton) {
            this.closeButton.addEventListener('click', () => this.close());
        }

        // Click outside modal to close
        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) {
                    this.close();
                }
            });
        }
    }

    /**
     * Open modal - can be overridden by subclasses
     */
    open() {
        this.beforeOpen();
        if (this.modal) {
            this.modal.style.display = 'flex';
        }
    }

    /**
     * Close modal
     */
    close() {
        if (this.modal) {
            this.modal.style.display = 'none';
        }
    }

    /**
     * Hook for subclasses to execute before opening
     */
    beforeOpen() {
        // Override in subclasses
    }
}

/**
 * Settings modal functionality
 */
export class SettingsModal extends BaseModal {
    constructor(app) {
        super('settingsModal', 'closeSettingsModal');
        this.app = app;
        this.clientIdInput = document.getElementById('clientId');
        this.clientSecretInput = document.getElementById('clientSecret');
    }

    /**
     * Load settings before opening
     */
    beforeOpen() {
        const { clientId, clientSecret } = StorageService.getCredentials();

        this.clientIdInput.value = clientId || '';
        this.clientSecretInput.value = clientSecret || '';
    }
}

/**
 * Raid selection modal functionality
 */
export class RaidSelectionModal extends BaseModal {
    constructor(app) {
        super('raidSelectModal', 'closeRaidSelectModal');
        this.app = app;
        this.raidSelectionList = document.getElementById('raidSelectionList');
    }

    /**
     * Render UI before opening
     */
    beforeOpen() {
        this.render();
    }

    /**
     * Render raid selection UI
     */
    render() {
        const selectedIds = StorageService.getSelectedRaids();
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

        StorageService.saveSelectedRaids(selectedIds);
        this.close();
        alert(MESSAGES.RAID_SELECTION.SAVED(selectedIds.length));
    }
}
