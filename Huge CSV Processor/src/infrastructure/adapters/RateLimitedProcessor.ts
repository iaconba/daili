import {Transform} from 'stream';
import {ExternalApiPort, Record} from "../../domain/ports";

const RATE_LIMIT_PER_SEC = 50;
const BATCH_SIZE = RATE_LIMIT_PER_SEC;

export class RateLimitedProcessor extends Transform {
    private count = 0;
    private startTime = Date.now();
    private activePromises: Promise<any>[] = [];
    private maxRetries: number;
    private api: ExternalApiPort;

    constructor(api: ExternalApiPort, maxRetries: number = 2) {
        super({objectMode: true});
        this.api = api;
        this.maxRetries = maxRetries;
    }

    private async callRemoteApiWithRetry(row: Record, retries: number): Promise<any> {
        try {
            return await this.api.enrich(row);
        } catch (err: any) {
            if (retries > 0) {
                console.warn(`[RETRY] Tentativo fallito per record: ${row.id}. Retries rimasti: ${retries - 1}`);
                return this.callRemoteApiWithRetry(row, retries - 1);
            }
            throw err;
        }
    }

    async _transform(row: Record, encoding: string, callback: Function) {
        this.count++;

        const promise = this.callRemoteApiWithRetry(row, this.maxRetries)
            .then((result) => {
                console.log(`[OK] Record processato:`, JSON.stringify(result));
                this.push(result);
            })
            .catch((err) => {
                console.error(`[ERR] Errore definitivo dopo retries:`, err.message);
            });

        this.activePromises.push(promise);

        if (this.activePromises.length >= BATCH_SIZE) {
            await Promise.all(this.activePromises);
            this.activePromises = [];

            const elapsedTime = Date.now() - this.startTime;
            if (elapsedTime < 1000) {
                await new Promise((resolve) => setTimeout(resolve, 1000 - elapsedTime));
            }

            this.startTime = Date.now();
            console.log(`Processate ${this.count} righe... RAM: ${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB`);
        }

        callback();
    }

    async _flush(callback: Function) {
        if (this.activePromises.length > 0) {
            await Promise.all(this.activePromises);
        }
        callback();
    }
}
