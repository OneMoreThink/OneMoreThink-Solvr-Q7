import { useState, useEffect } from 'react';
import { Container, Box, Paper, Typography, Card, CardContent, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import type { DashboardData } from '../types/release';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
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
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRepository, setSelectedRepository] = useState<string>('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/dashboard?repository=${selectedRepository}`);
        const dashboardData = await response.json();
        setData(dashboardData);
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedRepository]);

  if (loading || !data) {
    return <Typography>로딩 중...</Typography>;
  }

  // 요일별 릴리즈 분포
  const weekdayData = {
    labels: ['월요일', '화요일', '수요일', '목요일', '금요일'],
    datasets: [
      {
        label: '요일별 릴리즈 수',
        data: ['월요일', '화요일', '수요일', '목요일', '금요일'].map(day => 
          data.stats.releasesByWeekday[day] || 0
        ),
        backgroundColor: '#36A2EB',
      },
    ],
  };

  // 업무 시간대별 릴리즈 분포
  const hourData = {
    labels: Object.keys(data.stats.releasesByHour),
    datasets: [
      {
        label: '업무 시간대별 릴리즈 분포',
        data: Object.values(data.stats.releasesByHour),
        backgroundColor: '#FFCE56',
      },
    ],
  };

  // 월별 릴리즈 추이
  const trendData = {
    labels: data.releaseTrend.monthly.map((item) => item.date),
    datasets: [
      {
        label: '월별 릴리즈 수',
        data: data.releaseTrend.monthly.map((item) => item.count),
        borderColor: '#4BC0C0',
        tension: 0.1,
      },
      {
        label: '누적 릴리즈 수',
        data: data.releaseTrend.cumulative.map((item) => item.count),
        borderColor: '#FF6384',
        tension: 0.1,
      },
    ],
  };

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
            {data.repositories.map((repo) => (
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
              {data.stats.totalReleases}
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
              {data.stats.preReleaseCount}
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
              {data.stats.draftCount}
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
            • 프리릴리즈: {data.stats.preReleaseCount}개
            <br />
            • 드래프트: {data.stats.draftCount}개
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
}

export default App;
