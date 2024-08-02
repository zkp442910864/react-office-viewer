import React, {FC, useEffect, useRef, useState} from 'react';

import {TitleWithDownload} from '../pageComps';
import styles from './index.module.less';

const TxtViewer: FC<ITxtViewerProps> = ({
    file,
    height,
    width,
    fileName,
}) => {

    const [, update] = useState({});
    const {current: state} = useRef({
        text: '',
        loading: false,
    });

    const getData = () => {
        state.loading = true;
        update({});

        // console.log(file, file!.type);
        // 'text/plain'
        // 'application/json'

        const reader = new FileReader();
        reader.readAsText(file!);
        reader.onload = () => {
            state.text = reader.result as string;
            update({});
        };
    };

    useEffect(() => {
        if (!file) return;
        getData();
    }, [file]);

    return (
        <div className={styles['pg-viewer-wrapper']} style={{width: width || '100%', height: height || document.body.offsetHeight - 45 + 'px'}}>
            <TitleWithDownload
                backgroundColor="gray"
                file={file}
                fileName={fileName ?? file?.name}
                fileType={file?.type}
            />
            <div className={styles['pg-viewer-content']}>{state.text}</div>
        </div>
    );
};

export default TxtViewer;

interface ITxtViewerProps {
    file?: File | null;
    fileName?: string;
    width?: string;
    height?: string;
}
