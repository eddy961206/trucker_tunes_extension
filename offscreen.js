const audio = new Audio();

// 백그라운드 스크립트로부터 메시지 수신
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.target !== 'offscreen') {
    return; // 다른 메시지는 무시
  }

  switch (message.action) {
    case 'play':
      audio.play();
      // 중복 재생 방지: 같은 URL이 이미 재생 중이면 무시
      const src = message.data?.source;
      if (src) {
        if (!audio.paused && audio.src.endsWith(src)) {
          sendResponse({ success: true });
          return true;
        }
        audio.src = src;
      }
      // 재생 시도 (한 번만)
      audio.play()
        .then(() => sendResponse({ success: true }))
        .catch(err => {
          console.error('Offscreen play failed:', err);
          sendResponse({ success: false, error: err.message });
        });
      return true;
      
    case 'pause':
      audio.pause();
      sendResponse({ success: true });
      break;
      
    case 'setSource':
      if (message.data?.source) {
        audio.src = message.data.source;
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: 'No source provided' });
      }
      break;
      
    case 'setVolume':
      if (message.data?.volume !== undefined) {
        audio.volume = message.data.volume;
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: 'No volume provided' });
      }
      break;
  }
});

// 오디오 상태 변경 시 백그라운드 스크립트로 메시지 전송
function reportPlaybackState() {
  chrome.runtime.sendMessage({
    action: 'playbackStateChanged',
    data: {
      isPlaying: !audio.paused,
      error: audio.error ? audio.error.message : null
    }
  }).catch(error => {
    // 메시지 포트가 닫혔을 수 있음 (백그라운드가 비활성화되었거나)
    // console.warn('Could not send playback state to background:', error);
  });
}

audio.addEventListener('play', reportPlaybackState);
audio.addEventListener('pause', reportPlaybackState);
audio.addEventListener('error', reportPlaybackState);

// 초기 볼륨 설정 (필요하다면 백그라운드에서 초기화 시 값을 받아오도록 확장 가능)
audio.volume = 0.7; // 기본값
