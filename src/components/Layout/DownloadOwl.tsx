'use client';

import { Button, toast } from '@heroui/react';
import { FC, useState } from 'react';

import Icon from '@/components/Icons/Icon';
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
        <Button size="sm" variant="outline" isDisabled={isDownloading} onPress={download}>
            <Icon>
                <path d="M12 3v12m0 0 4-4m-4 4-4-4M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
            </Icon>
            {isDownloading ? 'Downloading…' : 'Download OWL'}
        </Button>
    );
};

export default DownloadOwl;
