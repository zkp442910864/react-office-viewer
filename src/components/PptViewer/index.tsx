import React, {FC, useEffect, useRef, useState} from 'react';

import {_download, _getBlobUrl, _getBlobUrlFromBuffer, _getObjectUrl, computeZoom} from '../../utils/utils';

import {TitleWithDownload} from '../pageComps';
import styles from './index.module.less';

const PptViewer: FC<IPptViewerProps> = ({
    file,
    height,
    width,
    fileName,
}) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    const handleDownload = () => {
        if (!file) return;
        const fileUrl = _getBlobUrlFromBuffer(file, 'pptx');
        _download(fileUrl, fileName || file?.name || '', 'pptx');
    };

    useEffect(() => {
        if (!file) return;

        const css = [
            './PPTXjs-1.21.1/css/pptxjs.css',
            './PPTXjs-1.21.1/css/nv.d3.min.css',
        ];
        const js = [
            './PPTXjs-1.21.1/js/jquery-1.11.3.min.js',
            './PPTXjs-1.21.1/js/jszip.min.js',
            './PPTXjs-1.21.1/js/filereader.js',
            './PPTXjs-1.21.1/js/d3.min.js',
            './PPTXjs-1.21.1/js/nv.d3.min.js',
            './PPTXjs-1.21.1/js/pptxjs.js',
            './PPTXjs-1.21.1/js/divs2slides.js',

            // './PPTXjs-1.21.1/js/jquery.fullscreen-min.js',
        ];

        iframeRef.current!.contentDocument!.body.innerHTML = '';
        iframeRef.current?.contentDocument?.write(`
            ${css.map(url => `<link rel="stylesheet" href="${url}">`).join('')}
            ${js.map(url => `<script type="text/javascript" src="${url}"></script>`).join('')}
            <div id="result" style="zoom:${computeZoom(960, 780)}"></div>
            <script>
                try {
                    $("#result").pptxToHtml({
                        pptxFileUrl: '${_getObjectUrl(file)}',
                        slideMode: false,
                        keyBoardShortCut: false,
                        slideModeConfig: {  //on slide mode (slideMode: true)
                            first: 1,
                            nav: false, /** true,false : show or not nav buttons*/
                            navTxtColor: "white", /** color */
                            navNextTxt:"&#8250;", //">"
                            navPrevTxt: "&#8249;", //"<"
                            showPlayPauseBtn: false,/** true,false */
                            keyBoardShortCut: false, /** true,false */
                            showSlideNum: false, /** true,false */
                            showTotalSlideNum: false, /** true,false */
                            autoSlide: false, /** false or seconds (the pause time between slides) , F8 to active(keyBoardShortCut: true) */
                            randomAutoSlide: false, /** true,false ,autoSlide:true */
                            loop: false,  /** true,false */
                            background: "black", /** false or color*/
                            transition: "default", /** transition type: "slid","fade","default","random" , to show transition efects :transitionTime > 0.5 */
                            transitionTime: 1 /** transition time in seconds */
                        },
                        onSuccess: () => {
                            const rawHeight = $('.slide').height()
                            const rawWidth = $('.slide').width()
                            $('#result').attr('style', \`zoom:\${rawWidth > window.innerWidth ? Math.min((window.innerWidth - 40) / rawWidth, window.innerHeight / rawHeight, 1) : 1}\`)
                        }
                    });
                } catch (error) {
                    console.log(error)
                }
            </script>
        `);

    }, [file]);

    return (
        <div className={styles['pg-viewer-wrapper']} style={{width: width || '100%', height: height || document.body.offsetHeight - 45 + 'px'}}>
            <TitleWithDownload
                backgroundColor='#F9612E'
                fileName={fileName}
                handleDownload={handleDownload}
                // zoom={true}
                // onZoom={onZoom}
            />
            <iframe ref={iframeRef} style={{border: 'none', width: '100%', height: '100%'}} />
        </div>
    );
};

export default PptViewer;

interface IPptViewerProps {
    file?: File | null;
    fileName?: string;
    width?: string;
    height?: string;
}

