import React, {FC, useEffect, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';

import styles from './index.module.less';
import {getFileTypeFromUploadType, isMediaSource} from '../../utils/utils';

const Viewer: FC<IViewerProps> = ({
    fileSource,
    height,
    width,
    fileName,
}) => {

    const Com = useRef<FC<any>>();
    const [, update] = useState({});
    const {current: state} = useRef({
        loading: false,
        error: '',
        file: null as null | File,
    });

    const getComponent = async (type: string, name: string) => {
        const mediaSource = isMediaSource(type);
        const textFileSource = getFileTypeFromUploadType(type);

        if (mediaSource) {
            Com.current = (await import('../ImageOrAudioOrVideoViewer')).default;
        }
        else if (textFileSource === 'pdf') {
            Com.current = (await import('../PdfViewer')).default;
        }
        else if (['xls', 'xlsx'].includes(textFileSource)) {
            Com.current = (await import('../SheetViewer')).default;
        }
        else if (textFileSource === 'docx') {
            Com.current = (await import('../DocxViewer')).default;
        }
        else if (['ppt', 'pptx'].includes(textFileSource)) {
            Com.current = (await import('../PptViewer')).default;
        }
        else if (type === '' || ['json', ''].includes(textFileSource)) {
            Com.current = (await import('../TxtViewer')).default;
        }
        else {
            Com.current = () => <>目前还不支持该文件类型: {textFileSource}, type: {type}, name: {name}</>;
        }
    };

    const getData = async () => {
        if (!fileSource) return;

        const fn = typeof fileSource === 'function' ? fileSource : (() => Promise.resolve(fileSource));
        state.loading = true;
        update({});

        try {
            const file = await fn();
            await getComponent(file.type, file.name);
            state.file = file;
        } catch (error) {
            console.error(error);
        }

        state.loading = false;
        update({});
    };

    const clear = () => {
        Com.current = undefined;
        update({});
    };

    useEffect(() => {
        clear();
        // window.lddd = clear;
        getData();
    }, [fileSource]);


    return (
        <div className={state.loading ? styles['loading'] : ''} style={{width: width || '100%', height: height || document.body.offsetHeight - 45 + 'px'}}>
            {/* <DocxViewer file={state.file} height="500px" />
            <XlsxViewer file={state.file} height="500px" />
            <PdfViewer file={state.file} height="500px" />
            <PptViewer file={state.file} height="500px" />
            <TxtViewer file={state.file} height="500px" />
            <ImageOrAudioOrVideoViewer file={state.file} height="500px" /> */}
            {
                Com.current
                    ? (
                        <Com.current
                            file={state.file}
                            fileName={fileName}
                            height={height}
                            width={width}
                        />
                    )
                    : ''
            }
        </div>
    );
};


export const viewerFn = (dom: string | HTMLDivElement, props: IViewerProps) => {
    const root = createRoot(typeof dom === 'string' ? document.getElementById(dom)! : dom);
    root.render(<Viewer {...props} />);
};


export default Viewer;

interface IViewerProps {
    fileSource?: File | (() => Promise<File>) | null;
    fileName?: string;
    width?: string;
    height?: string;
}
