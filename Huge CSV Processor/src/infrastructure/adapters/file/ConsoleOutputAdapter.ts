import {EnrichedRecord, OutputPort} from "../../../domain/ports";

export class ConsoleOutputAdapter implements OutputPort {
    async save(record: EnrichedRecord): Promise<void> {
        return Promise.resolve();
    }

    async close(): Promise<void> {
        return Promise.resolve();
    }
}
