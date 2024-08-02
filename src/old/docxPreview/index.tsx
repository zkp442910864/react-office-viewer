import React from 'react';
import {createRoot} from 'react-dom/client';

import DocxPreview from './docxPreview';

export const docxPreviewFn = (domId: string, file: File) => {

    const root = createRoot(document.getElementById(domId)!);
    root.render(<DocxPreview file={file} />);
};


