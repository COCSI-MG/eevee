import { Kafka, Message, Producer } from "kafkajs";
import { IProducer } from "./interfaces/producer.interface";
import { Logger } from "@nestjs/common";
import { setTimeout } from "node:timers/promises";

export class KafkajsProducer implements IProducer {
    private readonly kafka: Kafka;
    private readonly producer: Producer;
    private readonly logger: Logger;

    constructor(private readonly topic: string, broker: string) {
        this.kafka = new Kafka({
            clientId: "schedulerapi",
            brokers: [broker]
        });
        this.producer = this.kafka.producer();
        this.logger = new Logger();
    }

    async produce(message: Message) {
        await this.producer.send({
            topic: this.topic,
            messages: [message]
        })
    }

    async connect() {
        try {
            await this.producer.connect();
        } catch (err) {
            this.logger.error('Fail connecting to kafka', err);
            this.logger.warn('Sleep for 5s and trying again');
            await setTimeout(5000, this.logger.warn("Trying to connect to kafka again"));
            await this.connect();
        }
    }

    async disconnect() {
        await this.producer.disconnect();
    }
}