export interface ReleaseData {
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

export interface ReleaseStats {
  totalReleases: number;
  releasesByType: { [key: string]: number };
  releasesByWeekday: { [key: string]: number };
  releasesByHour: { [key: number]: number };
  releasesByMonth: { [key: string]: number };
  releasesByAuthor: { [key: string]: number };
  preReleaseCount: number;
  draftCount: number;
  weekendReleaseCount: number;
} 