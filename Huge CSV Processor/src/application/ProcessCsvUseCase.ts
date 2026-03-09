import * as fs from 'fs';
import {parse} from 'csv-parse';
import {pipeline} from 'stream/promises';
import {OutputPort} from "../domain/ports";
import {RateLimitedProcessor} from "../infrastructure/adapters/RateLimitedProcessor";

export class ProcessCsvUseCase {
    private processor: RateLimitedProcessor;
    private outputPort: OutputPort;

    constructor(processor: RateLimitedProcessor, outputPort: OutputPort) {
        this.processor = processor;
        this.outputPort = outputPort;
    }

    async execute(inputPath: string): Promise<void> {
        const reader = fs.createReadStream(inputPath);
        const parser = parse({columns: true, skip_empty_lines: true});

        reader.on('error', (err) => console.error(`[FATAL-READ] Errore critico nel file di input: ${err.message}`));
        parser.on('error', (err) => console.error(`[FATAL-PARSE] Errore di parsing nel CSV: ${err.message}`));

        try {
            await pipeline(
                reader,
                parser,
                this.processor,
                async (source: AsyncIterable<any>) => {
                    for await (const record of source) {
                        try {
                            if (record) {
                                await this.outputPort.save(record);
                            }
                        } catch (saveErr: any) {
                            console.error(`[ERR-SAVE] Errore durante il salvataggio del record:`, saveErr.message);
                        }
                    }
                }
            );
        } catch (pipelineErr: any) {
            console.error(`[ERR-PIPELINE] Errore nella pipeline di processamento:`, pipelineErr.message);
        } finally {
            try {
                await this.outputPort.close();
            } catch (closeErr: any) {
                console.error(`[ERR-CLOSE] Errore durante la chiusura dell'output port:`, closeErr.message);
            }
        }
    }
}
