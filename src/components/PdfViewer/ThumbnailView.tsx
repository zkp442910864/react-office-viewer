import React, {useState, useEffect, useRef, useImperativeHandle, forwardRef} from 'react';
import {PageViewport, PDFDocumentProxy, PDFPageProxy} from 'pdfjs-dist';

import {_getObjectUrl} from '../../utils/utils';
import styles from './viewer.module.less';

const THUMBNAIL_WIDTH = 98; // px

export default forwardRef<TThumbnailViewRef, IThumbnailViewProps>((props, ref) => {
    const {
        pdfDocument,
        onPageSearch,
        page,
    } = props;
    const sidebarRef = useRef<HTMLDivElement>(null);
    const viewportRef = useRef<PageViewport | null>(null);
    const selectedPageRef = useRef<HTMLElement | null>(null);

    const getRenderTask = (page: PDFPageProxy) => {
        let adjustScale = 1;

        if (!viewportRef.current) {
            let viewport = page.getViewport({scale: 1, rotation: 0});
            const {width, height} = viewport;
            // let pageRatio = width / height;
            const canvasWidth = THUMBNAIL_WIDTH;
            // let canvasHeight = canvasWidth / pageRatio;
            adjustScale = canvasWidth / width;
            viewport = page.getViewport({scale: adjustScale, rotation: 0});
            viewportRef.current = viewport;

        }
        const {width: pageWidth, height: pageHeight} = viewportRef.current;
        // console.log('vvv2', viewportRef.current);
        const canvasEl = document.createElement('canvas');
        const canvasContext = canvasEl.getContext('2d')!;
        canvasEl.style.width = `${pageWidth}px`;
        canvasEl.style.height = `${pageHeight}px`;
        canvasEl.height = pageHeight;
        canvasEl.width = pageWidth;

        // if previous render isn't done yet, we cancel it
        return {
            renderTask: page.render({
                canvasContext,
                viewport: viewportRef.current,
            }).promise,
            pageInfo: {
                page,
                canvasEl,
            },
        };
    };

    // 串行执行Promise，保证页码按顺序返回
    const serialDrawPage = (renderTasks: Array<ReturnType<typeof getRenderTask>>) => {
        const maxCount = renderTasks.length;
        let count = 0;
        function next(task: typeof renderTasks[number]) {
            if (count >= maxCount) return;
            task.renderTask.then(res => {
                const viewer = sidebarRef.current;
                const {canvasEl} = task.pageInfo;
                if (!viewer) return;
                const img = document.createElement('img');
                if (canvasEl.toBlob) {
                    canvasEl.toBlob(blob => {
                        img.src = _getObjectUrl(blob!);
                        // img.src = canvasEl.toDataURL();
                    });
                } else {
                    img.src = canvasEl.toDataURL();
                }
                let pageDiv = document.getElementById(`page=${count + 1}`);
                if (!pageDiv) {
                    // 新加载的页面
                    let className = styles['thumbnail'];
                    pageDiv = document.createElement('div');
                    pageDiv.setAttribute('id', `page=${count + 1}`);
                    if (count == 0) {
                        if (!selectedPageRef.current) {
                            // 第一页默认设置成选中状态
                            selectedPageRef.current = pageDiv;
                            className = `${styles['thumbnail']} ${styles['selected']}`;
                        }
                    }
                    pageDiv.setAttribute('class', className);
                    viewer.appendChild(pageDiv);

                    pageDiv.appendChild(img);
                } else {
                    // 已存在，则替换
                    const canvasImgDom = pageDiv.children[0];
                    if (canvasImgDom) {
                        pageDiv.replaceChild(img, canvasImgDom);
                    }
                }
                count++;
                next(renderTasks[count]);
            });
        }
        next(renderTasks[count]);
    };

    const handleChangePage: React.MouseEventHandler<HTMLDivElement> = (e) => {
        const pageDiv = (e.target as HTMLDivElement).parentNode as HTMLDivElement;
        if (!pageDiv || !pageDiv.id.includes('page=')) return;
        const className = pageDiv.getAttribute('class');
        if (className && className.includes('selected')) return;

        pageDiv.setAttribute('class', 'thumbnail selected');
        if (selectedPageRef.current) {
            selectedPageRef.current.setAttribute('class', 'thumbnail');
        }
        selectedPageRef.current = pageDiv;
        const pageNo = pageDiv.id.split('=')[1];
        if (+pageNo * 1 > 0) {
            onPageSearch(+pageNo * 1);
        }
        // console.log('ee', e.target.parentNode.id)
    };

    const handleScrollView = (numPages: number, page: number) => {
        // 将scroll移动到页码对应位置

        if (!sidebarRef.current) return;

        if (viewportRef.current?.height) {
            if (numPages * viewportRef.current?.height > sidebarRef.current.clientHeight) {
                sidebarRef.current.scrollTo(0, (page - 1) * viewportRef.current?.height);
            }
        }
        // 改变当前聚焦页样式
        const pageDiv = sidebarRef.current.children[page - 1];
        if (pageDiv) {
            pageDiv.setAttribute('class', 'thumbnail selected');
            if (selectedPageRef.current) {
                selectedPageRef.current.setAttribute('class', 'thumbnail');
            }
            selectedPageRef.current = pageDiv as HTMLElement;
        }
    };

    const resetThumbnail = () => {
        selectedPageRef.current = null;
        viewportRef.current = null;
        sidebarRef.current && (sidebarRef.current.innerHTML = '');
    };

    useEffect(() => {
        if (pdfDocument) {
            // 循环遍历每一页pdf
            const numPages = pdfDocument.numPages;
            const pagePromiseArr: Array<ReturnType<typeof getRenderTask>> = [],
                documentPromiseArr = [];
            for (let i = 1; i <= numPages; i++) {
                documentPromiseArr.push(pdfDocument.getPage(i));
            }
            Promise.all(documentPromiseArr).then(pdfPages => {
                pdfPages.forEach(page => {
                    pagePromiseArr.push(getRenderTask(page));
                });
                serialDrawPage(pagePromiseArr);
            }).catch(err => {
                // if (isFunction(onPageLoadFailRef.current)) {
                //     onPageLoadFailRef.current(err);
                // }
            });
        }
        return () => {
            resetThumbnail();
        };
    }, [pdfDocument]);

    useImperativeHandle(ref, () => {
        // 将ref绑定在该方法上用于父组件调用
        return {
            handleScrollView,
        };
    }, []);

    return (
        <div className={styles['sidebarContent']} style={{height: document.body.offsetHeight - 62 + 'px'}}>
            <div className={styles['thumbnailView']} ref={sidebarRef} onClick={handleChangePage} />
        </div>
    );
});

interface IThumbnailViewProps {
    pdfDocument: PDFDocumentProxy;
    onPageSearch: (page: number) => void;
    page: number;
}

export type TThumbnailViewRef = {handleScrollView: (numPages: number, page: number) => void};
