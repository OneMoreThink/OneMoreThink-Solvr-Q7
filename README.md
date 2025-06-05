# GitHub Release Dashboard

GitHub 릴리즈 데이터를 시각화하여 릴리즈 패턴과 트렌드를 분석할 수 있는 대시보드입니다.

## 주요 기능

1. **핵심 지표**
   - 평일 릴리즈 수
   - 프리릴리즈 수
   - 드래프트 수

2. **릴리즈 분포**
   - 요일별 릴리즈 분포
   - 업무 시간대별 릴리즈 분포

3. **릴리즈 트렌드**
   - 월별 릴리즈 수
   - 누적 릴리즈 수

## 기술 스택

### 서버
- Node.js
- Express
- TypeScript
- csv-parse

### 클라이언트
- React
- TypeScript
- Material-UI
- Chart.js

## 설치 및 실행

### 서버
```bash
cd server
pnpm install
pnpm build
pnpm start
```

### 클라이언트
```bash
cd dashboard
pnpm install
pnpm dev
```

## 데이터 형식

CSV 파일은 다음 필드를 포함합니다:
- Repository: 리포지토리 이름
- TagName: 릴리즈 태그
- PublishedAtKST: KST 기준 발행 시간
- AuthorLogin: 작성자
- IsPreRelease: 프리릴리즈 여부
- IsDraft: 드래프트 여부

## 주의사항

- 주말 릴리즈는 모든 통계에서 제외됩니다.
- 프리릴리즈와 드래프트는 별도로 집계됩니다.

## 변경 이력

### Task5: Mission Complete!
- 서버와 클라이언트 분리
  - 서버: Express 기반 API 서버 구현
  - 클라이언트: React 기반 대시보드 구현
- 데이터 처리 로직 서버로 이동
- CORS 설정 추가
- CSV 파일 경로 수정
- 불필요한 차트 제거
- 타입 정의 파일 생성
- 리포지토리 필터링 기능 유지

