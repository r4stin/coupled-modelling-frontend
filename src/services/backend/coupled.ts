import { longRunningBackendApi } from '@/services/backend/api';
import { InstanceId, KratosParameters } from '@/types/backend';

export const importCoupledKratos = (data: KratosParameters, label: string) =>
    longRunningBackendApi.post('import_coupled_kratos/', { json: { data, label } }).json<InstanceId>();

export const exportCoupledKratos = (coupledSystem: string) =>
    longRunningBackendApi.post('export_coupled_kratos/', { json: { coupled_system: coupledSystem } }).json<KratosParameters>();
