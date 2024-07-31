import React from 'react';
import {createRoot} from 'react-dom/client';

import Component from './views';

export default () => {
    console.time('入口耗时');

    // 主入口
    const Main = () => {

        return (
            <Component />
        );
    };


    const root = createRoot(document.getElementById('root')!);
    root.render(<Main />);
    console.timeEnd('入口耗时');
};

