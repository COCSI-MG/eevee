import {
  Consumer,
  ConsumerConfig,
  ConsumerSubscribeTopics,
  Kafka,
  KafkaMessage,
} from 'kafkajs';
import { IConsumer } from './interfaces/consumer.interface';
import { Logger } from '@nestjs/common';
import { setTimeout } from 'node:timers/promises';

export class KafkajsConsumer implements IConsumer {
  private readonly kafka: Kafka;
  private readonly consumer: Consumer;
  private readonly logger = new Logger();

  constructor(
    private readonly topic: ConsumerSubscribeTopics,
    config: ConsumerConfig,
    broker: string,
  ) {
    this.kafka = new Kafka({
      brokers: [broker],
    });
    this.consumer = this.kafka.consumer(config);
  }

  async consume(onMessage: (message: KafkaMessage) => Promise<void>) {
    await this.consumer.subscribe(this.topic);
    await this.consumer.run({
      eachMessage: async ({ message, partition }) => {
        this.logger.debug('Processing message partition', partition);
        try {
          await onMessage(message);
        } catch (err) {
          this.logger.error('Error consuming message', err);
        }
      },
    });
  }

  async connect() {
    try {
      await this.consumer.connect();
    } catch (err) {
      this.logger.error('Fail connecting to kafka', err);
      this.logger.warn('Sleep for 5s and trying again');
      await setTimeout(
        5000,
        this.logger.warn('Trying to connect to kafka again'),
      );
      await this.connect();
    }
  }

  async disconnect() {
    await this.consumer.disconnect();
  }
}
