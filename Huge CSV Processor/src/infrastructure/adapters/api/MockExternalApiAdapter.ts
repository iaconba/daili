import {EnrichedRecord, ExternalApiPort, Record} from "../../../domain/ports";

const EXTERNAL_API_LATENCY_MS = 100;

export class MockExternalApiAdapter implements ExternalApiPort {
    async enrich(record: Record): Promise<EnrichedRecord> {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Simula un fallimento nel 10% dei casi
                if (Math.random() < 0.1) {
                    reject(new Error(`Errore simulato per record: ${record.id || JSON.stringify(record)}`));
                } else {
                    resolve({ ...record, enriched: true, timestamp: Date.now() });
                }
            }, EXTERNAL_API_LATENCY_MS);
        });
    }
}
