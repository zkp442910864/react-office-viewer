import {PDFDocumentProxy, PDFPageProxy} from 'pdfjs-dist';

import {_getObjectUrl} from '../../utils/utils';

const getRenderTask = (page: PDFPageProxy) => {
    // let adjustScale = 1;
    const viewport = page.getViewport({scale: 1, rotation: 0});
    const {width, height} = viewport;
    const canvasEl = document.createElement('canvas');
    const canvasContext = canvasEl.getContext('2d')!;
    canvasEl.style.width = `${width}px`;
    canvasEl.style.height = `${height}px`;
    const resolution = 2;
    canvasEl.height = resolution * viewport.height;
    canvasEl.width = resolution * viewport.width;

    // if previous render isn't done yet, we cancel it
    return {
        renderTask: page.render({
            canvasContext,
            viewport,
            intent: 'print',
            transform: [resolution, 0, 0, resolution, 0, 0],
        }).promise,
        pageInfo: {
            page,
            canvasEl,
        },
    };
};
// 串行执行Promise，保证页码按顺序返回
const serialDrawPage = (renderTasks: Array<ReturnType<typeof getRenderTask>>, container: HTMLDivElement) => {
    return new Promise<void>((resolve) => {
        const maxCount = renderTasks.length;
        let loadCount = 0;
        let count = 0;
        function next(task: typeof renderTasks[number]) {
            if (count >= maxCount) {
                // resolve();
                return;
            }
            task.renderTask.then((res) => {
                const viewer = container;
                const {canvasEl} = task.pageInfo;
                if (!viewer) return;
                const img = document.createElement('img');
                if (canvasEl.toBlob) {
                    canvasEl.toBlob((blob) => {
                        img.src = _getObjectUrl(blob!);
                    });
                } else {
                    img.src = canvasEl.toDataURL();
                }
                const pageDiv = document.createElement('div');
                pageDiv.setAttribute('class', 'printedPage');
                pageDiv.appendChild(img);
                viewer.appendChild(pageDiv);
                count++;
                img.onload = () => {
                    loadCount++;
                    if (loadCount == maxCount) {
                        resolve();
                    }
                };
                // if (count == maxCount) {
                //     img.onload = () => {
                //         resolve();
                //     }
                // }
                next(renderTasks[count]);
            });
        }
        next(renderTasks[count]);
    });
};

export default (pdfDocument: PDFDocumentProxy, container: HTMLDivElement) => {
    return new Promise<void>(resolve => {

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
                serialDrawPage(pagePromiseArr, container).then(() => {
                    resolve();
                });
            }).catch(err => {
                // if (isFunction(onPageLoadFailRef.current)) {
                //     onPageLoadFailRef.current(err);
                // }
            });
        }
    });
};