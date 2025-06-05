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

export interface ReleaseRawData {
  Repository: string;
  ReleaseId: number;
  TagName: string;
  ReleaseName: string;
  PublishedAt: string;
  PublishedAtKST: string;
  IsPreRelease: string;
  IsDraft: string;
  AuthorLogin: string;
  AuthorId: number;
  BodySnippet: string;
  AssetsCount: number;
  TotalDownloadCount: number;
  ReleaseUrl: string;
  Weekday: string;
  HourOfDay: number;
  IsWeekend: string;
  MajorVersion: number | null;
  MinorVersion: number | null;
  PatchVersion: number | null;
  ReleaseType: string;
}

// 주말 여부를 확인하는 함수
function isWeekend(date: dayjs.Dayjs): boolean {
  const day = date.day();
  return day === 0 || day === 6; // 0: 일요일, 6: 토요일
}

// 버전 정보를 파싱하는 함수
function parseVersion(tagName: string): { major: number | null; minor: number | null; patch: number | null; type: string } {
  // @scope/package@version 형식 처리
  const scopedPackageMatch = tagName.match(/^@[^/]+\/[^@]+@(\d+)\.(\d+)\.(\d+)$/);
  if (scopedPackageMatch) {
    const [, major, minor, patch] = scopedPackageMatch;
    return {
      major: parseInt(major, 10),
      minor: parseInt(minor, 10),
      patch: parseInt(patch, 10),
      type: 'ScopedPackage',
    };
  }

  // 일반적인 v1.2.3 형식 처리
  const versionMatch = tagName.match(/^v?(\d+)\.(\d+)\.(\d+)$/);
  if (versionMatch) {
    const [, major, minor, patch] = versionMatch;
    const majorNum = parseInt(major, 10);
    const minorNum = parseInt(minor, 10);
    const patchNum = parseInt(patch, 10);

    let type = 'Other';
    if (majorNum > 0) type = 'Major';
    else if (minorNum > 0) type = 'Minor';
    else if (patchNum > 0) type = 'Patch';

    return {
      major: majorNum,
      minor: minorNum,
      patch: patchNum,
      type,
    };
  }

  // 날짜 기반 버전 형식 처리 (예: 20240501.1)
  const dateVersionMatch = tagName.match(/^(\d{8})\.(\d+)$/);
  if (dateVersionMatch) {
    return {
      major: null,
      minor: null,
      patch: null,
      type: 'DateBased',
    };
  }

  // 기타 형식
  return {
    major: null,
    minor: null,
    patch: null,
    type: 'Other',
  };
}

export function analyzeReleases(releases: Release[], repoName: string): { stats: ReleaseStats[]; rawData: ReleaseRawData[] } {
  const stats: ReleaseStats[] = [];
  const rawData: ReleaseRawData[] = [];
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
    const versionInfo = parseVersion(release.tag_name);
    
    // 로우 데이터 생성
    rawData.push({
      Repository: repoName,
      ReleaseId: release.id,
      TagName: release.tag_name,
      ReleaseName: release.name,
      PublishedAt: release.published_at,
      PublishedAtKST: dayjs(release.published_at).add(9, 'hour').format(),
      IsPreRelease: release.prerelease ? 'TRUE' : 'FALSE',
      IsDraft: release.draft ? 'TRUE' : 'FALSE',
      AuthorLogin: release.author.login,
      AuthorId: release.author.id,
      BodySnippet: release.body?.slice(0, 100) || '',
      AssetsCount: release.assets.length,
      TotalDownloadCount: release.assets.reduce((sum, asset) => sum + asset.download_count, 0),
      ReleaseUrl: release.html_url,
      Weekday: date.format('dddd'),
      HourOfDay: date.hour(),
      IsWeekend: isWeekendDay ? 'TRUE' : 'FALSE',
      MajorVersion: versionInfo.major,
      MinorVersion: versionInfo.minor,
      PatchVersion: versionInfo.patch,
      ReleaseType: versionInfo.type,
    });
    
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
  const sortedStats = stats.sort((a, b) => {
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

  return { stats: sortedStats, rawData };
} 