/**
 * GraphQL query building utilities
 */

/**
 * Build tier data query field
 * @param {number} index - Tier index
 * @returns {string} Query field string
 */
export function buildTierQueryField(index) {
    const alias = `tier${index}`;
    return `
        ${alias}: character(id: $characterId) {
            zoneRankings(
                zoneID: $zoneId${index},
                difficulty: $difficulty${index},
                partition: $partition${index}
            )
            encounterRankings(
                encounterID: $encounterId${index},
                difficulty: $difficulty${index},
                partition: $partition${index}
            )
        }
    `;
}

/**
 * Build tier data query variables
 * @param {Object} tier - Tier configuration
 * @param {number} index - Tier index
 * @returns {Object} { definitions, values }
 */
export function buildTierQueryVariables(tier, index) {
    const difficulty = tier.type === 'SAVAGE' ? 101 : 100;

    return {
        definitions: `$zoneId${index}: Int!, $encounterId${index}: Int!, $difficulty${index}: Int, $partition${index}: Int`,
        values: {
            [`zoneId${index}`]: tier.zoneId,
            [`encounterId${index}`]: tier.finalEncounterId,
            [`difficulty${index}`]: difficulty,
            [`partition${index}`]: tier.partition
        }
    };
}

/**
 * Build report query field
 * @param {number} index - Report index
 * @returns {string} Query field string
 */
export function buildReportQueryField(index) {
    const alias = `report${index}`;
    return `
        ${alias}: report(code: $reportCode${index}) {
            startTime
            fights {
                id
                startTime
                endTime
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
}

/**
 * Build report query variables
 * @param {Object} reportFight - Report fight info
 * @param {number} index - Report index
 * @returns {Object} { definitions, values }
 */
export function buildReportQueryVariables(reportFight, index) {
    return {
        definitions: `$reportCode${index}: String!`,
        values: {
            [`reportCode${index}`]: reportFight.reportCode
        }
    };
}
