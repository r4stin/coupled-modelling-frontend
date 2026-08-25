/**
 * Property choices offered by the explorer's creation forms, curated to the
 * coupled-simulation ontology vocabulary.
 */
import { ValueTypeId } from '@/lib/literalParsing';

export type PropertyOption = { id: string; label: string };

/** Properties offered when appending a value to an existing instance. */
export const VALUE_PROPERTY_OPTIONS: PropertyOption[] = [
    { id: 'label', label: 'label (Label)' },
    { id: 'name', label: 'name (Name)' },
    { id: 'echo_level', label: 'echo_level' },
    { id: 'start_time', label: 'start_time' },
    { id: 'end_time', label: 'end_time' },
    { id: 'dimension', label: 'dimension' },
    { id: 'parallel_type', label: 'parallel_type' },
    { id: 'print_colors', label: 'print_colors' },
    { id: 'use_initial_configuration', label: 'use_initial_configuration' },
    { id: 'abs_tolerance', label: 'abs_tolerance' },
    { id: 'rel_tolerance', label: 'rel_tolerance' },
    { id: 'variable_name', label: 'variable_name' },
    { id: 'location', label: 'location' },
    { id: 'mapper_type', label: 'mapper_type' },
    { id: 'type', label: 'type (Class Type)' },
    { id: 'solver', label: 'solver (link to Solver ID)' },
    { id: 'connect_to', label: 'connect_to (link to Solver ID)' },
    { id: 'from_solver', label: 'from_solver (link to Solver ID)' },
    { id: 'to_solver', label: 'to_solver (link to Solver ID)' },
    { id: 'data_transfer_operator', label: 'data_transfer_operator (link)' },
    { id: 'mapper_settings', label: 'mapper_settings (link)' },
    { id: 'io_settings', label: 'io_settings (link)' },
];

/** Input interpretations for the add-value form. */
export const VALUE_TYPE_OPTIONS: { id: ValueTypeId; label: string }[] = [
    { id: 'string', label: 'String' },
    { id: 'integer', label: 'Integer' },
    { id: 'double', label: 'Double' },
    { id: 'boolean', label: 'Boolean' },
    { id: 'object', label: 'Object ID' },
];

/** Object properties offered when creating a linked child instance. */
export const CHILD_PROPERTY_OPTIONS: PropertyOption[] = [
    { id: 'solver_settings', label: 'solver_settings (Solver settings)' },
    { id: 'coupling_sequence', label: 'coupling_sequence (Coupling loop list)' },
    { id: 'solvers', label: 'solvers (Co-simulation solvers)' },
    { id: 'data_transfer_operators', label: 'data_transfer_operators (Mesh mappers)' },
    { id: 'input_data_list', label: 'input_data_list (Input configuration fields)' },
    { id: 'output_data_list', label: 'output_data_list (Output configuration fields)' },
    { id: 'data', label: 'data (Input/output variables)' },
    { id: 'convergence_accelerators', label: 'convergence_accelerators (Accelerators)' },
    { id: 'convergence_criteria', label: 'convergence_criteria (Criteria)' },
    { id: 'mapper_settings', label: 'mapper_settings (Mapper settings)' },
    { id: 'io_settings', label: 'io_settings (I/O settings)' },
    { id: 'solver_wrapper_settings', label: 'solver_wrapper_settings (Wrapper settings)' },
];
