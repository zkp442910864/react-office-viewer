import React, {FC, useEffect, useRef, useState} from 'react';

import {_getObjectUrl, isMediaSource} from '../../utils/utils';

import {TitleWithDownload} from '../pageComps';
import styles from './index.module.less';

const ImageOrAudioOrVideoViewer: FC<IImageOrAudioOrVideoViewerProps> = ({
    file,
    height,
    width,
    fileName,
}) => {

    const [, update] = useState({});
    const {current: state} = useRef({
        loading: false,
        type: '' as Exclude<ReturnType<typeof isMediaSource>, null>['type'],
        url: '',
        error: '未传入file文件，或者资源类型匹配不上',
    });


    useEffect(() => {
        const matchData = isMediaSource(file?.type || '');

        if (!file || !matchData) {
            return;
        }

        state.url = _getObjectUrl(file);
        state.type = matchData.type;
        update({});

    }, [file]);

    return (
        <div className={styles['pg-viewer-wrapper']} style={{width: width || '100%', height: height || document.body.offsetHeight - 45 + 'px'}}>
            <TitleWithDownload
                backgroundColor="gray"
                file={file}
                fileName={fileName ?? file?.name}
                fileType={file?.type}
            />
            <div className={styles['pg-viewer-content']}>
                {(() => {

                    if (state.type === 'image') {
                        return <img className={styles['pg-viewer-item']} loading="lazy" src={state.url} />;
                    }
                    if (state.type === 'video') {
                        return <video className={styles['pg-viewer-item']} controls={true} src={state.url} />;
                    }
                    if (state.type === 'audio') {
                        return <audio className={styles['pg-viewer-item']} controls={true} src={state.url} />;
                    }

                    // return state.error;
                })()}
            </div>
        </div>
    );
};


export default ImageOrAudioOrVideoViewer;


interface IImageOrAudioOrVideoViewerProps {
    file?: File | null;
    fileName?: string;
    width?: string;
    height?: string;
}
