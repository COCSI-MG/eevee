import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QueueEvents } from 'bullmq';
import { RealtimeGateway, isSchedulingRealtimeEvent } from './realtime.gateway';

const TRACKED_QUEUES = ['preview-queue'] as const;

@Injectable()
export class RealtimeQueueEventsService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(RealtimeQueueEventsService.name);
  private readonly queueEvents: QueueEvents[] = [];

  constructor(
    private readonly gateway: RealtimeGateway,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    const connection = {
      host: this.configService.get<string>('REDIS_HOST') || 'localhost',
      port: Number(this.configService.get<string>('REDIS_PORT')) || 6379,
    };

    for (const queueName of TRACKED_QUEUES) {
      const queueEvents = new QueueEvents(queueName, { connection });

      queueEvents.on('progress', ({ data }) => {
        if (isSchedulingRealtimeEvent(data)) {
          this.gateway.emitSchedulingEvent(data);
        }
      });

      queueEvents.on('error', (error) => {
        this.logger.error(
          `QueueEvents error on ${queueName}: ${
            error instanceof Error ? error.message : error
          }`,
        );
      });

      this.queueEvents.push(queueEvents);
    }

    this.logger.log(
      `Listening for realtime preview events on: ${TRACKED_QUEUES.join(', ')}`,
    );
  }

  async onModuleDestroy() {
    await Promise.all(this.queueEvents.map((events) => events.close()));
  }
}
