import { OnApplicationShutdown } from "@nestjs/common";
import { IConsumer } from "./interfaces/consumer.interface";
import { ConfigService } from "@nestjs/config";
import { ConsumerConfig, ConsumerSubscribeTopics, KafkaMessage } from "kafkajs";
import { KafkajsConsumer } from "./kafkajs.consumer";

interface KafkajsConsumerOptions {
    topic: ConsumerSubscribeTopics;
    config: ConsumerConfig;
    onMessage: (message: KafkaMessage) => Promise<void>;
}

export class ConsumerService implements OnApplicationShutdown {
    private readonly consumers: IConsumer[] = [];

    constructor(
        private readonly configService: ConfigService,
    ) {}

    async consume({ topic, config, onMessage }: KafkajsConsumerOptions) {
        const consumer = new KafkajsConsumer(
            topic,
            config,
            process.env.KAFKA_BROKER! 
        );
        await consumer.connect();
        await consumer.consume(onMessage);
        this.consumers.push(consumer);
    }

    async onApplicationShutdown() {
        for (const consumer of this.consumers) {
            await consumer.disconnect();
        }
    }
}