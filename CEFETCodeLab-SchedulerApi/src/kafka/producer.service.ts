import { Injectable, OnApplicationShutdown } from "@nestjs/common";
import { IProducer } from "./interfaces/producer.interface";
import { ConfigService } from "@nestjs/config";
import { Message } from "kafkajs";
import { KafkajsProducer } from "./kafkajs.producer";

@Injectable()
export class ProducerService implements OnApplicationShutdown {
    private readonly producers = new Map<string, IProducer>();

    constructor(
        private readonly configService: ConfigService
    ) {}
    
    private async getProducer(topic: string) {
        const producer = this.producers.get(topic);
        if (!producer) {
            const newProducer = new KafkajsProducer(
                topic,
                this.configService.getOrThrow('KAFKA_BROKER')
            )
            await newProducer.connect();
            this.producers.set(topic, newProducer);
            return newProducer;
        }
        return producer;
    }

    async produce(topic: string, message: Message) {
        const producer = await this.getProducer(topic);
        await producer.produce(message);
    }

    async onApplicationShutdown(signal?: string) {
        for (const [_, producer] of this.producers) {
            await producer.disconnect();
        } 
    }
}