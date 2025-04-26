// 전역 변수
let audioPlayer = new Audio();
let currentGameType = 'ats';
let currentView = 'all';
let streamData = { ats: [], ets2: [] };
let currentChannelIndex = 0;
let isPlaying = false;
let favorites = { ats: [], ets2: [] };

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', async () => {
  // 데이터 로드
  streamData = await loadStreamData();
  
  // 마지막 선택한 게임 타입 로드
  currentGameType = await loadLastGameType();
  
  // 마지막 선택한 채널 로드
  currentChannelIndex = await loadLastChannel(currentGameType);
  
  // 즐겨찾기 로드
  favorites.ats = await loadFavorites('ats');
  favorites.ets2 = await loadFavorites('ets2');
  
  // UI 초기화
  initUI();
  
  // 채널 목록 표시
  displayStationList();
  
  // 필터 옵션 초기화
  initFilterOptions();
  
  // 이벤트 리스너 설정
  setupEventListeners();
  
  // 볼륨 설정
  audioPlayer.volume = document.getElementById('volume-slider').value;
  
  // 마지막 채널 선택
  if (streamData[currentGameType].length > 0) {
    selectChannel(currentChannelIndex);
  }
  
  // 백그라운드 스크립트와 통신 설정
  setupBackgroundCommunication();
});

// 백그라운드 스크립트와 통신 설정
function setupBackgroundCommunication() {
  // 백그라운드 스크립트에서 현재 재생 상태 확인
  chrome.runtime.sendMessage({ action: 'getPlaybackState' }, response => {
    if (response && response.isPlaying) {
      // 백그라운드에서 재생 중인 경우 UI 업데이트
      currentGameType = response.gameType;
      currentChannelIndex = response.channelIndex;
      isPlaying = true;
      
      // UI 업데이트
      document.getElementById('play-btn').textContent = 'Pause';
      
      // 탭 활성화
      document.getElementById('ats-tab').classList.toggle('active', currentGameType === 'ats');
      document.getElementById('ets2-tab').classList.toggle('active', currentGameType === 'ets2');
      
      // 채널 정보 업데이트
      if (streamData[currentGameType] && streamData[currentGameType][currentChannelIndex]) {
        const station = streamData[currentGameType][currentChannelIndex];
        document.getElementById('current-station').textContent = station.name;
        document.getElementById('station-genre').textContent = `${station.genre} | ${station.language} | ${station.bitrate}kbps`;
      }
    }
  });
}

// UI 초기화
function initUI() {
  // 탭 활성화
  document.getElementById('ats-tab').classList.toggle('active', currentGameType === 'ats');
  document.getElementById('ets2-tab').classList.toggle('active', currentGameType === 'ets2');
  
  // 뷰 버튼 활성화
  document.getElementById('all-stations-btn').classList.add('active');
  document.getElementById('favorites-btn').classList.remove('active');
}

// 필터 옵션 초기화
function initFilterOptions() {
  const genreFilter = document.getElementById('genre-filter');
  const languageFilter = document.getElementById('language-filter');
  
  // 장르 및 언어 목록 추출
  const genres = new Set();
  const languages = new Set();
  
  streamData[currentGameType].forEach(station => {
    genres.add(station.genre);
    languages.add(station.language);
  });
  
  // 장르 옵션 추가
  genreFilter.innerHTML = '<option value="">All genres</option>';
  [...genres].sort().forEach(genre => {
    const option = document.createElement('option');
    option.value = genre;
    option.textContent = genre;
    genreFilter.appendChild(option);
  });
  
  // 언어 옵션 추가
  languageFilter.innerHTML = '<option value="">All languages</option>';
  [...languages].sort().forEach(language => {
    const option = document.createElement('option');
    option.value = language;
    option.textContent = language;
    languageFilter.appendChild(option);
  });
}

