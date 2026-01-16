/**
 * Utility functions for raid tier processing
 */

import { getWeekNumber, formatDate, isAmbiguousWeek } from '../constants.js';

/**
 * Process tier data with pre-fetched party members
 */
export function processTierData(api, combinedData, tier, partyMembers = [], fightStartTime = null, fightEndTime = null) {
    const earliestClear = combinedData.earliestClear;
    const allStarData = combinedData.allStarData;
    const jobFrequency = combinedData.jobFrequency || [];
    const encounterAllStars = combinedData.encounterAllStars || [];

    // Extract report information from the parse record
    const reportCode = earliestClear.report?.code || null;
    const fightId = earliestClear.report?.fightID || null;
    // earliestClear.startTime is actually the fight START time from FFLogs API
    const clearTimestamp = fightEndTime || earliestClear.startTime || null;
    const jobSpec = earliestClear.spec || null;

    // Convert job frequency specs to job names
    const jobFrequencyData = jobFrequency.map(item => ({
        job: api.getJobFromSpecId(item.spec),
        count: item.count
    }));

    // Convert encounter all-star specs to job names
    const encounterAllStarsData = encounterAllStars.map(item => ({
        encounterId: item.encounterId,
        encounterName: item.encounterName,
        job: item.spec ? api.getJobFromSpecId(item.spec) : 'Unknown',
        points: item.points,
        rank: item.rank,
        total: item.total
    }));

    if (!clearTimestamp) {
        return {
            encounterName: '',
            job: jobSpec ? api.getJobFromSpecId(jobSpec) : 'Unknown',
            clearTimestamp: null,
            fightStartTime: null,
            clearWeek: null,
            clearDate: 'Unknown',
            allStarPoints: allStarData.points,
            allStarRank: allStarData.rank,
            allStarTotal: allStarData.total,
            encounterAllStars: encounterAllStarsData,
            partyMembers: [],
            jobFrequency: jobFrequencyData,
            reportCode: null,
            fightId: null
        };
    }

    // Use fight start time for week calculation if available, otherwise use clear time
    // fightStartTime should be the actual start, clearTimestamp is the end time
    const weekCalculationTime = fightStartTime || clearTimestamp;
    const isWeekAmbiguous = isAmbiguousWeek(fightStartTime);

    return {
        encounterName: '',
        job: api.getJobFromSpecId(jobSpec),
        clearTimestamp: clearTimestamp,
        fightStartTime: fightStartTime,
        clearWeek: getWeekNumber(tier.releaseDate, weekCalculationTime),
        isWeekAmbiguous: isWeekAmbiguous,
        clearDate: formatDate(clearTimestamp),
        allStarPoints: allStarData.points,
        allStarRank: allStarData.rank,
        allStarTotal: allStarData.total,
        encounterAllStars: encounterAllStarsData,
        partyMembers: partyMembers,
        jobFrequency: jobFrequencyData,
        reportCode: reportCode,
        fightId: fightId
    };
}
