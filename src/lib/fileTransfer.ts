/** Reads a picked file as UTF-8 text. FileReader-based so every runtime (jsdom included) supports it. */
export const readFileText = (file: File) =>
    new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error ?? new Error('Could not read the file'));
        reader.readAsText(file);
    });

/** Hands the blob to the browser as a file download. */
export const downloadBlob = (filename: string, blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    // Deferred: Firefox/Safari start the transfer after the click task, and a
    // same-tick revoke can silently drop the download.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
};

/** Saves a JSON-serialisable value as a pretty-printed .json file download. */
export const downloadJson = (filename: string, data: unknown) => {
    downloadBlob(filename, new Blob([JSON.stringify(data, null, 4)], { type: 'application/json' }));
};
