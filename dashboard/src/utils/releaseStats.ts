import type { ReleaseData, ReleaseStats } from '../types/release';
import dayjs from 'dayjs';

const WEEKDAYS = ['월요일', '화요일', '수요일', '목요일', '금요일'];
const WORK_HOURS = ['09-10', '10-11', '11-12', '12-13', '13-14', '14-15', '15-16', '16-17', '17-18'] as const;
type WorkHour = typeof WORK_HOURS[number] | '09시 이전' | '18시 이후';

function isWeekend(date: string): boolean {
  const day = dayjs(date).day();
  return day === 0 || day === 6;
}

function getReleaseType(tagName: string): string {
  if (!tagName) return '알 수 없음';
  
  // Scoped package 형식 처리
  if (tagName.includes('@')) {
    const version = tagName.split('@').pop();
    if (!version) return '알 수 없음';
    
    const [major, minor, patch] = version.split('.').map(Number);
    if (isNaN(major)) return '알 수 없음';
    if (isNaN(minor)) return '주요 버전';
    if (isNaN(patch)) return '부 버전';
    return '패치 버전';
  }
  
  // 일반 버전 형식 처리
  const version = tagName.replace(/^v/, '');
  const [major, minor, patch] = version.split('.').map(Number);
  
  if (isNaN(major)) return '알 수 없음';
  if (isNaN(minor)) return '주요 버전';
  if (isNaN(patch)) return '부 버전';
  return '패치 버전';
}

function getWorkHour(hour: number): WorkHour {
  if (hour < 9) return '09시 이전';
  if (hour >= 18) return '18시 이후';
  return WORK_HOURS[Math.floor((hour - 9) / 1)];
}

export function calculateStats(data: ReleaseData[]): ReleaseStats {
  const stats: ReleaseStats = {
    totalReleases: 0,
    releasesByType: {},
    releasesByWeekday: {} as Record<string, number>,
    releasesByHour: {} as Record<WorkHour, number>,
    releasesByMonth: {},
    releasesByAuthor: {},
    preReleaseCount: 0,
    draftCount: 0,
    weekendReleaseCount: 0,
  };

  // 요일별 통계 초기화 (주말 제외)
  WEEKDAYS.forEach(weekday => {
    stats.releasesByWeekday[weekday] = 0;
  });

  // 시간대별 통계 초기화
  WORK_HOURS.forEach(hour => {
    stats.releasesByHour[hour] = 0;
  });
  stats.releasesByHour['09시 이전'] = 0;
  stats.releasesByHour['18시 이후'] = 0;

  // 주말 릴리즈를 제외한 데이터만 처리
  const weekdayReleases = data.filter(release => !isWeekend(release.PublishedAtKST));
  stats.totalReleases = weekdayReleases.length;

  weekdayReleases.forEach((release) => {
    // 릴리즈 타입별 통계
    const releaseType = getReleaseType(release.TagName);
    stats.releasesByType[releaseType] = (stats.releasesByType[releaseType] || 0) + 1;

    // 요일별 통계
    const weekday = dayjs(release.PublishedAtKST).format('dddd');
    const weekdayMap: { [key: string]: string } = {
      'Monday': '월요일',
      'Tuesday': '화요일',
      'Wednesday': '수요일',
      'Thursday': '목요일',
      'Friday': '금요일'
    };
    const koreanWeekday = weekdayMap[weekday] || weekday;
    stats.releasesByWeekday[koreanWeekday] = (stats.releasesByWeekday[koreanWeekday] || 0) + 1;

    // 시간대별 통계
    const hour = dayjs(release.PublishedAtKST).hour();
    const workHour = getWorkHour(hour);
    stats.releasesByHour[workHour] = (stats.releasesByHour[workHour] || 0) + 1;

    // 월별 통계
    const month = dayjs(release.PublishedAtKST).format('YYYY-MM');
    stats.releasesByMonth[month] = (stats.releasesByMonth[month] || 0) + 1;

    // 작성자별 통계
    stats.releasesByAuthor[release.AuthorLogin] = (stats.releasesByAuthor[release.AuthorLogin] || 0) + 1;

    // 프리릴리즈, 드래프트 카운트
    if (release.IsPreRelease === 'TRUE') stats.preReleaseCount++;
    if (release.IsDraft === 'TRUE') stats.draftCount++;
  });

  // 주말 릴리즈 수는 전체 데이터에서 계산
  stats.weekendReleaseCount = data.filter(release => isWeekend(release.PublishedAtKST)).length;

  return stats;
}

