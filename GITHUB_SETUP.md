# GitHub 저장소 설정 가이드

이 가이드는 TruckSim Radio 크롬 확장프로그램을 GitHub 저장소에 추가하는 방법을 설명합니다.

## 1. 새 GitHub 저장소 생성하기

1. GitHub 계정에 로그인합니다.
2. 우측 상단의 '+' 버튼을 클릭하고 'New repository'를 선택합니다.
3. 저장소 이름을 'Trucker_Tunes_Chrome_Extension'으로 입력합니다.
4. 설명(Description)에 "유로트럭2/아메리칸 트럭 시뮬레이터 라디오 스트리밍을 위한 크롬 확장프로그램"을 입력합니다.
5. 저장소를 Public으로 설정합니다.
6. 'Initialize this repository with a README' 옵션을 체크 해제합니다.
7. 'Create repository' 버튼을 클릭합니다.

## 2. 로컬 저장소 설정하기

1. 터미널(또는 명령 프롬프트)을 엽니다.
2. 다음 명령어를 실행하여 로컬 저장소를 초기화합니다:

```bash
# 확장프로그램 폴더로 이동
cd path/to/trucker_tunes_extension

# Git 저장소 초기화
git init

# 모든 파일 추가
git add .

# 첫 번째 커밋 생성
git commit -m "Initial commit: Chrome extension for TruckSim Radio"
```

## 3. GitHub 저장소에 연결하기

1. 다음 명령어를 실행하여 원격 저장소를 추가합니다 (YOUR_USERNAME을 GitHub 사용자명으로 변경):

```bash
git remote add origin https://github.com/YOUR_USERNAME/Trucker_Tunes_Chrome_Extension.git
```

2. 로컬 저장소를 GitHub에 푸시합니다:

```bash
git push -u origin master
```

## 4. GitHub Pages 설정 (선택 사항)

확장프로그램 소개 페이지를 GitHub Pages로 호스팅하려면:

1. 저장소 설정(Settings)으로 이동합니다.
2. 좌측 메뉴에서 'Pages'를 클릭합니다.
3. Source 섹션에서 'master' 브랜치를 선택합니다.
4. 'Save' 버튼을 클릭합니다.

## 5. 릴리스 생성하기

1. 저장소 페이지에서 'Releases' 섹션으로 이동합니다.
2. 'Create a new release' 버튼을 클릭합니다.
3. 태그 버전을 'v1.0.0'으로 입력합니다.
4. 릴리스 제목을 'TruckSim Radio Chrome Extension v1.0.0'으로 입력합니다.
5. 설명에 주요 기능을 나열합니다.
6. 'trucker_tunes_extension.zip' 파일을 업로드합니다.
7. 'Publish release' 버튼을 클릭합니다.

## 6. README 업데이트하기

1. 저장소의 README.md 파일을 편집합니다.
2. 설치 링크와 스크린샷을 추가합니다.
3. 변경사항을 커밋하고 푸시합니다:

```bash
git add README.md
git commit -m "Update README with installation links and screenshots"
git push
```

이제 TruckSim Radio 크롬 확장프로그램이 GitHub 저장소에 성공적으로 설정되었습니다!
