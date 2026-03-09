import * as fs from 'fs';
import {EnrichedRecord, OutputPort} from "../../../domain/ports";

export class FileOutputAdapter implements OutputPort {
    private writer: fs.WriteStream;

    constructor(filePath: string) {
        this.writer = fs.createWriteStream(filePath);
    }

    async save(record: EnrichedRecord): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.writer.write(JSON.stringify(record) + '\n')) {
                this.writer.once('drain', resolve);
            } else {
                process.nextTick(resolve);
            }
        });
    }

    async close(): Promise<void> {
        return new Promise((resolve) => {
            this.writer.end(resolve);
        });
    }
}
