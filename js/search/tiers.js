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

    // Get combined data (earliest clear + all-star) in one query
    const combinedData = await api.getCombinedTierData(
        characterId,
        tier.zoneId,
        finalEncounterId,
        difficulty,
        tier.partition
    );

    const earliestClear = combinedData.earliestClear;
    const allClears = combinedData.allClears || [];
    const allStarData = combinedData.allStarData;

    if (!earliestClear) {
        return null;
    }

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
            fightId: null,
            additionalJobs: []
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

    // Extract all additional jobs (excluding first clear and deduplicating)
    const additionalJobs = [];
    const seenJobs = new Set([jobSpec]);
    
    for (const clearRecord of allClears) {
        if (clearRecord.spec && !seenJobs.has(clearRecord.spec)) {
            seenJobs.add(clearRecord.spec);
            additionalJobs.push({
                job: api.getJobFromSpecId(clearRecord.spec),
                spec: clearRecord.spec
            });
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
        fightId: fightId,
        additionalJobs: additionalJobs
    };
}

/**
 * Utility function to delay execution
 */
export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
