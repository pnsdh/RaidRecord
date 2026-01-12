/**
 * Raid tier clear data retrieval
 */

import { DIFFICULTY, getWeekNumber, formatDate } from '../constants.js';

/**
 * Get clear data for a specific raid tier
 */
export async function getTierClearData(api, characterId, tier) {
    const difficulty = tier.type === 'SAVAGE' ? DIFFICULTY.SAVAGE : DIFFICULTY.ULTIMATE;

    // Use the finalEncounterId from tier data
    const finalEncounterId = tier.finalEncounterId;

    if (!finalEncounterId) {
        return null;
    }

    // Get the earliest clear for this encounter
    const earliestClear = await api.getEarliestClear(
        characterId,
        tier.zoneId,
        finalEncounterId,
        difficulty,
        tier.partition
    );

    if (!earliestClear) {
        return null;
    }

    // Get all-star data
    const allStarData = await api.getAllStarPoints(
        characterId,
        tier.zoneId,
        tier.partition
    );

    // Extract report information from the parse record
    const reportCode = earliestClear.report?.code || null;
    const fightId = earliestClear.report?.fightID || null;
    const clearTimestamp = earliestClear.startTime || null;
    const jobSpec = earliestClear.spec || null;

    if (!clearTimestamp) {
        return {
            encounterName: '',
            job: jobSpec ? api.getJobFromSpecId(jobSpec) : 'Unknown',
            clearTimestamp: null,
            clearWeek: null,
            clearDate: 'Unknown',
            allStarPoints: allStarData.points,
            allStarRank: allStarData.rank,
            allStarTotal: allStarData.total,
            partyMembers: [],
            reportCode: null,
            fightId: null
        };
    }

    // Get party members if we have report info
    let partyMembers = [];
    if (reportCode && fightId) {
        try {
            partyMembers = await api.getPartyMembers(reportCode, fightId);
        } catch (error) {
            // Silently fail
        }
    }

    return {
        encounterName: '',
        job: api.getJobFromSpecId(jobSpec),
        clearTimestamp: clearTimestamp,
        clearWeek: getWeekNumber(tier.releaseDate, clearTimestamp),
        clearDate: formatDate(clearTimestamp),
        allStarPoints: allStarData.points,
        allStarRank: allStarData.rank,
        allStarTotal: allStarData.total,
        partyMembers: partyMembers,
        reportCode: reportCode,
        fightId: fightId
    };
}

/**
 * Utility function to delay execution
 */
export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
