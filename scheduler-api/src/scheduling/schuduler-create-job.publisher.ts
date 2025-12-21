import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { CreateSchedulingJobMessageDto } from './dto/create-scheduling-job-message.dto';
import { ClientKafka } from '@nestjs/microservices/client/client-kafka';
import { SCHEDULER_CREATE_JOB } from './constants';

@Injectable()
export class SchedulerCreateJobPublisher implements OnModuleInit {
  constructor(
    @Inject('KAFKA_CLIENT') private readonly kafkaClient: ClientKafka,
  ) {}

  async onModuleInit() {
    this.kafkaClient.subscribeToResponseOf(SCHEDULER_CREATE_JOB);
    await this.kafkaClient.connect();
  }

  publish(message: CreateSchedulingJobMessageDto) {
    this.kafkaClient.emit(SCHEDULER_CREATE_JOB, message);
  }
}
