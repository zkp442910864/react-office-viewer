import React, {useState, useEffect, useRef} from 'react';
import {PDFPageProxy} from 'pdfjs-dist';

import {usePdf} from './Viewer';
import Toolbar from './Toolbar';
import styles from './viewer.module.less';

import img from '../../assets/images/loading-icon.gif';
import {_download, _getObjectUrl, _getBlobUrl} from '../../utils/utils';


const MAX_SCALE = 4;
const MIN_SCALE = 0.5;
const SCALE_STEP = 0.1;
const FILE_LIMIT = 1024 * 1024 * 50;
const DEFAULT_SIZE = 1;
function Preview(props: IPreviewProps) {
    const {
        file: outFile,
        fileName: outFileName,
        width,
        height,
    } = props;
    const [file, setFile] = useState<File>();
    const [page, setPage] = useState(1);
    const [scale, setScale] = useState(1);
    const [rotate, setRotate] = useState(0);
    const [fileName, setFileName] = useState('document.pdf');
    const [showLoading, setShowLoading] = useState(false);
    const [showError, setShowError] = useState(false);
    const [errorInfo, setErrorInfo] = useState('');
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const pageWrapperRef = useRef<HTMLElement>(null);
    const toolbarRef = useRef<{initZoomStatus: () => void}>(null);
    const [pageScaleMap, setPageScaleMap] = useState({
        pageWidthScale: 1,
        pageHeightScale: 1,
        pageWidth: 0,
        pageHeight: 0,
    });
    const {pdfDocument, pdfPage} = usePdf({
        file: file,
        page,
        scale,
        rotate,
        canvasRef,
        pageWrapperRef,
        // workerSrc: location.origin + '/js/pdf.worker.js',
        // cMapPacked: true,
        // cMapUrl: location.origin + '/cmap/',
        // onPageLoadSuccess,
        onPageRenderSuccess: (pdfPage) => {
            setShowLoading(false);
            // console.log('success render', pdfPage)
        },
        onDocumentLoadFail: (info) => {
            // console.log('document fail', info);
            setShowLoading(false);
            onShowError(true, info.message);
        },
        onDocumentLoadSuccess: (pdfDocument) => {
            setShowLoading(false);
            pdfDocument.getPage(1).then(pdfPage => {
                // 初始化页面比例数据
                refreshScaleMap(pdfPage);
            });
        },
    });

    const onZoomSearch = (value: string | number) => {
        const {pageWidthScale, pageHeightScale, pageWidth, pageHeight} = pageScaleMap;
        let scale = parseFloat(value as string);

        if (isNaN(value as number)) {
            // if (!pdfPage) {
            //     return;
            // }
            switch (value) {
                case 'page-actual':
                    scale = DEFAULT_SIZE;
                    break;
                case 'page-fit':
                    scale = Math.min(pageWidthScale, pageHeightScale);
                    break;
                case 'page-width':
                    scale = pageWidthScale;
                    break;
                case 'auto': {
                    const isLandscape = pageWidth > pageHeight;
                    const horizontalScale = isLandscape ? Math.min(pageHeightScale, pageWidthScale) : pageWidthScale;
                    scale = Math.min(MAX_SCALE, horizontalScale);
                    break;
                }
                default:
                    console.error('PDFViewer._setScale: "' + value + '" is an unknown zoom value.');
                    return;
            }
        }
        setScale(scale);
    };

    // 更新初始比例数据
    const refreshScaleMap = (pdfPage?: PDFPageProxy, rotate = 0) => {
        if (!pdfPage) return;
        if (!containerRef.current) return;
        const pageView = pdfPage._pageInfo.view;
        let pageWidth = pageView[2];
        let pageHeight = pageView[3];
        const rotation = rotate % 360;
        if (rotation == 90 || rotation == 270) {
            pageWidth = pageView[3];
            pageHeight = pageView[2];
        }
        const container = containerRef.current;
        const pageWidthScale = Math.round(container.clientWidth / pageWidth * 10) / 10;
        const pageHeightScale = Math.round(container.clientHeight / pageHeight * 10) / 10;
        setPageScaleMap({
            pageWidthScale,
            pageHeightScale,
            pageWidth,
            pageHeight,
        });
    };

    // 根据页面比例大小调整居中或居左
    const handleLayout = () => {
        const {pageWidthScale} = pageScaleMap;
        if (!containerRef.current) return;
        const isCenter = (window.getComputedStyle(containerRef.current, null) as any)['align-items'] as string;
        // console.log('ss', scale, pageWidthScale, isCenter)
        if (scale >= pageWidthScale) {
            if (isCenter === 'center') {
                (containerRef.current.style as any)['align-items'] = 'flex-start';
            }
        } else {
            if (isCenter !== 'center') {
                (containerRef.current.style as any)['align-items'] = 'center';
            }
        }
        setShowLoading(false);
    };

    const onUploadFile = (file: File) => {
        setShowLoading(true);
        setPage(1);
        setRotate(0);
        if (toolbarRef.current) {
            toolbarRef.current.initZoomStatus();
        }
        setFile(_getObjectUrl(file));
    };

    const onDownloadFile = async () => {
        if (!outFile) return;
        setShowLoading(true);
        const fileUrl = await _getBlobUrl('', pdfDocument);
        _download(fileUrl, fileName, 'pdf');
        setShowLoading(false);
    };

    const onShowError = (status: boolean, info: string) => {
        setShowError(status);
        setErrorInfo(info);
    };

    useEffect(() => {
        if (outFile) {
            setShowLoading(true);
            // const fileUrl = _getObjectUrl(outFile);
            setFileName(outFile.name);
            setFile(outFile);
        }
    }, [outFile]);

    useEffect(() => {
        if (outFileName) {
            setFileName(outFileName);
        }
    }, [outFileName]);

    useEffect(() => {
        setShowLoading(true);
        handleLayout();
    }, [pageScaleMap, scale]);

    useEffect(() => {
        // 旋转之后需要更新页面比例数据
        refreshScaleMap(pdfPage, rotate);
    }, [rotate]);

    return (
        <div className={styles.container} style={{width: width || '100%'}}>
            <div className={styles.loadingPage} style={{display: showLoading ? 'block' : 'none'}}>
                <div className={styles.loading}><img src={img} /></div>
            </div>
            <div className={styles.wrapper}>
                <>
                    <Toolbar
                        FILE_LIMIT={FILE_LIMIT}
                        MAX_SCALE={MAX_SCALE}
                        MIN_SCALE={MIN_SCALE}
                        pageOut={page}
                        pdfDocument={pdfDocument!}
                        // pdfPage={pdfPage}
                        ref={toolbarRef}
                        SCALE_STEP={SCALE_STEP}
                        scaleOut={scale}
                        onDownloadFile={onDownloadFile}
                        onPageSearch={(value) => setPage(value)}
                        onRotateChange={(val) => val ? setRotate(rotate + 90) : setRotate(rotate - 90)}
                        onShowError={onShowError}
                        onShowLoading={setShowLoading}
                        onUploadFile={onUploadFile}
                        onZoomSearch={onZoomSearch}
                    />
                    <div className={styles.errorLine} style={{display: showError ? 'flex' : 'none'}}>
                        <em>无效或损坏的文件。详细信息： {errorInfo}</em>
                        <button onClick={() => onShowError(false, '')}>关闭</button>
                    </div>
                    <div className={styles.viewerContainer} ref={containerRef} style={{height: height || document.body.offsetHeight - 30 + 'px'}}>
                        {pdfDocument &&
                            <article className={styles.page} ref={pageWrapperRef}>
                                <div className={styles.canvasWrapper}>
                                    <canvas ref={canvasRef} />
                                </div>
                            </article>}
                    </div>
                </>
            </div>
        </div>

    );
}

export default Preview;

interface IPreviewProps {
    file?: File | null;
    fileName?: string;
    width?: string;
    height?: string;
}
