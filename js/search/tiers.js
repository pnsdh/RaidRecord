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
    const jobFrequency = combinedData.jobFrequency || [];

    // Extract report information from the parse record
    const reportCode = earliestClear.report?.code || null;
    const fightId = earliestClear.report?.fightID || null;
    const clearTimestamp = earliestClear.startTime || null;
    const jobSpec = earliestClear.spec || null;

    // Convert job frequency specs to job names
    const jobFrequencyData = jobFrequency.map(item => ({
        job: api.getJobFromSpecId(item.spec),
        count: item.count
    }));

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
            jobFrequency: jobFrequencyData,
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
        jobFrequency: jobFrequencyData,
        reportCode: reportCode,
        fightId: fightId
    };
}
