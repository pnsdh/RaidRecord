/**
 * FFLogs API - Report and encounter queries
 */

/**
 * Report and party member methods
 */
export class ReportsAPI {
    /**
     * Get party members for multiple reports in a single batch query
     */
    async getBatchPartyMembers(reportFights) {
        if (!reportFights || reportFights.length === 0) {
            return [];
        }

        // Filter out invalid entries
        const validReports = reportFights.filter(rf => rf.reportCode && rf.fightId);

        if (validReports.length === 0) {
            return [];
        }

        // Build query with aliases for each report
        let queryFields = '';
        const variables = {};

        validReports.forEach((rf, index) => {
            const alias = `report${index}`;
            variables[`reportCode${index}`] = rf.reportCode;

            queryFields += `
                ${alias}: report(code: $reportCode${index}) {
                    code
                    fights {
                        id
                        friendlyPlayers
                    }
                    masterData {
                        actors(type: "Player") {
                            id
                            name
                            server
                            subType
                        }
                    }
                }
            `;
        });

        // Build variable definitions
        let variableDefinitions = '';
        validReports.forEach((_, index) => {
            if (index > 0) variableDefinitions += ', ';
            variableDefinitions += `$reportCode${index}: String!`;
        });

        const queryString = `
            query(${variableDefinitions}) {
                reportData {
                    ${queryFields}
                }
            }
        `;

        const data = await this.query(queryString, variables, true);

        // Process results for each report
        const results = [];
        validReports.forEach((rf, index) => {
            const alias = `report${index}`;
            const report = data.reportData[alias];

            if (!report) {
                results.push([]);
                return;
            }

            const fight = report.fights.find(f => f.id === rf.fightId);

            if (!fight) {
                results.push([]);
                return;
            }

            // Get only players who participated in this specific fight
            const fightPlayerIds = fight.friendlyPlayers || [];

            if (fightPlayerIds.length === 0) {
                results.push([]);
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
                job: this.getJobFromSpecId(player.subType)
            }));

            results.push(partyMembers);
        });

        return results;
    }
}
