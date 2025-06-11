import { Logger } from '@nestjs/common';
import { request, RequestOptions } from 'node:https';

export default class GithubApi {
  private static readonly baseUrl: string = 'https://api.github.com';
  private static readonly userAgent: string = 'CEFETCodeLab-SchedulerApi';
  private static logger: Logger;

  static {
    this.logger = new Logger(GithubApi.name);
  }

  static async put(path: string, body: string) {
    return new Promise((resolve, reject) => {
      this.logger.debug(`Post data: ${body}`);

      const options: RequestOptions = {
        hostname: this.baseUrl.replace('https://', ''),
        path: path,
        method: 'PUT',
        headers: {
          authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          accept: 'application/vnd.github.v3+json',
          'user-agent': this.userAgent,
          'content-type': 'application/json',
          'content-length': Buffer.byteLength(body),
        },
      };

      const req = request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        this.logger.log(
          `Data from post request to create file in remote ${data}`,
        );

        res.on('end', () => {
          if (res.statusCode === 200 || res.statusCode === 201) {
            resolve(data);
          }
          if (res.statusCode === 422) {
            this.logger.error(
              `Received 422 status code from Github API: ${data}`,
            );
            reject(new Error('Unprocessable Entity'));
          }
        });
      });

      req.on('error', (error) => {
        this.logger.error(`Error in request: ${error.message}`);
        reject(error);
      });
      req.write(body);
      req.end();
    });
  }

  static async get(path?: string) {
    return new Promise((resolve, reject) => {
      const getRequest = request(
        {
          hostname: this.baseUrl.replace('https://', ''),
          path: path?.trim(),
          port: 443,
          headers: {
            authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
            accept: 'application/vnd.github+json',
            'X-Github-Api-Version': '2022-11-28',
            'user-agent': this.userAgent,
          },
          method: 'GET',
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });

          res.on('end', () => {
            if (res.statusCode === 200) {
              const response = JSON.parse(data);
              this.logger.log(
                `Response from GitHub: ${JSON.stringify(response)}`,
              );
              resolve(JSON.parse(data));
            }
            if (res.statusCode === 404) {
              this.logger.error(`Github API returned 404 for path: ${path}`);
              reject(new Error('Not Found'));
            }
            reject(new Error(`Github Api error: ${res.statusCode} - ${data}`));
          });
        },
      );
      getRequest.on('error', (error) => {
        this.logger.error(`Error in GET request: ${error.message}`);
        reject(error);
      });
      getRequest.end();
    });
  }
}
