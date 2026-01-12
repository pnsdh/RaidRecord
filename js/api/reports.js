/**
 * FFLogs API - Report and encounter queries
 */

/**
 * Report and party member methods
 */
export class ReportsAPI {
    /**
     * Get zone information (encounters in a zone)
     */
    async getZoneEncounters(zoneId) {
        const queryString = `
            query($zoneId: Int!) {
                worldData {
                    zone(id: $zoneId) {
                        id
                        name
                        encounters {
                            id
                            name
                        }
                    }
                }
            }
        `;

        const data = await this.query(queryString, { zoneId });

        if (!data?.worldData?.zone) {
            return null;
        }

        return data.worldData.zone;
    }

    /**
     * Get fight details from a report
     */
    async getReportFights(reportCode) {
        const queryString = `
            query($reportCode: String!) {
                reportData {
                    report(code: $reportCode) {
                        code
                        startTime
                        endTime
                        fights {
                            id
                            encounterID
                            name
                            difficulty
                            kill
                            startTime
                            endTime
                            friendlyPlayers
                        }
                        masterData {
                            actors(type: "Player") {
                                id
                                name
                                server
                                type
                                subType
                            }
                        }
                    }
                }
            }
        `;

        const data = await this.query(queryString, { reportCode });

        if (!data?.reportData?.report) {
            return null;
        }

        return data.reportData.report;
    }

    /**
     * Get party members from a specific fight
     */
    async getPartyMembers(reportCode, fightId) {
        const report = await this.getReportFights(reportCode);

        if (!report) {
            return [];
        }

        const fight = report.fights.find(f => f.id === fightId);

        if (!fight) {
            return [];
        }

        // Get only players who participated in this specific fight
        const fightPlayerIds = fight.friendlyPlayers || [];

        if (fightPlayerIds.length === 0) {
            return [];
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
        return realPlayers.map(player => ({
            name: player.name,
            server: player.server,
            job: this.getJobFromSpecId(player.subType)
        }));
    }

    /**
     * Get encounter rankings for all-star calculation
     */
    async getEncounterRankings(encounterId, characterName, serverName, serverRegion, difficulty, partition) {
        const queryString = `
            query($encounterId: Int!, $serverRegion: String!, $difficulty: Int, $partition: Int) {
                worldData {
                    encounter(id: $encounterId) {
                        characterRankings(
                            serverRegion: $serverRegion
                            difficulty: $difficulty
                            partition: $partition
                        )
                    }
                }
            }
        `;

        const data = await this.query(queryString, {
            encounterId,
            serverRegion,
            difficulty,
            partition
        });

        if (!data?.worldData?.encounter?.characterRankings) {
            return null;
        }

        const rankings = data.worldData.encounter.characterRankings;

        // Find the character in the rankings
        if (rankings && rankings.rankings) {
            const charRanking = rankings.rankings.find(r =>
                r.name.toLowerCase() === characterName.toLowerCase() &&
                r.server.name.toLowerCase() === serverName.toLowerCase()
            );

            return charRanking || null;
        }

        return null;
    }
}
