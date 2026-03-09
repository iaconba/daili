# CSV Processor Proof of Concept (PoC)

Questo PoC dimostra come processare 1 file CSV di grandi dimensioni in Node.js/TypeScript rispettando vincoli di memoria e rate limiting.

## Architettura

- **Streaming**: Utilizzo di `fs.createReadStream` e `csv-parse` per leggere il file riga per riga senza caricarlo in memoria.
- **Throttling**: Una classe `RateLimitedProcessor` (estensione di `Transform` stream) raggruppa le richieste in batch da 50 e le esegue ogni secondo, garantendo il limite di 50 req/s supportato dall'API esterna.
- **Backpressure**: Lo stream di Node.js gestisce naturalmente la velocità di lettura in base alla velocità di processamento.

## Requisiti

- Node.js (v22+)
- Docker (opzionale)

## Come eseguire localmente

1. Installare le dipendenze:
   ```bash
   npm install
   ```

2. Generare un file CSV di test:
   ```bash
   npx ts-node generate-csv.ts --output data/logs.csv --rows 10000
   ```

3. Eseguire il processore specificando il file di input e (opzionalmente) il file di output:
   ```bash
   npx ts-node index.ts --input data/logs.csv --output data/enriched.jsonl
   ```

Se il parametro `--output` non viene passato, il file non verrà generato.

### Altri esempi di utilizzo locale

- Solo input (senza generare file di output):
  ```bash
  npx ts-node index.ts --input data/logs.csv
  ```

- Usare un file CSV diverso e specificare l'output:
  ```bash
  npx ts-node index.ts --input data/logs.csv --output data/enriched.jsonl
  ```

L'output processato verrà salvato nel file specificato (se presente).

## Come eseguire con Docker

1. **Build dell'immagine**:
   ```bash
   docker build -t huge-csv-processor .
   ```

2. **Esecuzione:
   ```bash
   docker run huge-csv-processor --input data/logs.csv
   ```

4. **Persistenza dell'output** (montando un volume per salvare i risultati sulla macchina locale):
   ```bash
   docker run -v $(pwd)/data:/usr/src/app/data huge-csv-processor --input data/logs.csv --output data/enriched.jsonl
   ```

5. **Utilizzo di un file locale come input**:
   ```bash
   docker run -v $(pwd)/logs.csv:/usr/src/app/data/logs.csv huge-csv-processor --input data/logs.csv
   ```

### Note tecniche su Docker
L'immagine è configurata con:
- **ENTRYPOINT**: `["node", "dist/index.js"]` - Il comando principale del container.

### Perché questo stack tecnologico?
- **Node.js**: Ideale per operazioni di I/O intensive come la lettura di file e le chiamate API asincrone grazie al suo modello non bloccante.
- **TypeScript**: Aggiunge tipizzazione statica, riducendo bug a runtime e migliorando la manutenibilità del codice attraverso interfacce e tipi chiari.
- **Streams**: L'uso dei Node.js Streams è fondamentale per elaborare file CSV "enormi" (Gigabyte) con un consumo di memoria (RAM) minimo e costante, evitando di caricare l'intero file in memoria.

### Concorrenza e Rate Limiting
La gestione avviene nel componente `RateLimitedProcessor`:
- **Batching**: I record vengono raggruppati in batch da 50 (corrispondenti al limite dell'API).
- **Concorrenza**: All'interno di ogni batch, le 50 richieste vengono eseguite in parallelo per ottimizzare i tempi di risposta (considerando la latenza di rete).
- **Throttling**: Il processore attende che l'intero batch sia completato e, se il tempo trascorso è inferiore a 1 secondo, introduce una pausa (`setTimeout`) per garantire di non superare mai le 50 richieste al secondo verso l'API esterna.

### Ambiente Containerizzato (Dockerfile)
Per lanciare questo codice in un ambiente isolato e riproducibile:
1. Viene creato un `Dockerfile` basato sull'immagine `node:22-slim` per ridurre le dimensioni del container.
2. Viene configurato un `ENTRYPOINT ["node", "dist/index.js"]` che trasforma il container in un eseguibile: tutti i parametri passati a `docker run` vengono inoltrati direttamente allo script.
3. Viene usato `CMD ["--input", "data/logs.csv"]` per fornire un comportamento predefinito se non vengono specificati file.
4. L'uso dei volumi (`-v`) permette di mappare file locali all'interno del container per l'input e l'output.

### Possibili miglioramenti
- **Gestione Interruzioni (Checkpointing)**: Attualmente, se lo script viene interrotto per un fallimento del sistema, non è in grado di riprendere dall'ultimo record processato. Sarebbe necessario implementare un sistema di "stato" o checkpointing (es. salvando l'offset della riga su un database o file di stato) per riprocessare solo i record mancanti senza ricominciare da zero.
- **Rate-limit Condiviso**: Il rate-limit attuale è confinato al singolo processo Node.js. Se venissero avviati più container o processi in parallelo, l'API esterna verrebbe sovraccaricata. Un miglioramento consisterebbe nell'usare un coordinatore esterno (es. Redis) per gestire un rate-limit distribuito e condiviso tra tutte le istanze parallele.

## Risultati Attesi

Il processore mostrerà log periodici indicando il numero di righe processate e il consumo di RAM, che rimarrà costante indipendentemente dalla dimensione del file di input.
Ogni blocco di 50 righe richiederà circa 1 secondo per essere processato a causa del rate limiting combinato con la latenza simulata (100ms per richiesta, eseguite in parallelo per batch).
