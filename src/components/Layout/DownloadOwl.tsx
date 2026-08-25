'use client';

import { Button, toast } from '@heroui/react';
import { FC, useState } from 'react';

import { getApiErrorMessage } from '@/lib/apiError';
import { downloadBlob } from '@/lib/fileTransfer';
import { downloadOwl } from '@/services/backend/ontology';

/**
 * Header action that downloads the ontology as an RDF/XML file. Fetched rather
 * than linked so a backend failure becomes a toast instead of navigating the
 * explorer away to a raw error response.
 */
const DownloadOwl: FC = () => {
    const [isDownloading, setIsDownloading] = useState(false);

    const download = async () => {
        setIsDownloading(true);
        try {
            downloadBlob('onto.owl', await downloadOwl());
        } catch (downloadError) {
            toast.danger(await getApiErrorMessage(downloadError, 'Download failed'));
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <Button size="sm" variant="ghost" isDisabled={isDownloading} onPress={download}>
            {isDownloading ? 'Downloading…' : 'Download OWL'}
        </Button>
    );
};

export default DownloadOwl;