// 이벤트 리스너 설정
function setupEventListeners() {
  // 탭 전환
  document.getElementById('ats-tab').addEventListener('click', () => switchGameType('ats'));
  document.getElementById('ets2-tab').addEventListener('click', () => switchGameType('ets2'));
  
  // 뷰 전환
  document.getElementById('all-stations-btn').addEventListener('click', () => switchView('all'));
  document.getElementById('favorites-btn').addEventListener('click', () => switchView('favorites'));
  
  // 재생 컨트롤
  document.getElementById('play-btn').addEventListener('click', togglePlayPause);
  document.getElementById('prev-btn').addEventListener('click', playPrevChannel);
  document.getElementById('next-btn').addEventListener('click', playNextChannel);
  
  // 볼륨 조절
  document.getElementById('volume-slider').addEventListener('input', (e) => {
    const volume = e.target.value;
    // 백그라운드 오디오 볼륨도 업데이트
    chrome.runtime.sendMessage({ 
      action: 'setVolume', 
      volume: volume 
    });
  });
  
  // 검색 및 필터
  document.getElementById('search-input').addEventListener('input', displayStationList);
  document.getElementById('genre-filter').addEventListener('change', displayStationList);
  document.getElementById('language-filter').addEventListener('change', displayStationList);
  
  // 오디오 이벤트
  audioPlayer.addEventListener('play', () => {
    document.getElementById('play-btn').textContent = 'Pause';
    isPlaying = true;
  });
  
  audioPlayer.addEventListener('pause', () => {
    document.getElementById('play-btn').textContent = 'Play';
    isPlaying = false;
  });
  
  audioPlayer.addEventListener('error', () => {
    console.error('오디오 재생 오류:', audioPlayer.error);
    document.getElementById('play-btn').textContent = 'Play';
    isPlaying = false;
  });
}

// 게임 타입 전환
function switchGameType(gameType) {
  if (currentGameType === gameType) return;
  
  currentGameType = gameType;
  saveLastGameType(gameType);
  
  // 탭 활성화
  document.getElementById('ats-tab').classList.toggle('active', gameType === 'ats');
  document.getElementById('ets2-tab').classList.toggle('active', gameType === 'ets2');
  
  // 필터 옵션 초기화
  initFilterOptions();
  
  // 채널 목록 갱신
  displayStationList();
  
  // 마지막 채널 로드
  loadLastChannel(gameType).then(index => {
    currentChannelIndex = index;
    if (streamData[gameType].length > 0) {
      selectChannel(currentChannelIndex);
    }
  });
}

// 뷰 전환 (모든 채널/즐겨찾기)
function switchView(view) {
  if (currentView === view) return;
  
  currentView = view;
  
  // 버튼 활성화
  document.getElementById('all-stations-btn').classList.toggle('active', view === 'all');
  document.getElementById('favorites-btn').classList.toggle('active', view === 'favorites');
  
  // 채널 목록 갱신
  displayStationList();
}

// 채널 목록 표시
function displayStationList() {
  const stationList = document.getElementById('station-list');
  const searchInput = document.getElementById('search-input').value.toLowerCase();
  const genreFilter = document.getElementById('genre-filter').value;
  const languageFilter = document.getElementById('language-filter').value;
  
  // 목록 초기화
  stationList.innerHTML = '';
  
  // 필터링된 채널 목록
  let filteredStations = streamData[currentGameType].filter(station => {
    // 검색어 필터
    if (searchInput && !station.name.toLowerCase().includes(searchInput)) {
      return false;
    }
    
    // 장르 필터
    if (genreFilter && station.genre !== genreFilter) {
      return false;
    }
    
    // 언어 필터
    if (languageFilter && station.language !== languageFilter) {
      return false;
    }
    
    // 즐겨찾기 필터
    if (currentView === 'favorites' && !isFavorite(station)) {
      return false;
    }
    
    return true;
  });
  
  // 채널 목록이 비어있는 경우
  if (filteredStations.length === 0) {
    const emptyItem = document.createElement('li');
    emptyItem.className = 'station-item';
    emptyItem.textContent = currentView === 'favorites' ? 'No favorite channels' : 'No search results';
    stationList.appendChild(emptyItem);
    return;
  }
  
  // 채널 목록 생성
  filteredStations.forEach((station, index) => {
    const originalIndex = streamData[currentGameType].indexOf(station);
    const stationItem = document.createElement('li');
    stationItem.className = 'station-item';
    if (originalIndex === currentChannelIndex) {
      stationItem.classList.add('active');
    }
    
    const stationInfo = document.createElement('div');
    
    const stationName = document.createElement('div');
    stationName.className = 'station-name';
    stationName.textContent = station.name;
    
    const stationMeta = document.createElement('div');
    stationMeta.className = 'station-meta';
    stationMeta.textContent = `${station.genre} | ${station.language} | ${station.bitrate}kbps`;
    
    stationInfo.appendChild(stationName);
    stationInfo.appendChild(stationMeta);
    
    const favoriteBtn = document.createElement('button');
    favoriteBtn.className = 'favorite-btn';
    favoriteBtn.textContent = isFavorite(station) ? '★' : '☆';
    favoriteBtn.classList.toggle('active', isFavorite(station));
    
    favoriteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFavorite(originalIndex);
      favoriteBtn.textContent = isFavorite(station) ? '★' : '☆';
      favoriteBtn.classList.toggle('active', isFavorite(station));
    });
    
    stationItem.appendChild(stationInfo);
    stationItem.appendChild(favoriteBtn);
    
    stationItem.addEventListener('click', () => {
      selectChannel(originalIndex);
    });
    
    stationList.appendChild(stationItem);
  });
}

