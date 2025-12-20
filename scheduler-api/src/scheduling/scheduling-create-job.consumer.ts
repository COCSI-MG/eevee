import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConsumerService } from '../kafka/consumer.service';
import { SCHEDULING_CREATE_JOB_TOPIC } from './constants';
import { SchedulingService } from './scheduling.service';
import { CreateSchedulingDto } from './dto/create-scheduling.dto';
import { CreateSchedulingJobMessageDto } from './dto/create-scheduling-job-message.dto';

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
        const { key, value } = message;
        if (!key || !value) {
          throw new Error('Invalid message to create job');
        }

        this.logger.log({
          key: key.toString(),
          value: value.toString(),
        });

        const valueJsonParsed: CreateSchedulingJobMessageDto = JSON.parse(
          value.toString(),
        );

        try {
          await this.schedulingService.ProcessJobAndWait(
            parseInt(key.toString()),
            valueJsonParsed,
          );
        } catch (err) {
          this.logger.error(
            `Error processing job for attempt ${key.toString()}`,
            err,
          );
        }
      },
    });
  }
}
