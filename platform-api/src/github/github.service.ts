import { Injectable } from '@nestjs/common';
import GithubApi from './github.api';

@Injectable()
export default class GithubService {
  async getRepoContents({
    repo,
    owner,
    remoteGithubFilePath,
  }: {
    repo: string;
    owner: string;
    remoteGithubFilePath: string;
  }): Promise<any> {
    const path = `/repos/${owner}/${repo}/contents/${remoteGithubFilePath}`;
    return await GithubApi.get(path);
  }

  async createOrUpdateRepoContents({
    repo,
    owner,
    remoteGithubFilePath,
    contents,
    sha,
  }: {
    repo: string;
    owner: string;
    remoteGithubFilePath: string;
    contents: string;
    sha?: string | undefined; // Optional SHA for updating an existing file
  }) {
    const path = `/repos/${owner}/${repo}/contents/${remoteGithubFilePath}`;
    const payload = {
      message: `${sha ? 'Update' : 'Create'} ${remoteGithubFilePath}`,
      content: Buffer.from(contents).toString('base64'),
      committer: {
        name: 'EEVEE WORKER',
        email: 'cefet-rj.br',
      },
      sha, // If the file exists, we need to provide the sha to update it
    };

    return await GithubApi.put(path, JSON.stringify(payload));
  }
}
