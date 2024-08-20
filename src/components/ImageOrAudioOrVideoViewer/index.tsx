import React, {FC, useEffect, useRef, useState} from 'react';
import {TransformComponent, TransformWrapper} from 'react-zoom-pan-pinch';

import {_getObjectUrl, isMediaSource} from '../../utils/utils';
import {TitleWithDownload} from '../pageComps';
import styles from './index.module.less';

const ImageOrAudioOrVideoViewer: FC<IImageOrAudioOrVideoViewerProps> = ({
    file,
    type,
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
        if (typeof file === 'string') {
            state.url = file;
            update({});
        }
        else {
            const matchData = isMediaSource(file?.type || '');

            if (!file || !matchData) {
                return;
            }

            state.url = _getObjectUrl(file);
            state.type = matchData.type;
            update({});
        }


    }, [file]);

    return (
        <div className={styles['pg-viewer-wrapper']}>
            <TitleWithDownload
                backgroundColor="gray"
                {...(
                    typeof file === 'string'
                        ? {
                            fileName: fileName,
                        }
                        : {
                            file,
                            fileName: fileName ?? file?.name,
                            fileType: file?.type,
                        }
                )}
            />
            <div className={styles['pg-viewer-content']}>
                <TransformWrapper>
                    <TransformComponent contentStyle={{width: '100%', height: '100%'}} wrapperStyle={{width: '100%', height: '100%'}}>
                        {(() => {

                            if (type === 'image' || state.type === 'image') {
                                return <img className={styles['pg-viewer-item']} loading="lazy" src={state.url} />;
                            }
                            if (type === 'video' || state.type === 'video') {
                                return <video className={styles['pg-viewer-item']} controls={true} src={state.url} />;
                            }
                            if (type === 'audio' || state.type === 'audio') {
                                return <audio className={styles['pg-viewer-item']} controls={true} src={state.url} />;
                            }

                        })()}
                    </TransformComponent>
                </TransformWrapper>
            </div>
        </div>
    );
};


export default ImageOrAudioOrVideoViewer;


interface IImageOrAudioOrVideoViewerProps {
    file?: File | string | null;
    fileName?: string;
    /** 强制文件类型 */
    type: 'image' | 'video' | 'audio',
}
