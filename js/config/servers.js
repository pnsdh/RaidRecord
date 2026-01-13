/**
 * Server list and utilities
 */

// Korean server list
export const KR_SERVERS = [
    { nameKR: '카벙클', nameEN: 'Carbuncle' },
    { nameKR: '모그리', nameEN: 'Moogle' },
    { nameKR: '초코보', nameEN: 'Chocobo' },
    { nameKR: '톤베리', nameEN: 'Tonberry' },
    { nameKR: '펜리르', nameEN: 'Fenrir' }
];

/**
 * Get Korean server name from English name
 */
export function getServerNameKR(serverNameEN) {
    const server = KR_SERVERS.find(s => s.nameEN.toLowerCase() === serverNameEN.toLowerCase());
    return server ? server.nameKR : serverNameEN;
}
