/**
 * Raid history search controller
 */

import { getSelectedRaidTiers } from '../constants.js';
import { searchCharacter as searchCharacterUtil } from './character.js';
import { getTierClearData, delay } from './tiers.js';
import { TIMING } from '../config/config.js';

/**
 * Search character and get raid clear history
 */
export class RaidHistorySearch {
    constructor(api, region) {
        this.api = api;
        this.region = region;
        this.progressCallback = null;
        this.apiUsageCallback = null;
        this.cancelled = false;
    }

    /**
     * Set progress callback function
     */
    setProgressCallback(callback) {
        this.progressCallback = callback;
    }

    /**
     * Set API usage callback function
     */
    setApiUsageCallback(callback) {
        this.apiUsageCallback = callback;
    }

    /**
     * Cancel ongoing search
     */
    cancel() {
        this.cancelled = true;
    }

    /**
     * Reset cancel state
     */
    resetCancel() {
        this.cancelled = false;
    }

    /**
     * Search for character and get their raid history
     */
    async searchCharacter(searchInput) {
        return searchCharacterUtil(this.api, searchInput, this.region);
    }

    /**
     * Get count of selected raid tiers
     */
    getSelectedTierCount() {
        const tiers = getSelectedRaidTiers();
        return tiers.length;
    }

    /**
     * Get all raid tier clear data for a character
     */
    async getRaidHistory(character) {
        const tiers = getSelectedRaidTiers();
        const results = [];
        const totalTiers = tiers.length;

        for (let i = 0; i < tiers.length; i++) {
            // Check if cancelled
            if (this.cancelled) {
                throw new Error('검색이 취소되었습니다.');
            }

            // Check if we still have enough API points before each tier query
            const remainingTiers = tiers.length - i;
            const requiredPoints = remainingTiers * TIMING.POINTS_PER_TIER;

            if (!this.api.hasEnoughPoints(requiredPoints)) {
                const remainingPoints = this.api.getRemainingPoints();
                const resetMinutes = Math.ceil((this.api.getRateLimitInfo()?.pointsResetIn || 3600) / 60);
                throw new Error(
                    `API 포인트가 부족하여 검색을 중단합니다.\n` +
                    `남은 포인트: ${remainingPoints} 포인트\n` +
                    `${resetMinutes}분 후 리셋됩니다. 잠시 후 다시 시도해주세요.`
                );
            }

            const tier = tiers[i];

            // Report progress
            if (this.progressCallback) {
                this.progressCallback({
                    current: i + 1,
                    total: totalTiers,
                    tierName: tier.fullName,
                    expansion: tier.expansion
                });
            }

            try {
                const clearData = await getTierClearData(this.api, character.id, tier);

                if (clearData) {
                    results.push({
                        expansion: tier.expansion,
                        tier: tier,
                        clearData: clearData
                    });
                }

                // Update API usage after each tier query
                if (this.apiUsageCallback) {
                    this.apiUsageCallback();
                }
            } catch (error) {
                // Continue with other tiers even if one fails
                // Still update API usage on error
                if (this.apiUsageCallback) {
                    this.apiUsageCallback();
                }
            }

            // Add a small delay to avoid rate limiting
            await delay(TIMING.SEARCH_DELAY_MS);
        }

        return results;
    }
}
