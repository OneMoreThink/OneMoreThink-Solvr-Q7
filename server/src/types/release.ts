export interface ReleaseData {
  Repository: string;
  TagName: string;
  PublishedAtKST: string;
  AuthorLogin: string;
  IsPreRelease: string;
  IsDraft: string;
}

export interface ReleaseStats {
  totalReleases: number;
  releasesByType: Record<string, number>;
  releasesByWeekday: Record<string, number>;
  releasesByHour: Record<string, number>;
  releasesByMonth: Record<string, number>;
  releasesByAuthor: Record<string, number>;
  preReleaseCount: number;
  draftCount: number;
  weekendReleaseCount: number;
}

export interface ReleaseTrend {
  monthly: { date: string; count: number }[];
  cumulative: { date: string; count: number }[];
}

export interface TopAuthor {
  author: string;
  count: number;
  avgDays: number;
}

export interface DashboardData {
  stats: ReleaseStats;
  topAuthors: TopAuthor[];
  releaseTrend: ReleaseTrend;
  repositories: string[];
} 