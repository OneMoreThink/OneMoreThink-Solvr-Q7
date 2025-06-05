import { useState, useEffect } from 'react';
import { Container, Box, Paper, Typography, Card, CardContent, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import Papa from 'papaparse';
import type { ReleaseData } from './types/release';
import { calculateStats, getTopAuthors, getReleaseTrend, getVersionUpgradePattern } from './utils/releaseStats';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
    },
    tooltip: {
      callbacks: {
        label: (context: any) => {
          const label = context.label || '';
          const value = context.raw || 0;
          return `${label}: ${value}개`;
        },
      },
    },
  },
};

function App() {
  const [data, setData] = useState<ReleaseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRepository, setSelectedRepository] = useState<string>('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/release_raw_data.csv');
        const csvText = await response.text();
        Papa.parse(csvText, {
          header: true,
          complete: (results) => {
            setData(results.data as ReleaseData[]);
            setLoading(false);
          },
        });
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <Typography>로딩 중...</Typography>;
  }

  const filteredData = selectedRepository === 'all'
    ? data
    : data.filter(release => release.Repository === selectedRepository);

  const stats = calculateStats(filteredData);
  const topAuthors = getTopAuthors(filteredData);
  const releaseTrend = getReleaseTrend(filteredData);
  const versionPattern = getVersionUpgradePattern(filteredData);

  // 요일별 평균 릴리즈 수
  const weekdayData = {
    labels: ['월요일', '화요일', '수요일', '목요일', '금요일'],
    datasets: [
      {
        label: '요일별 릴리즈 수',
        data: ['월요일', '화요일', '수요일', '목요일', '금요일'].map(day => 
          stats.releasesByWeekday[day] || 0
        ),
        backgroundColor: '#36A2EB',
      },
    ],
  };

  // 업무 시간대별 릴리즈 분포
  const hourData = {
    labels: Object.keys(stats.releasesByHour),
    datasets: [
      {
        label: '업무 시간대별 릴리즈 분포',
        data: Object.values(stats.releasesByHour),
        backgroundColor: '#FFCE56',
      },
    ],
  };

  // 월별 릴리즈 추이
  const trendData = {
    labels: releaseTrend.monthly.map((item) => item.date),
    datasets: [
      {
        label: '월별 릴리즈 수',
        data: releaseTrend.monthly.map((item) => item.count),
        borderColor: '#4BC0C0',
        tension: 0.1,
      },
      {
        label: '누적 릴리즈 수',
        data: releaseTrend.cumulative.map((item) => item.count),
        borderColor: '#FF6384',
        tension: 0.1,
      },
    ],
  };

  // 버전 업그레이드 패턴
  const versionData = {
    labels: versionPattern.map((item) => item.type),
    datasets: [
      {
        label: '평균 업그레이드 주기 (일)',
        data: versionPattern.map((item) => item.avgDays),
        backgroundColor: '#9966FF',
      },
    ],
  };

  // 기여자별 릴리즈 정보
  const authorData = {
    labels: topAuthors.map((author) => author.author),
    datasets: [
      {
        label: '평균 릴리즈 주기 (일)',
        data: topAuthors.map((author) => author.avgDays),
        backgroundColor: '#FF6384',
      },
    ],
  };

  const repositories = Array.from(new Set(data.map(release => release.Repository)));

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          GitHub 릴리즈 대시보드
        </Typography>
      </Box>

      {/* 필터 */}
      <Box sx={{ mb: 4 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>리포지토리</InputLabel>
          <Select
            value={selectedRepository}
            label="리포지토리"
            onChange={(e) => setSelectedRepository(e.target.value)}
          >
            <MenuItem value="all">모든 리포지토리</MenuItem>
            {repositories.map((repo) => (
              <MenuItem key={repo} value={repo}>
                {repo}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* 핵심 지표 스코어카드 */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3, mb: 4 }}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              평일 릴리즈 수
            </Typography>
            <Typography variant="h4">
              {stats.totalReleases}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              평일 동안의 총 릴리즈 수입니다.
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              프리릴리즈 수
            </Typography>
            <Typography variant="h4">
              {stats.preReleaseCount}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              테스트나 검증을 위한 프리릴리즈의 수입니다.
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              드래프트 수
            </Typography>
            <Typography variant="h4">
              {stats.draftCount}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              아직 공개되지 않은 드래프트 릴리즈의 수입니다.
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* 차트 섹션 */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 3 }}>
        {/* 요일별 릴리즈 분포 */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            요일별 릴리즈 분포
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            평일 중 요일별 릴리즈의 비율을 보여줍니다.
            특정 요일에 릴리즈가 집중되어 있다면, 정기적인 배포 일정이 있을 수 있습니다.
          </Typography>
          <Box sx={{ height: 300 }}>
            <Bar data={weekdayData} options={chartOptions} />
          </Box>
        </Paper>

        {/* 업무 시간대별 릴리즈 분포 */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            업무 시간대별 릴리즈 분포
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            업무 시간대별 릴리즈 분포를 보여줍니다.
            정기적인 배포 시간이 있다면 특정 시간대에 릴리즈가 집중될 수 있습니다.
          </Typography>
          <Box sx={{ height: 300 }}>
            <Bar data={hourData} options={chartOptions} />
          </Box>
        </Paper>

        {/* 월별 릴리즈 추이 */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            월별 릴리즈 추이
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            월별 릴리즈 수와 누적 릴리즈 수를 보여줍니다.
            릴리즈 주기의 변화와 전체적인 성장 추이를 파악할 수 있습니다.
          </Typography>
          <Box sx={{ height: 300 }}>
            <Line data={trendData} options={chartOptions} />
          </Box>
        </Paper>

        {/* 부가 정보 */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            부가 정보
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            • 주말 릴리즈는 모든 통계에서 제외되었습니다.
            <br />
            • 프리릴리즈: {stats.preReleaseCount}개
            <br />
            • 드래프트: {stats.draftCount}개
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
}

export default App;