export function getTopAuthors(data: ReleaseData[], limit: number = 5): { author: string; count: number; avgDays: number }[] {
  const authorStats: { [key: string]: { count: number; dates: string[] } } = {};
  const weekdayReleases = data.filter(release => !isWeekend(release.PublishedAtKST));
  
  weekdayReleases.forEach((release) => {
    if (!authorStats[release.AuthorLogin]) {
      authorStats[release.AuthorLogin] = { count: 0, dates: [] };
    }
    authorStats[release.AuthorLogin].count++;
    authorStats[release.AuthorLogin].dates.push(release.PublishedAtKST);
  });

  return Object.entries(authorStats)
    .map(([author, stats]) => {
      const dates = stats.dates.map(date => dayjs(date));
      const avgDays = dates.length > 1
        ? dates.reduce((acc, curr, idx, arr) => {
            if (idx === 0) return 0;
            return acc + curr.diff(arr[idx - 1], 'day');
          }, 0) / (dates.length - 1)
        : 0;
      return { author, count: stats.count, avgDays: Math.round(avgDays) };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function getReleaseTrend(data: ReleaseData[]): { 
  monthly: { date: string; count: number }[];
  cumulative: { date: string; count: number }[];
} {
  const monthlyCounts: { [key: string]: number } = {};
  const weekdayReleases = data.filter(release => !isWeekend(release.PublishedAtKST));
  
  weekdayReleases.forEach((release) => {
    const month = dayjs(release.PublishedAtKST).format('YYYY-MM');
    monthlyCounts[month] = (monthlyCounts[month] || 0) + 1;
  });

  const monthly = Object.entries(monthlyCounts)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const cumulative = monthly.reduce((acc, curr) => {
    const lastCount = acc.length > 0 ? acc[acc.length - 1].count : 0;
    acc.push({ date: curr.date, count: lastCount + curr.count });
    return acc;
  }, [] as { date: string; count: number }[]);

  return { monthly, cumulative };
}

export function getVersionUpgradePattern(data: ReleaseData[]): { 
  type: string; 
  count: number; 
  avgDays: number;
}[] {
  const weekdayReleases = data.filter(release => !isWeekend(release.PublishedAtKST))
    .sort((a, b) => dayjs(a.PublishedAtKST).unix() - dayjs(b.PublishedAtKST).unix());

  const patterns: { [key: string]: { count: number; days: number[] } } = {};
  let lastRelease: ReleaseData | null = null;

  weekdayReleases.forEach((release) => {
    const currentType = getReleaseType(release.TagName);
    if (lastRelease) {
      const lastType = getReleaseType(lastRelease.TagName);
      const days = dayjs(release.PublishedAtKST).diff(dayjs(lastRelease.PublishedAtKST), 'day');
      
      if (!patterns[lastType]) {
        patterns[lastType] = { count: 0, days: [] };
      }
      patterns[lastType].count++;
      patterns[lastType].days.push(days);
    }
    lastRelease = release;
  });

  return Object.entries(patterns)
    .map(([type, stats]) => ({
      type,
      count: stats.count,
      avgDays: Math.round(stats.days.reduce((a, b) => a + b, 0) / stats.days.length)
    }))
    .sort((a, b) => b.count - a.count);
} 