import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as tar from 'tar-stream';
import { gzipSync } from 'zlib';
import { finished } from 'stream/promises';

import {
  DEFAULT_ARTIFACT_BUCKET,
  DEFAULT_ARTIFACT_EXPIRES_SECONDS,
} from './artifacts.constants';
import { ArtifactFile } from './artifact-builder';

type ArtifactsConfig = {
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  expiresSeconds: number;
  forcePathStyle: boolean;
};

@Injectable()
export class ArtifactsService {
  private readonly cfg: ArtifactsConfig;
  private readonly s3: S3Client;

  constructor(private readonly configService: ConfigService) {
    this.cfg = {
      endpoint:
        this.configService.get<string>('ARTIFACTS_S3_ENDPOINT') ??
        'http://localhost:9000',
      region:
        this.configService.get<string>('ARTIFACTS_S3_REGION') ?? 'us-east-1',
      accessKeyId:
        this.configService.get<string>('ARTIFACTS_S3_ACCESS_KEY') ?? 'eevee',
      secretAccessKey:
        this.configService.get<string>('ARTIFACTS_S3_SECRET_KEY') ??
        'eevee-secret',
      bucket:
        this.configService.get<string>('ARTIFACTS_S3_BUCKET') ??
        DEFAULT_ARTIFACT_BUCKET,
      expiresSeconds: Number(
        this.configService.get<string>('ARTIFACTS_PRESIGN_EXPIRES_SECONDS') ??
          DEFAULT_ARTIFACT_EXPIRES_SECONDS,
      ),
      forcePathStyle:
        (this.configService.get<string>('ARTIFACTS_S3_FORCE_PATH_STYLE') ??
          'true') === 'true',
    };

    this.s3 = new S3Client({
      region: this.cfg.region,
      endpoint: this.cfg.endpoint,
      forcePathStyle: this.cfg.forcePathStyle,
      credentials: {
        accessKeyId: this.cfg.accessKeyId,
        secretAccessKey: this.cfg.secretAccessKey,
      },
    });
  }

  private async buildTarGz(files: ArtifactFile[]): Promise<Buffer> {
    const pack = tar.pack();

    for (const file of files) {
      const name = file.path.replace(/^\//, '');
      pack.entry({ name }, file.content);
    }

    pack.finalize();

    const chunks: Buffer[] = [];
    pack.on('data', (c) =>
      chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)),
    );

    await finished(pack);

    const tarBuffer = Buffer.concat(chunks);
    return gzipSync(tarBuffer);
  }

  async uploadArtifactAndPresignUrl(params: {
    key: string;
    files: ArtifactFile[];
  }): Promise<{ key: string; url: string }> {
    const body = await this.buildTarGz(params.files);

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.cfg.bucket,
        Key: params.key,
        Body: body,
        ContentType: 'application/gzip',
      }),
    );

    const url = await getSignedUrl(
      this.s3,
      new GetObjectCommand({
        Bucket: this.cfg.bucket,
        Key: params.key,
      }),
      { expiresIn: this.cfg.expiresSeconds },
    );

    return { key: params.key, url };
  }
}
