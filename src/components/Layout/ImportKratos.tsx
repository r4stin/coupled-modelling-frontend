'use client';

import { Button, toast } from '@heroui/react';
import { FC, useRef, useState } from 'react';

import FormDialog from '@/components/FormDialog/FormDialog';
import LabelledInput from '@/components/FormDialog/LabelledInput';
import { getApiErrorMessage } from '@/lib/apiError';
import { readFileText } from '@/lib/fileTransfer';
import { useExplorerRefresh } from '@/lib/useExplorerRefresh';
import { useExplorerSelection } from '@/lib/useExplorerSelection';
import { importCoupledKratos } from '@/services/backend/coupled';
import { KratosParameters } from '@/types/backend';

/** Suggests a configuration label from the picked file's name. */
const labelFromFilename = (filename: string) => filename.replace(/\.json$/i, '').replace(/[_-]/g, ' ');

/** Header action that imports a Kratos CoSimulation JSON file as a new coupled system. */
const ImportKratos: FC = () => {
    const { refreshEverything } = useExplorerRefresh();
    const { selectInstance } = useExplorerSelection();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [label, setLabel] = useState('');
    const [isImporting, setIsImporting] = useState(false);

    const close = () => {
        setPendingFile(null);
        setLabel('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const onFilePicked = (file: File | undefined) => {
        if (file) {
            setPendingFile(file);
            setLabel(labelFromFilename(file.name));
        }
    };

    const importFile = async (file: File) => {
        const trimmed = label.trim();
        if (trimmed === '') {
            toast.warning('Please enter a configuration label');
            return;
        }
        setIsImporting(true);
        try {
            const content = await readFileText(file);
            let parsed: unknown;
            try {
                parsed = JSON.parse(content);
            } catch {
                toast.warning('The selected file is not valid JSON');
                return;
            }
            if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
                toast.warning('The selected file must contain a JSON object');
                return;
            }
            const newId = await importCoupledKratos(parsed as KratosParameters, trimmed);
            toast.success('Configuration imported');
            // Only the instance is selected; the inspector re-targets the class to
            // the instance's inferred type once its metadata loads.
            selectInstance(newId);
            refreshEverything().catch(() => undefined);
            close();
        } catch (importError) {
            toast.danger(await getApiErrorMessage(importError, 'Import failed'));
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <>
            <Button size="sm" variant="ghost" onPress={() => fileInputRef.current?.click()}>
                Import
            </Button>
            <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                aria-label="Kratos configuration file"
                onChange={(event) => onFilePicked(event.target.files?.[0])}
            />
            <FormDialog
                isOpen={pendingFile !== null}
                title="Import Kratos configuration"
                submitLabel="Import"
                pendingLabel="Importing…"
                isPending={isImporting}
                onSubmit={() => pendingFile && !isImporting && importFile(pendingFile)}
                onClose={() => !isImporting && close()}
            >
                <LabelledInput
                    autoFocus
                    id="import-label-input"
                    label="Configuration label"
                    placeholder="e.g. FSI_Simulation"
                    value={label}
                    disabled={isImporting}
                    onChange={(event) => setLabel(event.target.value)}
                />
            </FormDialog>
        </>
    );
};

export default ImportKratos;
