import React, {useEffect, useRef, useState, useImperativeHandle, forwardRef, RefObject} from 'react';
import {PDFDocumentProxy} from 'pdfjs-dist';

import ThumbnailView, {TThumbnailViewRef} from './ThumbnailView';
import printView from './printView';
import styles from './viewer.module.less';

export default forwardRef<any, IToolbarProps>((props, ref) => {
    const {
        pdfDocument,
        // pdfPage,
        onShowError,
        onZoomSearch,
        onPageSearch,
        onRotateChange,
        onDownloadFile,
        onUploadFile,
        onShowLoading,
        pageOut, // 从父组件传入，一定是在范围之内的生效页码
        scaleOut, // 从父组件传入，一定是数字类型
        SCALE_STEP,
        MAX_SCALE,
        MIN_SCALE,
        FILE_LIMIT,
    } = props;
    const [pageNo, setPageNo] = useState(1); // 本组件维护，可能是不合法的页码
    const [scale, setScale] = useState('page-actual');// 本组件维护，可能是string类型
    const [customValue, setCustomValue] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState('');
    const [showDownload, setShowDownload] = useState(false);
    const sidebarOpenRef = useRef(sidebarOpen);
    const inputRef = useRef<HTMLInputElement>(null);
    const pageRef = useRef(pageNo);
    const pageOutRef = useRef(pageOut);
    const inputFileRef = useRef<HTMLInputElement>(null);
    const thumbRef = useRef<TThumbnailViewRef>(null);
    const printFrameRef = useRef<HTMLIFrameElement>(null);
    const sidebarContainerRef = useRef<HTMLDivElement>(null);

    // function addEvent(obj: any, type: any, callback: any) {
    //     if (obj.addEventListener) {
    //         // W3C内核
    //         obj.addEventListener(type, callback, false);
    //     } else {
    //         // IE内核
    //         obj.attachEvent('on' + type, callback);
    //     }
    // }
    // function removeEvent(obj: any, type: any, callback: any) {
    //     if (obj.removeEventListener) {
    //         // W3C内核
    //         obj.removeEventListener(type, callback);
    //     } else {
    //         // IE内核
    //         obj.detachEvent('on' + type, callback);
    //     }
    // }
    // function handleKeyEnter(e: any) {
    //     if (e.keyCode === 13) {
    //         if (inputRef.current == document.activeElement) {
    //             onPageBlur();
    //         }
    //     }
    // }
    // const removeClass = () => {
    //     if (!sidebarOpenRef.current.includes(styles['sidebarOpen'])) {
    //         setSidebarOpen('');
    //     }
    // };
    const onPageChange: React.ChangeEventHandler<HTMLInputElement> = e => {
        setPageNo(+e.target.value);
    };
    const _onPageSearch = (page: number) => {
        thumbRef.current!.handleScrollView(pdfDocument.numPages, page);
        onPageSearch(page);
    };
    const onPagePrev = () => {
        if (pageNo === 1) return;
        _onPageSearch(pageNo - 1);
    };
    const onPageNext = () => {
        if (pageNo == pdfDocument.numPages) {
            return;
        }
        _onPageSearch(pageNo * 1 + 1);
    };
    const onPageBlur = () => {
        const newPageNo = pageRef.current;
        if (!newPageNo || newPageNo * 1 < 1 || newPageNo * 1 > pdfDocument.numPages) {
            setPageNo(pageOutRef.current);
            return;
        }
        _onPageSearch(newPageNo * 1);
    };
    const initZoomStatus = () => {
        setScale('page-actual');
        onZoomSearch('page-actual');
    };
    const onZoomChange: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
        setScale(e.target.value);
        onZoomSearch(e.target.value);
    };
    const onZoomIn = () => {
        const newValue = Math.round((scaleOut + SCALE_STEP) * 100) + '%';
        setScale('customValue');
        setCustomValue(newValue);
        onZoomSearch(scaleOut + SCALE_STEP);
    };
    const onZoomOut = () => {
        const newValue = Math.round((scaleOut - SCALE_STEP) * 100) + '%';
        setScale('customValue');
        setCustomValue(newValue);
        onZoomSearch(scaleOut - SCALE_STEP);
    };
    const onRotateClock = () => {
        onRotateChange(true);
    };
    const onRotateAntiClock = () => {
        onRotateChange(false);
    };
    const handleInputFileChange = () => {
        const files = inputFileRef.current!.files;
        if (files && files.length > 0) {
            if (files[0].type !== 'application/pdf') {
                onShowError(true, '请上传pdf格式的文件！');
                return;
            }
            if (files[0].size > FILE_LIMIT) {
                onShowError(true, '请上传50M以内大小的文件！');
                return;
            }
            onUploadFile(files[0]);
            setShowDownload(false);
        }
        // console.log('file', inputFileRef.current.files)
    };
    const onShowSidebar = () => {
        if (sidebarOpen.includes('sidebarOpen')) {
            // 关闭侧栏
            setSidebarOpen(styles['sidebarMoving']);
        } else {
            // 打开侧栏
            setSidebarOpen(`${styles['sidebarOpen']} ${styles['sidebarMoving']}`);
        }
    };
    const onPrint = () => {
        const iframe = printFrameRef.current!;
        const doc = iframe.contentWindow!.document;
        const printContainer = iframe.contentWindow!.document.body;
        printContainer.innerHTML = '';
        let style = doc.head.getElementsByTagName('style')[0];
        if (!style) {
            style = document.createElement('style');
            style.textContent = `.printedPage{width:100%;height:100%;
                page-break-after:always;
                page-break-inside:avoid;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
            }
            .printedPage img{
                max-width: 100%;
                max-height: 100%;
                direction: ltr;
                display: block;
            }
            `;
            doc.head.append(style);
        }
        iframe.contentWindow!.focus();
        onShowLoading(true);
        printView(pdfDocument, printContainer as HTMLDivElement).then(() => {
            onShowLoading(false);
            iframe.contentWindow!.print();
        });
    };
    const onDownload = () => {
        onDownloadFile();
    };

    useEffect(() => {
        // addEvent(window, 'keydown', handleKeyEnter);
        // const sidebarContainer = sidebarContainerRef.current;
        // addEvent(sidebarContainer, 'transitionend', removeClass);
        // return () => {
        //     removeEvent(window, 'keydown', handleKeyEnter);
        //     removeEvent(sidebarContainer, 'transitionend', removeClass);
        // };
    }, [pdfDocument]);

    useEffect(() => {
        pageOutRef.current = pageOut; // 固定pageOut值
        setPageNo(pageOut);
    }, [pageOut]);

    useEffect(() => {
        pageRef.current = pageNo; // 保证用当前最新的pageNo值
    }, [pageNo]);

    useEffect(() => {
        sidebarOpenRef.current = sidebarOpen;
    }, [sidebarOpen]);

    useImperativeHandle(ref, () => {
        // 将ref绑定在该方法上用于父组件调用
        return {
            initZoomStatus,
        };
    }, []);



    return (
        <div className={`${styles['outerContainer']} ${sidebarOpen}`}>
            <div className={styles['toolbarContainer']}>
                <div className={styles['toolbarViewer']}>
                    <div className={styles['toolbarViewerLeft']}>
                        <button className={`${styles['toolbarButton']} ${styles['sidebarToggle']}`} title="切换侧栏" onClick={onShowSidebar} />
                        <div className={styles['toolbarButtonSpacer']} />
                        {/* <button id="viewFind" className="toolbarButton" title="Find in Document" tabindex="12" data-l10n-id="findbar">
                            <span data-l10n-id="findbar_label">Find</span>
                        </button> */}
                        <div className={`${styles['splitToolbarButton']} ${styles['hiddenSmallView']}`}>
                            <button
                                className={`${styles['toolbarButton']} ${styles['previous']}`}
                                disabled={pageNo == 1}
                                title="上一页"
                                onClick={onPagePrev}
                            />
                            <div className={styles['splitToolbarButtonSeparator']} />
                            <button
                                className={`${styles['toolbarButton']} ${styles['next']}`}
                                disabled={!pdfDocument || pageNo >= pdfDocument.numPages}
                                title="下一页"
                                onClick={onPageNext}
                            />
                        </div>
                        <div className={styles['pagination']}>
                            <input
                                autoComplete="off"
                                className={`${styles['toolbarField']} ${styles['pageNumber']}`}
                                disabled={!pdfDocument}
                                min="1"
                                ref={inputRef}
                                title="页码"
                                type="number"
                                value={pageNo}
                                onBlur={onPageBlur}
                                onChange={onPageChange}
                            />
                            <span className={`${styles['numPages']} ${styles['toolbarLabel']}`}>/{pdfDocument?.numPages || 0}</span>
                        </div>

                    </div>
                    <div className={styles['toolbarViewerMiddle']}>
                        <div className={styles['splitToolbarButton']}>
                            <button
                                className={`${styles['toolbarButton']} ${styles['zoomOut']}`}
                                disabled={scaleOut === MIN_SCALE}
                                title="缩小"
                                onClick={onZoomOut}
                            />
                            <div className={styles['splitToolbarButtonSeparator']} />
                            <button
                                className={`${styles['toolbarButton']} ${styles['zoomIn']}`}
                                disabled={scaleOut === MAX_SCALE}
                                title="放大"
                                onClick={onZoomIn}
                            />
                        </div>
                        <span className={`${styles['scaleSelectContainer']} ${styles['dropdownToolbarButton']}`}>
                            <select title="缩放" value={scale} onChange={onZoomChange}>
                                <option title="" value="auto">自动缩放</option>
                                <option title="" value="page-actual">实际大小</option>
                                <option title="" value="page-fit">适合高度</option>
                                <option title="" value="page-width">适合页宽</option>
                                <option
                                    disabled={true}
                                    hidden={true}
                                    title=""
                                    value='customValue'
                                >{customValue}
                                </option>
                                <option title="" value="0.5">50%</option>
                                <option title="" value="0.75">75%</option>
                                <option title="" value="1">100%</option>
                                <option title="" value="1.25">125%</option>
                                <option title="" value="1.5">150%</option>
                                <option title="" value="2">200%</option>
                                <option title="" value="3">300%</option>
                                <option title="" value="4">400%</option>
                            </select>
                        </span>
                    </div>
                    <div className={styles['toolbarViewerRight']}>
                        {/* <button className={`${styles['toolbarButton']} ${styles['openFile']}`} title="打开文件" onChange={handleInputFileChange}>
                            <input ref={inputFileRef} style={{opacity: 0, width: '100%'}} type="file" />
                        </button> */}

                        {/* <button className={`${styles['toolbarButton']} ${styles['print']}`} title="打印" onClick={onPrint} /> */}
                        {
                            showDownload && <button className={`${styles['toolbarButton']} ${styles['download']}`} title="下载" onClick={onDownload} />
                        }
                        <div className={styles['splitToolbarButton']}>
                            <button className={`${styles['toolbarButton']} ${styles['pageRotateCw']}`} title="顺时针旋转" onClick={onRotateClock} />
                            <div className={styles['splitToolbarButtonSeparator']} />
                            <button className={`${styles['toolbarButton']} ${styles['pageRotateCcw']}`} title="逆时针旋转" onClick={onRotateAntiClock} />
                        </div>
                    </div>
                </div>
                <div className={`${styles['loadingBar']} ${styles['hidden']}`}>
                    <div className={styles['progress']}>
                        <div className={styles['glimmer']} />
                    </div>
                </div>
            </div>
            <div className={styles['sidebarContainer']} ref={sidebarContainerRef}>
                <div className={styles['toolbarSidebar']}>
                    <div className={styles['toolbarSidebarLeft']}>
                        <div className={`${styles['sidebarViewButtons']} ${styles['splitToolbarButton']} ${styles['toggled']}`} role="radiogroup">
                            <button className={`${styles['viewThumbnail']} ${styles['toolbarButton']} ${styles['toggled']}`} title="显示缩略图" />
                        </div>
                    </div>
                </div>
                <ThumbnailView
                    page={pageOut}
                    pdfDocument={pdfDocument}
                    ref={thumbRef}
                    onPageSearch={onPageSearch}
                />
                <div className={styles['sidebarResizer']} />
            </div>
            <iframe
                className={styles['print-iframe']}
                frameBorder="0"
                ref={printFrameRef}
            />
        </div>
    );
});

interface IToolbarProps {
    pdfDocument: PDFDocumentProxy,
    // pdfPage,
    onShowError: (val: boolean, msg: string) => void,
    onZoomSearch: (val: string | number) => void,
    onPageSearch: (val: number) => void,
    onRotateChange: (val: boolean) => void,
    onDownloadFile: () => void,
    onUploadFile: (file: File) => void,
    onShowLoading: (val: boolean) => void,
    pageOut: number, // 从父组件传入，一定是在范围之内的生效页码
    scaleOut: number, // 从父组件传入，一定是数字类型
    SCALE_STEP: number,
    MAX_SCALE: number,
    MIN_SCALE: number,
    FILE_LIMIT: number,
}