// 채널 선택
function selectChannel(index) {
  if (index < 0 || index >= streamData[currentGameType].length) return;
  
  currentChannelIndex = index;
  saveLastChannel(currentGameType, index);
  
  const station = streamData[currentGameType][index];
  
  // UI 업데이트
  document.getElementById('current-station').textContent = station.name;
  document.getElementById('station-genre').textContent = `${station.genre} | ${station.language} | ${station.bitrate}kbps`;
  
  // 채널 목록 업데이트
  const stationItems = document.querySelectorAll('.station-item');
  stationItems.forEach(item => item.classList.remove('active'));
  
  // 현재 채널이 목록에 표시되어 있는지 확인
  const visibleStationItems = Array.from(stationItems);
  const currentStationIndex = streamData[currentGameType].indexOf(station);
  
  const currentStationItem = visibleStationItems.find((item, i) => {
    const stationName = item.querySelector('.station-name')?.textContent;
    return stationName === station.name;
  });
  
  if (currentStationItem) {
    currentStationItem.classList.add('active');
    currentStationItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  
  // 백그라운드 스크립트에 채널 변경 알림
  chrome.runtime.sendMessage({
    action: 'changeChannel',
    gameType: currentGameType,
    channelIndex: index,
    station: station
  });
}

// 재생/일시정지 토글
function togglePlayPause() {
  if (!isPlaying) {
    // 백그라운드 스크립트에 재생 요청
    chrome.runtime.sendMessage({
      action: 'play',
      gameType: currentGameType,
      channelIndex: currentChannelIndex,
      station: streamData[currentGameType][currentChannelIndex]
    });
  } else {
    // 백그라운드 스크립트에 일시정지 요청
    chrome.runtime.sendMessage({ action: 'pause' });
  }
}

// 이전 채널 재생
function playPrevChannel() {
  let newIndex = currentChannelIndex - 1;
  if (newIndex < 0) {
    newIndex = streamData[currentGameType].length - 1;
  }
  selectChannel(newIndex);
}

// 다음 채널 재생
function playNextChannel() {
  let newIndex = currentChannelIndex + 1;
  if (newIndex >= streamData[currentGameType].length) {
    newIndex = 0;
  }
  selectChannel(newIndex);
}

// 즐겨찾기 여부 확인
function isFavorite(station) {
  return favorites[currentGameType].includes(streamData[currentGameType].indexOf(station));
}

// 즐겨찾기 토글
function toggleFavorite(index) {
  const favoriteIndex = favorites[currentGameType].indexOf(index);
  
  if (favoriteIndex === -1) {
    favorites[currentGameType].push(index);
  } else {
    favorites[currentGameType].splice(favoriteIndex, 1);
  }
  
  saveFavorites(currentGameType, favorites[currentGameType]);
  
  // 즐겨찾기 뷰에서 토글한 경우 목록 갱신
  if (currentView === 'favorites') {
    displayStationList();
  }
}
