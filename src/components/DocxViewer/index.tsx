import mammoth from 'mammoth';
import React, {useEffect, useState, useRef} from 'react';

import {Loading, TitleWithDownload, ErrorLine} from '../pageComps';
import {getFileTypeFromUploadType, _getBlobUrlFromBuffer, _download} from '../../utils/utils';
import styles from './style.module.less';

export default function DocxViewer(props: {file?: File | null; fileName?: string; width?: string; height?: string;}) {
    const {file, fileName: outFileName, width, height} = props;
    const [docHtmlStr, setDocHtmlStr] = useState('');
    const [fileName, setFileName] = useState('');
    const [showError, setShowError] = useState(false);
    const [errorInfo, setErrorInfo] = useState('暂不支持doc格式的文件，请上传docx格式的文件！');
    const [scale, setScale] = useState(1);
    const [fileArrayBuffer, setFileArrayBuffer] = useState<ArrayBuffer>(); // ArrayBuffer类型的文件
    const [showLoading, setShowLoading] = useState(false);

    const loadContent = async (arrayBuffer: ArrayBuffer) => {
        setShowLoading(true);
        try {
            const data = new Uint8Array(arrayBuffer);
            const {value} = await mammoth.convertToHtml({arrayBuffer: data}, {
                includeDefaultStyleMap: true,
            });
            const div = document.createElement('div');
            div.innerHTML = value;
            // 处理所有的a标签，使其在新标签页打开
            const domList = div.getElementsByTagName('a');
            Array.from(domList).forEach(item => {
                item.setAttribute('target', '_blank');
            });
            setDocHtmlStr(div.innerHTML);
        } catch (e) {
            console.log('error', e);
            setShowError(true);
        } finally {
            setShowLoading(false);
        }
    };
    const handleDownload = () => {
        const fileUrl = _getBlobUrlFromBuffer(fileArrayBuffer, 'docx');
        _download(fileUrl, fileName, 'docx');
    };
    const onShowError = (status: boolean) => {
        setShowError(status);
    };
    const onZoom = (direc: string) => {
        if (direc == 'in') {
            // 放大
            if (scale >= 1) return;
            const _scale: any = scale + 0.1;
            // console.log(_scale);
            setScale(_scale.toFixed(1) * 1);
        } else {
            if (scale <= 0.3) return;
            const _scale: any = scale - 0.1;
            // console.log(_scale);
            setScale(_scale.toFixed(1) * 1);
        }
    };

    useEffect(() => {
        if (outFileName) {
            setFileName(outFileName);
        }
    }, [outFileName]);

    useEffect(() => {
        if (file) {
            setShowLoading(true);
            if (file instanceof File) {
                const fName = file.name;
                const fileType = getFileTypeFromUploadType(file.type);
                if (fileType !== 'docx') {
                    onShowError(true);
                    setShowLoading(false);
                    return;
                }
                const reader = new FileReader();
                reader.readAsArrayBuffer(file);
                reader.onload = e => {
                    setFileName(fName);
                    const data = e.target!.result;
                    setFileArrayBuffer(data as ArrayBuffer);
                    loadContent(data as ArrayBuffer);
                };
            } else {
                onShowError(true);
                setShowLoading(false);
            }
        }
    }, [file]);
    return (
        <div className={styles['pg-viewer-wrapper']} style={{width: width || '100%', height: height || document.body.offsetHeight - 45 + 'px'}}>
            <Loading showLoading={showLoading} />
            <ErrorLine errorInfo={errorInfo} showError={showError} onShowError={onShowError} />
            <TitleWithDownload
                backgroundColor='rgba(35,100,155,0.9)'
                disabled={!fileArrayBuffer}
                fileName={fileName}
                handleDownload={handleDownload}
                zoom={true}
                onZoom={onZoom}
            />
            <div
                className={styles['document-container']}
                dangerouslySetInnerHTML={{__html: docHtmlStr}}
                style={{
                    width: scale * 100 + '%',
                    height: '85%',
                    overflow: 'auto',
                    boxSizing: 'border-box',
                }}
            >
                {/* {docHtmlStr} */}
            </div>
        </div>
    );
}