import { fetchReleases, REPOS } from './fetchReleases';
import { analyzeReleases } from './analyzeReleases';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { stringify } from 'csv-stringify/sync';

async function main() {
  try {
    const allStats: any[] = [];
    const allRawData: any[] = [];

    for (const repo of REPOS) {
      console.log(`\nFetching releases for ${repo.owner}/${repo.repo}...`);
      const releases = await fetchReleases(repo);
      console.log(`Total releases fetched: ${releases.length}`);

      const { stats, rawData } = analyzeReleases(releases, repo.repo);
      allStats.push(...stats);
      allRawData.push(...rawData);
    }

    // 통계 데이터를 CSV로 저장
    const statsCsv = stringify(allStats, {
      header: true,
      columns: {
        repo: 'Repository',
        stat_type: 'Stat Type',
        period: 'Period',
        value: 'Value',
      },
    });

    // 로우 데이터를 CSV로 저장
    const rawDataCsv = stringify(allRawData, {
      header: true,
    });

    const statsPath = join(__dirname, '../data/release_stats.csv');
    const rawDataPath = join(__dirname, '../data/release_raw_data.csv');

    writeFileSync(statsPath, statsCsv);
    writeFileSync(rawDataPath, rawDataCsv);

    console.log(`\nAnalysis complete!`);
    console.log(`Statistics saved to: ${statsPath}`);
    console.log(`Raw data saved to: ${rawDataPath}`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
