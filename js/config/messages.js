/**
 * Centralized UI messages for localization and consistency
 */

export const MESSAGES = {
    // Search related
    SEARCH: {
        ENTER_CHARACTER_NAME: '캐릭터명을 입력해주세요.',
        INVALID_CHARACTER_NAME: '올바른 캐릭터명을 입력해주세요.',
        CHARACTER_NOT_FOUND: (name, server) => `캐릭터를 찾을 수 없습니다: ${name} @ ${server}`,
        SELECT_SERVER: (name) => `<strong>${name}</strong> 캐릭터를 검색할 서버를 선택해주세요.`,
        SELECT_OTHER_SERVER: (name, server) => `<strong>${name}@${server}</strong> 캐릭터를 찾을 수 없습니다.<br>다른 서버를 선택해주세요.`,
        NO_RAID_RECORDS: (name, server) => `<strong>${name}@${server}</strong> 캐릭터의 레이드 기록을 찾을 수 없습니다.<br>다른 서버를 선택해주세요.`,
        SEARCH_ERROR: '검색 중 오류가 발생했습니다.',
        SEARCH_CANCELLED: '검색이 취소되었습니다.'
    },

    // Settings related
    SETTINGS: {
        MISSING_CREDENTIALS: 'Client ID와 Client Secret을 입력해주세요.',
        SAVED: '설정이 저장되었습니다.',
        COMPLETE_API_SETTINGS: '먼저 FFLogs API 설정을 완료해주세요.'
    },

    // Raid selection related
    RAID_SELECTION: {
        SAVED: (count) => `${count}개의 레이드가 선택되었습니다.`
    },

    // Export related
    EXPORT: {
        NO_RESULTS: '내보낼 결과가 없습니다.',
        ELEMENT_NOT_FOUND: '캡처할 요소를 찾을 수 없습니다.',
        TABLE_NOT_FOUND: '테이블을 찾을 수 없습니다.',
        SAVE_ERROR: '이미지 저장 중 오류가 발생했습니다.'
    },

    // General
    GENERAL: {
        COPY_FAILED: '복사에 실패했습니다.',
        CONFIRM_CANCEL_SEARCH: '검색을 취소하시겠습니까?'
    }
};
