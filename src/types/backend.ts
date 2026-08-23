/**
 * Types for the coupled_modelling Flask API responses.
 * TODO: refine/generate these from the OpenAPI spec (backend repo, plan task 0.5).
 */

export type HealthResponse = {
    status: 'ok' | 'error';
    graphdb: string;
    repository: string;
    error?: string;
};

// Loose placeholder types until the OpenAPI spec is the source of truth.
export type ClassHierarchyMetadata = Record<string, unknown>;
export type ClassInstanceSummary = Record<string, unknown>;
export type ClassMetadata = Record<string, unknown>;
export type InstancePropertyMetadata = Record<string, unknown>;
