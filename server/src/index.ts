import { fetchReleases, REPOS } from './fetchReleases';
import { analyzeReleases } from './analyzeReleases';
import { generateCSV } from './generateCSV';
import path from 'path';

async function main() {
  try {
    const allStats = [];

    for (const repo of REPOS) {
      console.log(`Fetching releases for ${repo.owner}/${repo.repo}...`);
      const releases = await fetchReleases(repo);
      const stats = analyzeReleases(releases, repo.repo);
      allStats.push(...stats);
    }

    const outputPath = path.join(__dirname, '../data/release_stats.csv');
    await generateCSV(allStats, outputPath);
    
    console.log('Analysis complete!');
  } catch (error) {
    console.error('Error in main process:', error);
    process.exit(1);
  }
}

main();
