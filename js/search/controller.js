/**
 * Raid history search controller
 */

import { getSelectedRaidTiers } from '../constants.js';
import { searchCharacter as searchCharacterUtil } from './input.js';
import { processTierData } from './tiers.js';

/**
 * Sort raid history by release date (newest first)
 */
export function sortRaidHistory(raidHistory) {
    return raidHistory.sort((a, b) => {
        const dateA = new Date(a.tier.releaseDate);
        const dateB = new Date(b.tier.releaseDate);
        return dateB - dateA; // Newest first
    });
}

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

        // Check if cancelled before starting
        if (this.cancelled) {
            throw new Error('검색이 취소되었습니다.');
        }

        try {
            // Report progress: fetching raid data
            if (this.progressCallback) {
                this.progressCallback({
                    current: 1,
                    total: 2,
                    message: '레이드 클리어 기록 조회 중'
                });
            }

            // Get all tier data in a single batch query
            const batchResults = await this.api.getBatchTierData(character.id, tiers);

            // Update API usage after batch query
            if (this.apiUsageCallback) {
                this.apiUsageCallback();
            }

            // Collect all report/fight pairs for batch party member query
            const reportFights = [];
            batchResults.forEach((combinedData) => {
                if (combinedData && combinedData.earliestClear) {
                    const reportCode = combinedData.earliestClear.report?.code || null;
                    const fightId = combinedData.earliestClear.report?.fightID || null;
                    reportFights.push({ reportCode, fightId });
                } else {
                    reportFights.push({ reportCode: null, fightId: null });
                }
            });

            // Report progress: fetching party members
            if (this.progressCallback) {
                this.progressCallback({
                    current: 2,
                    total: 2,
                    message: '파티 멤버 정보 조회 중'
                });
            }

            // Get all party members in a single batch query
            const batchPartyMembers = await this.api.getBatchPartyMembers(reportFights);

            // Update API usage after batch query
            if (this.apiUsageCallback) {
                this.apiUsageCallback();
            }

            // Process results with pre-fetched party members
            const results = [];
            for (let i = 0; i < tiers.length; i++) {
                // Check if cancelled during processing
                if (this.cancelled) {
                    throw new Error('검색이 취소되었습니다.');
                }

                const tier = tiers[i];
                const combinedData = batchResults[i];
                const partyData = batchPartyMembers[i];
                const partyMembers = partyData?.partyMembers || [];
                const fightStartTime = partyData?.fightStartTime || null;
                const fightEndTime = partyData?.fightEndTime || null;

                if (combinedData && combinedData.earliestClear) {
                    try {
                        const clearData = processTierData(this.api, combinedData, tier, partyMembers, fightStartTime, fightEndTime);

                        if (clearData) {
                            results.push({
                                expansion: tier.expansion,
                                tier: tier,
                                clearData: clearData
                            });
                        }
                    } catch (error) {
                        // Continue with other tiers even if one fails
                    }
                }
            }

            return results;
        } catch (error) {
            // Update API usage on error
            if (this.apiUsageCallback) {
                this.apiUsageCallback();
            }
            throw error;
        }
    }
}
