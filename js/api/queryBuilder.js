/**
 * GraphQL query building utilities
 */

/**
 * Build aliased batch query with dynamic variable definitions
 * @param {Object} config - Query configuration
 * @param {Array} config.items - Items to build queries for
 * @param {Function} config.buildField - Function(item, index, alias) that returns query field string
 * @param {Function} config.buildVariables - Function(item, index) that returns { definitions: string, values: object }
 * @param {string} config.wrapperPath - Path to wrap query fields (e.g., 'characterData', 'reportData')
 * @param {Object} config.baseVariables - Base variables to include (e.g., { characterId: 123 })
 * @param {string} config.baseDefinitions - Base variable definitions (e.g., '$characterId: Int!')
 * @returns {Object} { queryString, variables }
 */
export function buildBatchQuery(config) {
    const {
        items,
        buildField,
        buildVariables,
        wrapperPath,
        baseVariables = {},
        baseDefinitions = ''
    } = config;

    let queryFields = '';
    let variableDefinitions = baseDefinitions;
    const variables = { ...baseVariables };

    items.forEach((item, index) => {
        const alias = `item${index}`;

        // Build field for this item
        queryFields += buildField(item, index, alias);

        // Build variables for this item
        const { definitions, values } = buildVariables(item, index);
        if (definitions) {
            variableDefinitions += variableDefinitions ? `, ${definitions}` : definitions;
        }
        Object.assign(variables, values);
    });

    const queryString = `
        query(${variableDefinitions}) {
            ${wrapperPath} {
                ${queryFields}
            }
        }
    `;

    return { queryString, variables };
}

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
