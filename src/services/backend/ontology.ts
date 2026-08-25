import { longRunningBackendApi } from '@/services/backend/api';

/** Fetches the ontology serialised as RDF/XML; the caller saves the blob as a file. */
export const downloadOwl = () => longRunningBackendApi.get('download_owl/').blob();
