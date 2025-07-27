import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConsumerService } from '../kafka/consumer.service';
import { SCHEDULING_CREATE_JOB_TOPIC } from './constants';
import { SchedulingService } from './scheduling.service';

@Injectable()
export class SchedulingCreateJobConsumer implements OnModuleInit {
  private readonly logger = new Logger();

  constructor(
    private readonly schedulingService: SchedulingService,
    private readonly consumerService: ConsumerService,
  ) {}

  async onModuleInit() {
    await this.consumerService.consume({
      topic: { topics: [SCHEDULING_CREATE_JOB_TOPIC] },
      config: { groupId: 'scheduling-create-job-group' },
      onMessage: async (message) => {
        this.logger.log({
          value: message.value?.toString(),
        });

        const createSchedulingMessage: CreateSchedulingJobMessage = JSON.parse(
          message.value?.toString() || '{}',
        );
        if (
          !createSchedulingMessage.attemptId ||
          !createSchedulingMessage.applicationFileContent
        ) {
          this.logger.error('Invalid message received', message);
          return;
        }

        try {
          await this.schedulingService.ProcessJobAndWait(
            createSchedulingMessage,
          );
        } catch (err) {
          this.logger.error(
            `Error processing job for attempt ${createSchedulingMessage.attemptId}`,
            err,
          );
        }
      },
    });
  }
}
