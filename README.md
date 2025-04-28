# TruckSim Radio Chrome Extension

유로트럭2/아메리칸 트럭 시뮬레이터 라디오 스트리밍을 웹에서 들을 수 있는 크롬 확장프로그램입니다.

## 기능

- 아메리칸 트럭 시뮬레이터(ATS)와 유로 트럭 시뮬레이터 2(ETS2)의 라디오 채널 지원
- 게임별 탭 전환 기능
- 채널 검색 및 필터링 (장르, 언어)
- 즐겨찾기 기능
- 마지막 선택한 채널 및 게임 타입 저장

## 설치 방법

### 개발자 모드로 설치하기

1. 이 저장소를 클론하거나 ZIP 파일을 다운로드하여 압축을 풉니다.
2. Chrome 브라우저에서 `chrome://extensions/` 페이지로 이동합니다.
3. 우측 상단의 '개발자 모드'를 활성화합니다.
4. '압축해제된 확장 프로그램을 로드합니다' 버튼을 클릭합니다.
5. 압축을 푼 폴더를 선택합니다.

### Chrome 웹 스토어에 게시하기

1. [Chrome 개발자 대시보드](https://chrome.google.com/webstore/devconsole)에 접속합니다.
2. '새 항목' 버튼을 클릭합니다.
3. ZIP 파일(`trucker_tunes_extension.zip`)을 업로드합니다.
4. 필요한 정보(설명, 스크린샷 등)를 입력합니다.
5. '게시' 버튼을 클릭합니다.

## 아이콘 생성하기

확장프로그램에 필요한 아이콘을 생성하려면:

1. `create_icons.html` 파일을 브라우저에서 엽니다.
2. 각 크기별 아이콘 다운로드 버튼을 클릭하여 이미지를 저장합니다.
3. 저장한 이미지를 `images` 폴더에 넣습니다.

## 개발 정보

- 이 확장프로그램은 [Trucker_Tunes](https://github.com/eddy961206/Trucker_Tunes) 웹 애플리케이션을 기반으로 개발되었습니다.
- 라디오 스트리밍 데이터는 원본 프로젝트의 `public/data` 디렉토리에서 가져왔습니다.

## 프로젝트 구조

```
trucker_tunes_extension/
├── data/
│   ├── ATS_live_streams.json  # 아메리칸 트럭 시뮬레이터 라디오 데이터
│   ├── ETS2_live_streams.json # 유로 트럭 시뮬레이터 2 라디오 데이터
│   └── process_data.js        # 데이터 처리 스크립트
├── images/
│   ├── icon16.png             # 16x16 아이콘
│   ├── icon48.png             # 48x48 아이콘
│   └── icon128.png            # 128x128 아이콘
├── manifest.json              # 확장프로그램 매니페스트
├── popup.html                 # 팝업 HTML
├── popup.js                   # 팝업 JavaScript
└── styles.css                 # 스타일시트
```

## 라이선스

원본 프로젝트와 동일한 라이선스를 따릅니다.
