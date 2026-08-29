/**
 * Types for the coupled_modelling Flask API responses.
 *
 * Aliases over the types generated from the backend's OpenAPI spec
 * (coupled_modelling/openapi.yaml). Regenerate with `npm run generate:api-types`
 * after the spec changes — do not edit src/types/openapi.ts by hand.
 */
import type { components, operations } from '@/types/openapi';

export type ApiError = components['schemas']['Error'];
export type ScalarValue = components['schemas']['ScalarValue'];

export type HealthResponse = components['schemas']['HealthOk'] | components['schemas']['HealthError'];

export type ClassHierarchyEntry = components['schemas']['ClassHierarchyEntry'];
export type ClassHierarchyMetadata = ClassHierarchyEntry[];

export type ClassInstanceSummary = components['schemas']['InstanceSummary'];
export type PreviewItem = components['schemas']['PreviewItem'];

export type ClassMetadata = components['schemas']['ClassMetadata'];
export type Restriction = components['schemas']['Restriction'];
export type NamedReference = components['schemas']['NamedReference'];

export type InstancePropertyMetadata = components['schemas']['InstanceMetadata'];
export type InstancePropertyGroup = components['schemas']['InstancePropertyGroup'];
export type ObjectPropertyValue = components['schemas']['ObjectPropertyValue'];
export type LiteralPropertyValue = components['schemas']['LiteralPropertyValue'];

export type DeleteValueTarget = components['schemas']['ObjectValueTarget'] | components['schemas']['LiteralValueTarget'];

export type InstanceId = components['schemas']['InstanceId'];
export type PropertyDataMap = components['schemas']['PropertyDataMap'];
export type KratosParameters = components['schemas']['KratosParameters'];

export type SearchResults = components['schemas']['SearchResults'];
export type SearchClassResult = components['schemas']['SearchClassResult'];
export type SearchType = NonNullable<NonNullable<operations['searchEntities']['parameters']['query']>['type']>;
