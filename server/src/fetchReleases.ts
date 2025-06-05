import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export interface Release {
  id: number;
  name: string;
  created_at: string;
  author: {
    login: string;
  };
}

interface RepoConfig {
  owner: string;
  repo: string;
}

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const BASE_URL = 'https://api.github.com';

export async function fetchReleases(config: RepoConfig): Promise<Release[]> {
  const { owner, repo } = config;
  let allReleases: Release[] = [];
  let page = 1;
  const perPage = 100; // GitHub API의 최대 페이지 크기

  while (true) {
    const url = `${BASE_URL}/repos/${owner}/${repo}/releases?page=${page}&per_page=${perPage}`;
    console.log(`Fetching releases for ${owner}/${repo} (page ${page})...`);
    
    try {
      const response = await axios.get(url, {
        headers: {
          ...(GITHUB_TOKEN && { Authorization: `token ${GITHUB_TOKEN}` }),
          Accept: 'application/vnd.github.v3+json',
        },
      });

      const releases = response.data;
      console.log(`Fetched ${releases.length} releases from page ${page}`);
      
      if (releases.length === 0) {
        console.log(`No more releases found for ${owner}/${repo}`);
        break;
      }

      allReleases = allReleases.concat(releases);
      console.log(`Total releases collected so far: ${allReleases.length}`);

      // Link 헤더를 확인하여 다음 페이지가 있는지 확인
      const linkHeader = response.headers.link;
      if (!linkHeader || !linkHeader.includes('rel="next"')) {
        console.log(`No more pages for ${owner}/${repo}`);
        break;
      }

      page++;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        // Rate limit 초과 시 대기
        const resetTime = error.response.headers['x-ratelimit-reset'];
        const currentTime = Math.floor(Date.now() / 1000);
        const waitSeconds = resetTime ? parseInt(resetTime, 10) - currentTime + 5 : 60;
        console.warn(`Rate limit exceeded. Waiting for ${waitSeconds} seconds...`);
        await new Promise(resolve => setTimeout(resolve, waitSeconds * 1000));
        continue;
      }
      console.error(`Error fetching releases for ${owner}/${repo}:`, error);
      return allReleases;
    }
  }

  console.log(`Finished fetching releases for ${owner}/${repo}. Total: ${allReleases.length}`);
  return allReleases;
}

export const REPOS: RepoConfig[] = [
  { owner: 'daangn', repo: 'stackflow' },
  { owner: 'daangn', repo: 'seed-design' },
]; 