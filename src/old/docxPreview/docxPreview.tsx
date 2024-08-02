import React, {FC, useEffect, useState, createRef, useRef} from 'react';

import {computeZoom} from '../modules/computeZoom';

// https://www.npmjs.com/package/docx-preview
const DocxPreview: FC<IProps> = ({
    file,
}) => {

    const {current: state} = useRef({
        domId: 'docx-' + `${Date.now()}-${parseInt(Math.random() * 1000000 + '')}`,
        loadStatus: 'pending' as 'pending' | 'fail' | 'success',
    });
    const [, update] = useState({});

    const load = async () => {
        const {renderAsync} = await import('docx-preview');

        const dom = document.getElementById(state.domId)!;
        dom.innerHTML = '';

        state.loadStatus = 'pending';
        update({});

        try {
            await renderAsync(file, dom, undefined);
            state.loadStatus = 'success';
        } catch (error) {
            console.log(error);
            state.loadStatus = 'fail';
        }
        update({});
    };

    useEffect(() => {
        load();
    }, [file]);

    return (
        <div>
            <div id={state.domId} style={{zoom: computeZoom()}} />
            <div style={{textAlign: 'center'}}>
                {(() => {
                    if (state.loadStatus === 'pending') {
                        return '资源处理中，请等待';
                    }

                    if (state.loadStatus === 'fail') {
                        return '资源处理失败，可能存在不兼容';
                    }

                    return '';
                })()}
            </div>
        </div>
    );
};

export default DocxPreview;

interface IProps {
    file: File;
}
