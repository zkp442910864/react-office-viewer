import {useState, useEffect, useRef, Ref, RefObject} from 'react';
import * as pdfjs from 'pdfjs-dist';
import {TextLayerBuilder, EventBus} from 'pdfjs-dist/web/pdf_viewer.mjs';

import styles from './viewer.module.less';
import {_download, _getObjectUrl, _getBlobUrl} from '../../utils/utils';

function isFunction(value: any) {
    return typeof value === 'function';
}

export const usePdf = ({
    canvasRef,
    pageWrapperRef,
    file,
    onDocumentLoadSuccess,
    onDocumentLoadFail,
    onPageLoadSuccess,
    onPageLoadFail,
    onPageRenderSuccess,
    onPageRenderFail,
    scale = 1.5,
    rotate = 0,
    page = 1,
    // cMapUrl,
    // cMapPacked,
    // workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`,
    // workerSrc = require('pdfjs-dist/build/pdf.worker.min.mjs'),
    // withCredentials = true,
}: IUsePdf) => {
    const [pdfDocument, setPdfDocument] = useState<pdfjs.PDFDocumentProxy>();
    const [pdfPage, setPdfPage] = useState<pdfjs.PDFPageProxy>();
    const renderTask = useRef<pdfjs.RenderTask | null>();
    const scaleRef = useRef(scale);
    const pdfPageRef = useRef(pdfPage);
    const onDocumentLoadSuccessRef = useRef(onDocumentLoadSuccess);
    const onDocumentLoadFailRef = useRef(onDocumentLoadFail);
    const onPageLoadSuccessRef = useRef(onPageLoadSuccess);
    const onPageLoadFailRef = useRef(onPageLoadFail);
    const onPageRenderSuccessRef = useRef(onPageRenderSuccess);
    const onPageRenderFailRef = useRef(onPageRenderFail);

    useEffect(() => {
        onDocumentLoadSuccessRef.current = onDocumentLoadSuccess;
    }, [onDocumentLoadSuccess]);

    useEffect(() => {
        onDocumentLoadFailRef.current = onDocumentLoadFail;
    }, [onDocumentLoadFail]);

    useEffect(() => {
        onPageLoadSuccessRef.current = onPageLoadSuccess;
    }, [onPageLoadSuccess]);

    useEffect(() => {
        onPageLoadFailRef.current = onPageLoadFail;
    }, [onPageLoadFail]);

    useEffect(() => {
        onPageRenderSuccessRef.current = onPageRenderSuccess;
    }, [onPageRenderSuccess]);

    useEffect(() => {
        onPageRenderFailRef.current = onPageRenderFail;
    }, [onPageRenderFail]);

    useEffect(() => {
        (pdfjs as any).workerSrc = require('pdfjs-dist/build/pdf.worker.min.mjs');
    }, []);

    useEffect(() => {
        scaleRef.current = scale;
    }, [scale]);

    useEffect(() => {
        pdfPageRef.current = pdfPage;
    }, [pdfPage]);

    useEffect(() => {
        if (!file) return;
        const config: any = {url: _getObjectUrl(file)};
        // if (isFunction(file)) {
        //     config.url = file();
        // }
        // else {
        //     config.url = file;
        // }
        // if (cMapUrl) {
        //     config.cMapUrl = cMapUrl;
        //     config.cMapPacked = cMapPacked;
        // }
        pdfjs.getDocument(config).promise.then(
            (loadedPdfDocument) => {
                setPdfDocument(loadedPdfDocument);

                if (isFunction(onDocumentLoadSuccessRef.current)) {
                    onDocumentLoadSuccessRef.current(loadedPdfDocument);
                }
            },
            (info) => {
                if (isFunction(onDocumentLoadFailRef.current)) {
                    onDocumentLoadFailRef.current(info);
                }
            },
        );
    // }, [file, withCredentials, cMapUrl, cMapPacked]);
    }, [file]);

    useEffect(() => {
        if (pdfDocument) {
            pdfDocument.getPage(page).then(
                (loadedPdfPage) => {
                    setPdfPage(loadedPdfPage);
                    if (isFunction(onPageLoadSuccessRef.current)) {
                        onPageLoadSuccessRef.current!(loadedPdfPage);
                    }
                },
                (e) => {
                    console.log('onPageLoadFail', e);
                    if (isFunction(onPageLoadFailRef.current)) {
                        onPageLoadFailRef.current!();
                    }
                },
            );
        }
    }, [canvasRef, pageWrapperRef, pdfDocument, page]);

    useEffect(() => {
        const drawPDF = (page: pdfjs.PDFPageProxy) => {
            // Because this page's rotation option overwrites pdf default rotation value,
            // calculating page rotation option value from pdf default and this component prop rotate.
            const rotation = rotate === 0 ? page.rotate : page.rotate + rotate;
            const dpRatio = 1.00071 || window.devicePixelRatio;
            const adjustedScale = scaleRef.current * dpRatio;
            const viewport = page.getViewport({scale: adjustedScale, rotation});
            const canvasEl = canvasRef.current;
            const pageWrapper = pageWrapperRef.current;

            // debugger;
            if (!canvasEl || !pageWrapper) {
                return;
            }
            const canvasContext = canvasEl.getContext('2d');
            if (!canvasContext) {
                return;
            }
            pageWrapper.style.width = `${viewport.width / dpRatio}px`;
            pageWrapper.style.height = `${viewport.height / dpRatio}px`;
            canvasEl.style.width = `${viewport.width / dpRatio}px`;
            canvasEl.style.height = `${viewport.height / dpRatio}px`;
            const resolution = 2; // 增加图像清晰度
            canvasEl.height = resolution * viewport.height;
            canvasEl.width = resolution * viewport.width;

            // if previous render isn't done yet, we cancel it
            if (renderTask.current) {
                renderTask.current.cancel();
                return;
            }
            renderTask.current = page.render({
                canvasContext,
                viewport,
                transform: [resolution, 0, 0, resolution, 0, 0],
            });

            return renderTask.current.promise.then(
                () => {
                    renderTask.current = null;

                    if (isFunction(onPageRenderSuccessRef.current)) {
                        onPageRenderSuccessRef.current(page);
                    }
                    // return page.streamTextContent({
                    //     includeMarkedContent: false,
                    // })
                    return page.getTextContent();
                },
                (reason) => {
                    renderTask.current = null;
                    if (reason && reason.name === 'RenderingCancelledException') {
                        drawPDF(pdfPageRef.current!);
                    } else if (isFunction(onPageRenderFailRef.current)) {
                        onPageRenderFailRef.current!();
                    }
                },
            ).then((textContent: any) => {
                // console.log(textContent);
                // createTextlayer(pageWrapper, textContent, page, viewport, canvasEl.style.width, canvasEl.style.height);
            });
        };

        if (pdfPage) {
            drawPDF(pdfPage);
        }
    }, [pdfPage, scale, rotate]);

    /** 浮层文字，目前复制不了 */
    const createTextlayer = (wrapper: HTMLElement, text: any, page: pdfjs.PDFPageProxy, viewport: pdfjs.PageViewport, width: string, height: string) => {
        // console.log('tt', text);
        if (text) {
            const oldDiv = document.getElementById('pdf_viewer_textLayer');

            const textLayerDiv = document.createElement('div');
            textLayerDiv.setAttribute('id', 'pdf_viewer_textLayer');
            textLayerDiv.setAttribute('style', `width:${width};height:${height};word-break:keep-all`);
            textLayerDiv.setAttribute('class', styles.textLayer);
            textLayerDiv.innerHTML = '<div></div>';
            if (oldDiv) {
                wrapper.replaceChild(textLayerDiv, oldDiv);
            } else {
                wrapper.appendChild(textLayerDiv);
            }

            const textLayer = new TextLayerBuilder({
                pdfPage: page,
                enablePermissions: true,
                // textLayerDiv,
                // eventBus,
                // pageIndex: page.pageIndex,
                // viewport,
            });
            textLayer.div = textLayerDiv.querySelector('div')!;
            // textLayer.setTextContentStream(text);
            // textLayer.setTextContent(text);
            textLayer.render(viewport, text).then((...arg) => {
                console.log('Text layer rendered', arg);
            });
        }
    };
    return {pdfDocument, pdfPage};
};

interface IUsePdf {
    canvasRef: RefObject<HTMLCanvasElement>,
    pageWrapperRef: RefObject<HTMLElement>,
    file?: File,
    onDocumentLoadSuccess: (loadedPdfDocument: pdfjs.PDFDocumentProxy) => void,
    onDocumentLoadFail: (info: any) => void,
    onPageLoadSuccess?: (loadedPdfPage: pdfjs.PDFPageProxy) => void,
    onPageLoadFail?: () => void,
    onPageRenderSuccess: (page: pdfjs.PDFPageProxy) => void,
    onPageRenderFail?: () => void,
    scale: number,
    rotate: number,
    page: number,
}