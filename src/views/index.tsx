import React, {FC, useEffect, useState, createRef, useRef} from 'react';

import Viewer, {viewerFn} from '@/components/Viewer';

const Home: FC = (props) => {

    const [, update] = useState({});
    const {current: state} = useRef({
        domId: 'docx-' + `${Date.now()}-${parseInt(Math.random() * 1000000 + '')}`,
        value: '*',
        file: null as File | null,
    });

    const change = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        // console.log(file);

        // state.file = file;
        document.getElementById(state.domId)!.innerHTML = '';
        viewerFn(state.domId, {height: '500px', fileSource: file});

        update({});
    };

    useEffect(() => {

    }, []);


    return (
        <div>
            <div style={{display: 'flex'}}>
                <select value={state.value} onChange={(e) => {state.value = e.target.value;update({});}}>
                    <option value="*">*</option>
                    <option value=".docx">.docx</option>
                    <option value=".xls,.xlsx">.xls,.xlsx</option>
                    <option value=".pdf">.pdf</option>
                    <option value="image/*,video/*,audio/*">image/*,video/*,audio/*</option>
                    <option value=".ppt,.pptx">.ppt,.pptx</option>
                    <option value=".txt,.md,.json">.txt,.md,.json</option>
                </select>
                <input accept={state.value} type="file" onChange={change} />
            </div>
            <div id={state.domId} />
            {/* <DocxViewer file={state.file} height="500px" />
            <XlsxViewer file={state.file} height="500px" />
            <PdfViewer file={state.file} height="500px" />
            <PptViewer file={state.file} height="500px" />
            <TxtViewer file={state.file} height="500px" />
            <ImageOrAudioOrVideoViewer file={state.file} height="500px" /> */}
            {/* <Viewer fileSource={state.file} height="500px" /> */}
        </div>
    );
};

export default Home;

