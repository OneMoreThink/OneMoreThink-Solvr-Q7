export interface ReleaseData {
  Repository: string;
  TagName: string;
  PublishedAtKST: string;
  AuthorLogin: string;
  IsPreRelease: boolean;
  IsDraft: boolean;
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
  monthly: Array<{
    date: string;
    count: number;
  }>;
  cumulative: Array<{
    date: string;
    count: number;
  }>;
}

export interface TopAuthor {
  author: string;
  count: number;
  avgDays: number;
}

export interface DashboardData {
  stats: ReleaseStats;
  releaseTrend: ReleaseTrend;
  topAuthors: TopAuthor[];
  repositories: string[];
} 