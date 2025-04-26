// 라디오 스트리밍 데이터 파싱 함수
function parseStreamData(rawData) {
  const lines = rawData.split('\n');
  const streamData = [];
  let totalStreams = 0;
  
  // 총 스트림 수 찾기
  for (const line of lines) {
    if (line.includes('stream_data:')) {
      const match = line.match(/stream_data:\s*(\d+)/);
      if (match && match[1]) {
        totalStreams = parseInt(match[1]);
        break;
      }
    }
  }
  
  // 각 스트림 데이터 파싱
  for (let i = 0; i < totalStreams; i++) {
    const pattern = new RegExp(`stream_data\\[${i}\\]:\\s*"([^"]+)"`, 'i');
    
    for (const line of lines) {
      const match = line.match(pattern);
      if (match && match[1]) {
        const parts = match[1].split('|');
        if (parts.length >= 5) {
          streamData.push({
            url: parts[0],
            name: parts[1],
            genre: parts[2],
            language: parts[3],
            bitrate: parts[4],
            favorite: parts[5] === '1'
          });
        }
        break;
      }
    }
  }
  
  return streamData;
}

// 데이터 파일 로드 및 처리
async function loadStreamData() {
  try {
    // ATS 데이터 로드
    const atsResponse = await fetch('data/ATS_live_streams.json');
    const atsRawData = await atsResponse.text();
    const atsStreams = parseStreamData(atsRawData);
    
    // ETS2 데이터 로드
    const ets2Response = await fetch('data/ETS2_live_streams.json');
    const ets2RawData = await ets2Response.text();
    const ets2Streams = parseStreamData(ets2RawData);
    
    return {
      ats: atsStreams,
      ets2: ets2Streams
    };
  } catch (error) {
    console.error('데이터 로드 중 오류 발생:', error);
    return { ats: [], ets2: [] };
  }
}

// 즐겨찾기 저장 함수
function saveFavorites(gameType, favorites) {
  const key = `${gameType}_favorites`;
  chrome.storage.local.set({ [key]: favorites });
}

// 즐겨찾기 로드 함수
async function loadFavorites(gameType) {
  return new Promise((resolve) => {
    const key = `${gameType}_favorites`;
    chrome.storage.local.get([key], (result) => {
      resolve(result[key] || []);
    });
  });
}

// 마지막 선택한 채널 저장
function saveLastChannel(gameType, channelIndex) {
  const key = `${gameType}_last_channel`;
  chrome.storage.local.set({ [key]: channelIndex });
}

// 마지막 선택한 채널 로드
async function loadLastChannel(gameType) {
  return new Promise((resolve) => {
    const key = `${gameType}_last_channel`;
    chrome.storage.local.get([key], (result) => {
      resolve(result[key] !== undefined ? result[key] : 0);
    });
  });
}

// 마지막 선택한 게임 타입 저장
function saveLastGameType(gameType) {
  chrome.storage.local.set({ last_game_type: gameType });
}

// 마지막 선택한 게임 타입 로드
async function loadLastGameType() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['last_game_type'], (result) => {
      resolve(result.last_game_type || 'ats');
    });
  });
}
