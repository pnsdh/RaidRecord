/**
 * FFLogs API - Report and encounter queries
 */

import { buildReportQueryField, buildReportQueryVariables } from './queryBuilder.js';

/**
 * Report and party member methods
 */
export class ReportsAPI {
    /**
     * @param {Object} core - FFLogsAPICore instance
     */
    constructor(core) {
        this.core = core;
    }

    /**
     * Get party members for multiple reports in a single batch query
     */
    async getBatchPartyMembers(reportFights) {
        if (!reportFights || reportFights.length === 0) {
            return [];
        }

        // Create index mapping for valid reports
        const validReportsMap = new Map();
        const validReports = [];

        reportFights.forEach((rf, originalIndex) => {
            if (rf.reportCode && rf.fightId) {
                validReportsMap.set(validReports.length, originalIndex);
                validReports.push(rf);
            }
        });

        if (validReports.length === 0) {
            return reportFights.map(() => []);
        }

        // Build query with aliases for each report
        let queryFields = '';
        let variableDefinitions = '';
        const variables = {};

        validReports.forEach((rf, index) => {
            // Build query field
            queryFields += buildReportQueryField(rf, index);

            // Build variables
            const { definitions, values } = buildReportQueryVariables(rf, index);
            variableDefinitions += (index > 0 ? ', ' : '') + definitions;
            Object.assign(variables, values);
        });

        const queryString = `
            query(${variableDefinitions}) {
                reportData {
                    ${queryFields}
                }
            }
        `;

        const data = await this.core.query(queryString, variables, true);

        // Initialize results array with empty data for all reports
        const results = reportFights.map(() => ({ partyMembers: [], fightStartTime: null, fightEndTime: null }));

        // Process results for each valid report
        validReports.forEach((rf, index) => {
            const alias = `report${index}`;
            const report = data.reportData[alias];
            const originalIndex = validReportsMap.get(index);

            if (!report) {
                return;
            }

            const fight = report.fights.find(f => f.id === rf.fightId);

            if (!fight) {
                return;
            }

            // Get only players who participated in this specific fight
            const fightPlayerIds = fight.friendlyPlayers || [];

            if (fightPlayerIds.length === 0) {
                return;
            }

            // Get all players from the report
            const allPlayers = report.masterData.actors;

            // Filter to only players who were in this fight
            const fightPlayers = allPlayers.filter(player =>
                fightPlayerIds.includes(player.id)
            );

            // Filter out non-player actors (Multiple Players, Limit Break, etc.)
            const realPlayers = fightPlayers.filter(player =>
                player.server !== null &&
                player.server !== undefined &&
                player.name !== 'Multiple Players' &&
                player.name !== 'Limit Break'
            );

            // Map subType (spec ID) to job name
            const partyMembers = realPlayers.map(player => ({
                name: player.name,
                server: player.server,
                job: this.core.getJobFromSpecId(player.subType)
            }));

            // Calculate absolute fight times (report start + fight offset)
            const reportStartTime = report.startTime || 0;
            const fightStartOffset = fight.startTime || 0;
            const fightEndOffset = fight.endTime || 0;
            const fightStartTime = reportStartTime + fightStartOffset;
            const fightEndTime = reportStartTime + fightEndOffset;

            results[originalIndex] = {
                partyMembers,
                fightStartTime,
                fightEndTime
            };
        });

        return results;
    }
}
