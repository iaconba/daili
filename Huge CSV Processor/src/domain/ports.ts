export interface Record {
    id: string;
    [key: string]: any;
}

export interface EnrichedRecord extends Record {
    enriched: boolean;
    timestamp: number;
}

export interface ExternalApiPort {
    enrich(record: Record): Promise<EnrichedRecord>;
}

export interface OutputPort {
    save(record: EnrichedRecord): Promise<void>;
    close(): Promise<void>;
}
