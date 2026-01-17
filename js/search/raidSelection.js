/**
 * Raid selection business logic
 * Handles raid tier selection data and persistence
 */

import { RAID_TIERS } from '../constants.js';
import { StorageService } from '../main/storage.js';

/**
 * Get tier ID from tier object
 * @param {Object} tier - Tier object
 * @returns {string} Tier ID
 */
export function getTierId(tier) {
    return `${tier.zoneId}-${tier.partition}`;
}

/**
 * Get selected raid IDs from storage
 * @returns {string[]|null}
 */
export function getSelectedRaidIds() {
    return StorageService.getSelectedRaids();
}

/**
 * Save selected raid IDs to storage
 * @param {string[]} ids - Selected raid IDs
 */
export function saveSelectedRaidIds(ids) {
    StorageService.saveSelectedRaids(ids);
}

/**
 * Check if a tier is selected
 * @param {string} tierId - Tier ID
 * @param {string[]|null} selectedIds - Selected IDs (null means all selected)
 * @returns {boolean}
 */
export function isTierSelected(tierId, selectedIds) {
    return !selectedIds || selectedIds.includes(tierId);
}

/**
 * Get raid selection data for rendering
 * @returns {Array} Array of expansion groups with tiers
 */
export function getRaidSelectionData() {
    const selectedIds = getSelectedRaidIds();
    const expansions = [];

    for (const expansionKey in RAID_TIERS) {
        const expansion = RAID_TIERS[expansionKey];
        const tiers = expansion.tiers.map(tier => {
            const tierId = getTierId(tier);
            return {
                id: tierId,
                expansionKey,
                fullName: tier.fullName,
                type: tier.type,
                typeLabel: tier.type === 'SAVAGE' ? '영식' : '절',
                typeClass: tier.type === 'SAVAGE' ? 'tier-type-savage' : 'tier-type-ultimate',
                isSelected: isTierSelected(tierId, selectedIds)
            };
        });

        expansions.push({
            key: expansionKey,
            name: expansion.expansion,
            tiers
        });
    }

    return expansions;
}
