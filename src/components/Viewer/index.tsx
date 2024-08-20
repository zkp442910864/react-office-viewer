import React, {FC, useEffect, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';

import styles from './index.module.less';
import {getFileTypeFromUploadType, isMediaSource} from '../../utils/utils';
import FullScreen from '../FullScreen';

const Viewer: FC<IViewerProps> = ({
    openFullScreen = true,
    fileSource,
    height,
    width,
    fileName,
    type,
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

        if (['image', 'video', 'audio'].includes(type) || mediaSource) {
            Com.current = (await import(/* webpackChunkName: "ImageOrAudioOrVideoViewer" */'../ImageOrAudioOrVideoViewer')).default;
        }
        else if (['pdf'].includes(type) || textFileSource === 'pdf') {
            Com.current = (await import(/* webpackChunkName: "PdfViewer" */'../PdfViewer')).default;
        }
        else if (['xls', 'xlsx'].includes(type) || ['xls', 'xlsx'].includes(textFileSource)) {
            Com.current = (await import(/* webpackChunkName: "SheetViewer" */'../SheetViewer')).default;
        }
        else if (['docx'].includes(type) || textFileSource === 'docx') {
            Com.current = (await import(/* webpackChunkName: "DocxViewer" */'../DocxViewer')).default;
        }
        else if (['ppt'].includes(type) || ['ppt', 'pptx'].includes(textFileSource)) {
            Com.current = (await import(/* webpackChunkName: "PptViewer" */'../PptViewer')).default;
        }
        else if (['txt', 'json'].includes(type) || type === '' || ['json', ''].includes(textFileSource)) {
            Com.current = (await import(/* webpackChunkName: "TxtViewer" */'../TxtViewer')).default;
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
        <FullScreen open={openFullScreen}>
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
                                type={type}
                                width={width}
                            />
                        )
                        : ''
                }
            </div>
        </FullScreen>
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
    /** 开启全屏功能 */
    openFullScreen?: boolean | true;
    /** 强制文件类型 */
    type: 'image' | 'video' | 'audio' | 'pdf' | 'docx' | 'ppt' | 'json' | 'txt' | 'xls' | 'xlsx',
}
