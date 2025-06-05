import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import type { Release } from './fetchReleases';

dayjs.extend(weekOfYear);

export interface ReleaseStats {
  repo: string;
  stat_type: 'yearly' | 'monthly' | 'weekly' | 'daily' | 'day_of_week' | 'hour_of_day' | 'workday_yearly' | 'workday_monthly' | 'workday_weekly';
  period: string;
  value: number;
}

// 주말 여부를 확인하는 함수
function isWeekend(date: dayjs.Dayjs): boolean {
  const day = date.day();
  return day === 0 || day === 6; // 0: 일요일, 6: 토요일
}

export function analyzeReleases(releases: Release[], repoName: string): ReleaseStats[] {
  const stats: ReleaseStats[] = [];
  const yearlyStats: { [key: string]: number } = {};
  const monthlyStats: { [key: string]: number } = {};
  const weeklyStats: { [key: string]: number } = {};
  const dailyStats: { [key: string]: number } = {};
  const dayOfWeekStats: { [key: string]: number } = {};
  const hourOfDayStats: { [key: string]: number } = {};
  
  // 근무일 기준 통계
  const workdayYearlyStats: { [key: string]: number } = {};
  const workdayMonthlyStats: { [key: string]: number } = {};
  const workdayWeeklyStats: { [key: string]: number } = {};

  releases.forEach((release) => {
    const date = dayjs(release.created_at);
    const isWeekendDay = isWeekend(date);
    
    // 연간 통계
    const year = date.format('YYYY');
    yearlyStats[year] = (yearlyStats[year] || 0) + 1;
    if (!isWeekendDay) {
      workdayYearlyStats[year] = (workdayYearlyStats[year] || 0) + 1;
    }
    
    // 월간 통계
    const month = date.format('YYYY-MM');
    monthlyStats[month] = (monthlyStats[month] || 0) + 1;
    if (!isWeekendDay) {
      workdayMonthlyStats[month] = (workdayMonthlyStats[month] || 0) + 1;
    }
    
    // 주간 통계
    const week = `${date.format('YYYY')}-W${date.week().toString().padStart(2, '0')}`;
    weeklyStats[week] = (weeklyStats[week] || 0) + 1;
    if (!isWeekendDay) {
      workdayWeeklyStats[week] = (workdayWeeklyStats[week] || 0) + 1;
    }
    
    // 일간 통계
    const day = date.format('YYYY-MM-DD');
    dailyStats[day] = (dailyStats[day] || 0) + 1;
    
    // 요일별 통계
    const dayOfWeek = date.format('dddd');
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

  // 근무일 기준 연간 통계 추가
  Object.entries(workdayYearlyStats).forEach(([year, count]) => {
    stats.push({
      repo: repoName,
      stat_type: 'workday_yearly',
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

  // 근무일 기준 월간 통계 추가
  Object.entries(workdayMonthlyStats).forEach(([month, count]) => {
    stats.push({
      repo: repoName,
      stat_type: 'workday_monthly',
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

  // 근무일 기준 주간 통계 추가
  Object.entries(workdayWeeklyStats).forEach(([week, count]) => {
    stats.push({
      repo: repoName,
      stat_type: 'workday_weekly',
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
        workday_yearly: 1,
        monthly: 2,
        workday_monthly: 3,
        weekly: 4,
        workday_weekly: 5,
        daily: 6,
        day_of_week: 7,
        hour_of_day: 8,
      };
      return typeOrder[a.stat_type] - typeOrder[b.stat_type];
    }
    return a.period.localeCompare(b.period);
  });
} 