// 백그라운드 오디오 플레이어 - Offscreen API 사용
const OFFSCREEN_DOCUMENT_PATH = '/offscreen.html';
// let audioPlayer = new Audio(); // 기존 Audio 객체 제거

let currentGameType = '';
let currentChannelIndex = -1;
let currentStation = null;
let isPlaying = false; // 이 상태는 이제 Offscreen 문서로부터 업데이트됨

// 스트림 데이터
let streamData = { ats: [], ets2: [] };

// --- Offscreen 문서 관리 함수 ---
let creatingOffscreenDocument = null; // 생성 중복 방지

// Offscreen 문서가 있는지 확인
async function hasOffscreenDocument() {
  // @ts-ignore
  if (typeof chrome.offscreen === 'undefined') {
    console.error('Offscreen API is not available.');
    return false;
  }
  // @ts-ignore
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH)]
  });
  return existingContexts.length > 0;
}

// Offscreen 문서 설정 (없으면 생성)
async function setupOffscreenDocument() {
  if (await hasOffscreenDocument()) {
    console.log('Offscreen document already exists.');
    return;
  }

  // 생성 중이면 대기
  if (creatingOffscreenDocument) {
    await creatingOffscreenDocument;
  } else {
    console.log('Creating offscreen document...');
    // @ts-ignore
    creatingOffscreenDocument = chrome.offscreen.createDocument({
      url: OFFSCREEN_DOCUMENT_PATH,
      reasons: ['AUDIO_PLAYBACK'], // @ts-ignore
      justification: 'Audio playback requires an offscreen document in Manifest V3',
    });
    await creatingOffscreenDocument;
    creatingOffscreenDocument = null;
    console.log('Offscreen document created.');
  }
}

// Offscreen 문서로 메시지 전송
async function sendMessageToOffscreen(action, data) {
  await setupOffscreenDocument(); // 메시지 보내기 전에 문서가 준비되었는지 확인/생성
  try {
    // @ts-ignore
    const response = await chrome.runtime.sendMessage({
      target: 'offscreen',
      action: action,
      data: data
    });
    if (response && !response.success) {
      console.error(`Offscreen action '${action}' failed:`, response.error);
    }
    return response;
  } catch (error) {
      console.error(`Error sending message to offscreen document for action '${action}':`, error);
      // 특정 에러(예: 수신자 없음) 시 Offscreen 문서 재생성 시도 등 추가 처리 가능
      if (error.message.includes('Could not establish connection')) {
          console.log('Connection lost, attempting to recreate offscreen document.');
          // 기존 문서 닫고 다시 생성 시도 (필요 시)
          // await closeOffscreenDocument(); // closeOffscreenDocument 구현 필요
          await setupOffscreenDocument(); // 재시도 로직 추가 가능
      }
      return { success: false, error: error.message };
  }
}


// --- 기존 로직 수정 ---

// 초기화
async function initialize() {
  try {
    // Offscreen 문서 설정 (초기 로드 시에도 필요할 수 있음)
    await setupOffscreenDocument(); 
    
    // 데이터 로드
    await loadData();
    
    // 마지막 상태 복원
    await restoreLastState();
  } catch (error) {
    console.error('Background initialization error:', error);
  }
}

// 데이터 로드 (변경 없음)
async function loadData() {
  try {
    const atsResponse = await fetch('data/ATS_live_streams.json');
    const atsRawData = await atsResponse.text();
    const atsStreams = parseStreamData(atsRawData);
    
    const ets2Response = await fetch('data/ETS2_live_streams.json');
    const ets2RawData = await ets2Response.text();
    const ets2Streams = parseStreamData(ets2RawData);
    
    streamData = {
      ats: atsStreams,
      ets2: ets2Streams
    };
  } catch (error) {
    console.error('Error loading data:', error);
    streamData = { ats: [], ets2: [] };
  }
}

