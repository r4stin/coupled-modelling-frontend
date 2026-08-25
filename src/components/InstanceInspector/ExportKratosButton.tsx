'use client';

import { Button, toast } from '@heroui/react';
import { FC, useMemo, useState } from 'react';

import { COUPLED_SYSTEM_CLASS } from '@/constants/properties';
import { getApiErrorMessage } from '@/lib/apiError';
import { buildParentsIndex, isSubclassOf } from '@/lib/classTree';
import { downloadJson } from '@/lib/fileTransfer';
import { useClassHierarchy } from '@/lib/useClassHierarchy';
import { exportCoupledKratos } from '@/services/backend/coupled';

type Props = {
    instanceId: string;
    /** The inspected instance's classes; the button only shows for coupled systems. */
    types: string[];
};

/** Downloads the inspected coupled system as a Kratos CoSimulation JSON file. */
const ExportKratosButton: FC<Props> = ({ instanceId, types }) => {
    const { data: hierarchy } = useClassHierarchy();
    const [isExporting, setIsExporting] = useState(false);

    const isCoupledSystem = useMemo(() => {
        if (hierarchy === undefined) {
            return false;
        }
        const parentsOf = buildParentsIndex(hierarchy);
        return types.some((type) => isSubclassOf(parentsOf, type, COUPLED_SYSTEM_CLASS));
    }, [hierarchy, types]);

    if (!isCoupledSystem) {
        return null;
    }

    const exportJson = async () => {
        setIsExporting(true);
        try {
            const parameters = await exportCoupledKratos(instanceId);
            downloadJson(`${instanceId}_kratos.json`, parameters);
        } catch (exportError) {
            toast.danger(await getApiErrorMessage(exportError, 'Export failed'));
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Button size="sm" variant="ghost" isDisabled={isExporting} onPress={exportJson}>
            {isExporting ? 'Exporting…' : 'Export JSON'}
        </Button>
    );
};

export default ExportKratosButton;
