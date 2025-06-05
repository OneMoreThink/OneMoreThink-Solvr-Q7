import { createObjectCsvWriter } from 'csv-writer';
import type { ReleaseStats } from './analyzeReleases';

export async function generateCSV(stats: ReleaseStats[], outputPath: string): Promise<void> {
  const csvWriter = createObjectCsvWriter({
    path: outputPath,
    header: [
      { id: 'repo', title: 'Repository' },
      { id: 'stat_type', title: 'Stat Type' },
      { id: 'period', title: 'Period' },
      { id: 'value', title: 'Value' },
    ],
  });

  try {
    await csvWriter.writeRecords(stats);
    console.log(`CSV file has been written successfully to ${outputPath}`);
  } catch (error) {
    console.error('Error writing CSV file:', error);
    throw error;
  }
} 