// 라디오 스트리밍 데이터 파싱 함수 (변경 없음)
function parseStreamData(rawData) {
  const lines = rawData.split('\n');
  const streamData = [];
  let totalStreams = 0;
  
  for (const line of lines) {
    if (line.includes('stream_data:')) {
      const match = line.match(/stream_data:\s*(\d+)/);
      if (match && match[1]) {
        totalStreams = parseInt(match[1]);
        break;
      }
    }
  }
  
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

// 마지막 상태 복원
async function restoreLastState() {
  try {
    currentGameType = await loadLastGameType();
    currentChannelIndex = await loadLastChannel(currentGameType);
    
    if (streamData[currentGameType] && streamData[currentGameType][currentChannelIndex]) {
      currentStation = streamData[currentGameType][currentChannelIndex];
      // Offscreen 문서에 마지막 소스 설정 (재생은 하지 않음)
      // await sendMessageToOffscreen('setSource', { source: currentStation.url });
      // --> 초기화 시 소스 설정은 play 시점에 하는 것이 더 안전할 수 있음. 필요 시 주석 해제.
    }
    
    const volume = await loadVolume();
    if (volume !== null) {
      // Offscreen 문서에 볼륨 설정
      await sendMessageToOffscreen('setVolume', { volume: volume });
    }
  } catch (error) {
    console.error('Error restoring state:', error);
  }
}

// 마지막 선택한 게임 타입 로드 (변경 없음)
async function loadLastGameType() {
  return new Promise((resolve) => {
    // @ts-ignore
    chrome.storage.local.get(['last_game_type'], (result) => {
      resolve(result.last_game_type || 'ats');
    });
  });
}

// 마지막 선택한 채널 로드 (변경 없음)
async function loadLastChannel(gameType) {
  return new Promise((resolve) => {
    const key = `${gameType}_last_channel`;
    // @ts-ignore
    chrome.storage.local.get([key], (result) => {
      resolve(result[key] !== undefined ? result[key] : 0);
    });
  });
}

// 볼륨 로드 (변경 없음)
async function loadVolume() {
  return new Promise((resolve) => {
    // @ts-ignore
    chrome.storage.local.get(['volume'], (result) => {
      resolve(result.volume !== undefined ? result.volume : 0.7);
    });
  });
}

// 볼륨 저장 (변경 없음)
function saveVolume(volume) {
  // @ts-ignore
  chrome.storage.local.set({ volume: volume });
}

// 채널 변경
async function changeChannel(gameType, channelIndex, station) {
  const wasPlayingBeforeChange = isPlaying; // 변경 전 재생 상태 저장

  currentGameType = gameType;
  currentChannelIndex = channelIndex;
  currentStation = station;

  // Offscreen 문서에 오디오 소스 변경 요청
  await sendMessageToOffscreen('setSource', { source: station.url });

  // 로컬 저장소에 마지막 채널 저장
  const key = `${gameType}_last_channel`;
  // @ts-ignore
  chrome.storage.local.set({ [key]: channelIndex, last_game_type: gameType });

  // 만약 채널 변경 전에 재생 중이었다면, 새 채널을 재생하도록 명시적 요청
  if (wasPlayingBeforeChange) {
    // `play` 함수를 호출하거나 직접 play 메시지를 보낼 수 있음
    // 여기서는 play 함수를 재사용하여 일관성 유지
    await play(gameType, channelIndex, station); 
    // 또는: await sendMessageToOffscreen('play', { source: station.url }); 
  } else {
     // 재생 중이 아니었다면 isPlaying 상태를 false로 유지 (필요 시 명시적 업데이트)
     // isPlaying = false; // playbackStateChanged 메시지로 업데이트되므로 보통 불필요
  }
}


// 재생
async function play(gameType, channelIndex, station) {
  // 채널 정보가 현재 상태와 다르면 업데이트 (선택사항, changeChannel에서 이미 처리됨)
  if (currentGameType !== gameType || currentChannelIndex !== channelIndex || currentStation?.url !== station.url) {
      currentGameType = gameType;
      currentChannelIndex = channelIndex;
      currentStation = station;
      // 로컬 저장소에 마지막 채널 저장도 여기서 하는 것이 안전할 수 있음
      const key = `${gameType}_last_channel`;
      // @ts-ignore
      chrome.storage.local.set({ [key]: channelIndex, last_game_type: gameType });
  }


  // Offscreen 문서에 재생 요청 (소스 정보 포함)
  await sendMessageToOffscreen('play', { source: station.url });
  
  // isPlaying 상태는 offscreen으로부터 playbackStateChanged 메시지를 통해 업데이트됨
}

// 일시정지
async function pause() {
  // Offscreen 문서에 일시정지 요청
  await sendMessageToOffscreen('pause');
  // isPlaying 상태는 offscreen으로부터 playbackStateChanged 메시지를 통해 업데이트됨
}

// 메시지 리스너 설정
// @ts-ignore
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Offscreen 문서로부터 오는 상태 업데이트 처리
  if (message.action === 'playbackStateChanged') {
    isPlaying = message.data.isPlaying;
    console.log('Playback state updated from offscreen:', isPlaying);
    if (message.data.error) {
        console.error('Offscreen playback error:', message.data.error);
        // 여기서 팝업 UI에 에러 상태를 알리는 로직 추가 가능
    }
    // 필요하다면 팝업이나 다른 곳으로 상태 전파
    // chrome.runtime.sendMessage({ action: 'updatePopupState', data: { isPlaying, ... } });
    sendResponse({ success: true }); // 응답 보내기
    return; // 상태 업데이트 메시지는 여기서 처리 종료
  }
  
  // 팝업 등 다른 곳에서 오는 요청 처리
  switch (message.action) {
    case 'getPlaybackState':
      sendResponse({
        isPlaying: isPlaying,
        gameType: currentGameType,
        channelIndex: currentChannelIndex,
        station: currentStation
      });
      break;
      
    case 'changeChannel':
      changeChannel(message.gameType, message.channelIndex, message.station)
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // 비동기 응답
      
    case 'play':
      play(message.gameType, message.channelIndex, message.station)
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // 비동기 응답
      
    case 'pause':
      pause()
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // 비동기 응답
      
    case 'setVolume':
      // Offscreen 문서에 볼륨 설정 요청
      sendMessageToOffscreen('setVolume', { volume: message.volume })
        .then((response) => {
            if (response?.success) {
                saveVolume(message.volume); // 성공 시에만 저장
            }
            sendResponse(response);
        })
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // 비동기 응답
  }
  
  // 동기 응답이거나 처리되지 않은 메시지의 경우
  // return false; // 또는 아무것도 반환하지 않음
});


// 오디오 이벤트 리스너 제거 (Offscreen 문서에서 처리 후 메시지로 전달받음)
// audioPlayer.addEventListener('play', () => { ... });
// audioPlayer.addEventListener('pause', () => { ... });
// audioPlayer.addEventListener('error', () => { ... });

// 초기화 실행
initialize();