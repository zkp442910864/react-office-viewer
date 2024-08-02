import React from 'react';

import {_download, _getBlobUrlFromBuffer} from '../../../utils/utils';

import styles from '../style.module.less';
import downloadImg from '../../../assets/images/toolbarButton-download.svg';

export default function TitleWithDownload(props: {file?: File | null, fileType?: string, fileName: any; handleDownload?: () => void; disabled?: boolean; backgroundColor?: string; zoom?: any; onZoom?: any;}) {

    const {fileName, handleDownload, disabled = false, backgroundColor = '#1e8e3edb', zoom, onZoom} = props;

    const inHandleDownload = handleDownload ?? (() => {
        if (!props.file) return;
        const fileUrl = _getBlobUrlFromBuffer(props.file, props.fileType!);
        _download(fileUrl, fileName || props.file?.name || '', props.fileType);
    });

    return (
        <div className={styles.title} style={{backgroundColor: backgroundColor}}>
            <span>{fileName}</span>
            {
                zoom && (
                    <div style={{display: 'flex'}}>
                        <button className={`${styles['toolbarButton']} ${styles['zoomOut']}`} onClick={() => onZoom('out')} />
                        <div className={styles['splitToolbarButtonSeparator']} />
                        <button className={`${styles['toolbarButton']} ${styles['zoomIn']}`} onClick={() => onZoom('in')} />
                    </div>
                )
            }
            <button
                className={styles['download']}
                // disabled={disabled}
                disabled={true}
                title="下载"
                onClick={inHandleDownload}
            ><img src={downloadImg} />
            </button>
        </div>
    );
}
