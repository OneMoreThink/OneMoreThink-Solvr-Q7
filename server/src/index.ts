import express from 'express';
import cors from 'cors';
import { parse } from 'csv-parse/sync';
import fs from 'fs';
import path from 'path';
import type { ReleaseData, DashboardData } from './types/release';
import { calculateStats, getTopAuthors, getReleaseTrend } from './utils/releaseStats';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// CSV 파일에서 데이터 로드
const loadData = (): ReleaseData[] => {
  const csvPath = path.join(__dirname, '..', 'data', 'release_raw_data.csv');
  const fileContent = fs.readFileSync(csvPath, 'utf-8');
  return parse(fileContent, {
    columns: true,
    skip_empty_lines: true
  });
};

// 데이터를 메모리에 로드
let releaseData: ReleaseData[] = loadData();

// API 엔드포인트
app.get('/api/dashboard', (req, res) => {
  const { repository } = req.query;
  
  // 리포지토리 필터링
  const filteredData = repository && repository !== 'all'
    ? releaseData.filter(release => release.Repository === repository)
    : releaseData;

  // 대시보드 데이터 생성
  const dashboardData: DashboardData = {
    stats: calculateStats(filteredData),
    topAuthors: getTopAuthors(filteredData),
    releaseTrend: getReleaseTrend(filteredData),
    repositories: Array.from(new Set(releaseData.map(release => release.Repository)))
  };

  res.json(dashboardData);
});

// 서버 시작
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
