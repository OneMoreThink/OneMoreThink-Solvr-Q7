import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import type { Release } from './fetchReleases';

dayjs.extend(weekOfYear);

export interface ReleaseStats {
  repo: string;
  stat_type: 'yearly' | 'monthly' | 'weekly' | 'daily' | 'day_of_week' | 'hour_of_day';
  period: string;
  value: number;
}

export function analyzeReleases(releases: Release[], repoName: string): ReleaseStats[] {
  const stats: ReleaseStats[] = [];
  const yearlyStats: { [key: string]: number } = {};
  const monthlyStats: { [key: string]: number } = {};
  const weeklyStats: { [key: string]: number } = {};
  const dailyStats: { [key: string]: number } = {};
  const dayOfWeekStats: { [key: string]: number } = {};
  const hourOfDayStats: { [key: string]: number } = {};

  releases.forEach((release) => {
    const date = dayjs(release.created_at);
    
    // 연간 통계
    const year = date.format('YYYY');
    yearlyStats[year] = (yearlyStats[year] || 0) + 1;
    
    // 월간 통계
    const month = date.format('YYYY-MM');
    monthlyStats[month] = (monthlyStats[month] || 0) + 1;
    
    // 주간 통계 (연도와 주차를 명확히 구분)
    const week = `${date.format('YYYY')}-W${date.week().toString().padStart(2, '0')}`;
    weeklyStats[week] = (weeklyStats[week] || 0) + 1;
    
    // 일간 통계
    const day = date.format('YYYY-MM-DD');
    dailyStats[day] = (dailyStats[day] || 0) + 1;
    
    // 요일별 통계
    const dayOfWeek = date.format('dddd'); // Monday, Tuesday, etc.
    dayOfWeekStats[dayOfWeek] = (dayOfWeekStats[dayOfWeek] || 0) + 1;
    
    // 시간대별 통계
    const hour = date.format('HH');
    hourOfDayStats[hour] = (hourOfDayStats[hour] || 0) + 1;
  });

  // 연간 통계 추가
  Object.entries(yearlyStats).forEach(([year, count]) => {
    stats.push({
      repo: repoName,
      stat_type: 'yearly',
      period: year,
      value: count,
    });
  });

  // 월간 통계 추가
  Object.entries(monthlyStats).forEach(([month, count]) => {
    stats.push({
      repo: repoName,
      stat_type: 'monthly',
      period: month,
      value: count,
    });
  });

  // 주간 통계 추가
  Object.entries(weeklyStats).forEach(([week, count]) => {
    stats.push({
      repo: repoName,
      stat_type: 'weekly',
      period: week,
      value: count,
    });
  });

  // 일간 통계 추가
  Object.entries(dailyStats).forEach(([day, count]) => {
    stats.push({
      repo: repoName,
      stat_type: 'daily',
      period: day,
      value: count,
    });
  });

  // 요일별 통계 추가
  Object.entries(dayOfWeekStats).forEach(([dayOfWeek, count]) => {
    stats.push({
      repo: repoName,
      stat_type: 'day_of_week',
      period: dayOfWeek,
      value: count,
    });
  });

  // 시간대별 통계 추가
  Object.entries(hourOfDayStats).forEach(([hour, count]) => {
    stats.push({
      repo: repoName,
      stat_type: 'hour_of_day',
      period: hour,
      value: count,
    });
  });

  // 통계 유형별로 정렬
  return stats.sort((a, b) => {
    if (a.stat_type !== b.stat_type) {
      const typeOrder = {
        yearly: 0,
        monthly: 1,
        weekly: 2,
        daily: 3,
        day_of_week: 4,
        hour_of_day: 5,
      };
      return typeOrder[a.stat_type] - typeOrder[b.stat_type];
    }
    return a.period.localeCompare(b.period);
  });
} 