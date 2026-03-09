import * as fs from 'fs';
import arg from 'arg';
import {ProcessCsvUseCase} from "./src/application/ProcessCsvUseCase";
import {MockExternalApiAdapter} from "./src/infrastructure/adapters/api/MockExternalApiAdapter";
import {FileOutputAdapter} from "./src/infrastructure/adapters/file/FileOutputAdapter";
import {ConsoleOutputAdapter} from "./src/infrastructure/adapters/file/ConsoleOutputAdapter";
import {RateLimitedProcessor} from "./src/infrastructure/adapters/RateLimitedProcessor";

async function run() {
    const args = arg({
        '--input': String,
        '--output': String,
    });

    const INPUT_FILE = args['--input'];
    const OUTPUT_FILE = args['--output'];

    if (!INPUT_FILE) {
        console.error('Errore: Il parametro --input è obbligatorio.');
        process.exit(1);
    }

    if (!fs.existsSync(INPUT_FILE)) {
        console.error(`Errore: Il file ${INPUT_FILE} non esiste.`);
        process.exit(1);
    }

    console.log(`Inizio processamento CSV: ${INPUT_FILE}...`);

    const apiAdapter = new MockExternalApiAdapter();
    const processor = new RateLimitedProcessor(apiAdapter);
    
    const outputAdapter = OUTPUT_FILE 
        ? new FileOutputAdapter(OUTPUT_FILE) 
        : new ConsoleOutputAdapter();

    const useCase = new ProcessCsvUseCase(processor, outputAdapter);

    try {
        await useCase.execute(INPUT_FILE);
        console.log('Processamento completato con successo.');
    } catch (err: any) {
        console.error('Errore durante il processamento:', err.message);
    }
}

run().catch(console.error);
