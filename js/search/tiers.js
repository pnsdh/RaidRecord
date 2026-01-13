/**
 * Utility functions for raid tier processing
 */

import { getWeekNumber, formatDate } from '../constants.js';

/**
 * Process tier data with pre-fetched party members
 */
export function processTierData(api, combinedData, tier, partyMembers = []) {
    const earliestClear = combinedData.earliestClear;
    const allStarData = combinedData.allStarData;

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
