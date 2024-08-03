import React, {cloneElement, FC, useEffect, useRef, useState} from 'react';

import styles from './index.module.less';

const FullScreen: FC<IFullScreenProps> = ({
    children,
}) => {
    // console.log(cloneElement(children!));
    const divRef = useRef<HTMLDivElement>(null);
    const [, update] = useState({});
    const {current: cache} = useRef({
        isFull: false,
        width: 0,
        height: 0,
        contentDom: null as null | HTMLDivElement,
        cssText: '',
        bodyCssText: '',
        animation: 0.5,
    });

    const toggle = () => {
        const {contentDom, width, height, isFull} = cache;

        if (isFull) {
            contentDom!.style.cssText = cache.cssText;
            setTimeout(() => {
                document.body.style.cssText = cache.bodyCssText;
            }, cache.animation * 1000);
        }
        else {
            document.body.style.cssText = 'overflow:hidden';
            contentDom!.style.position = 'fixed';
            contentDom!.style.width = '100vw';
            contentDom!.style.height = '100vh';
            contentDom!.style.top = '0';
            contentDom!.style.left = '0';
        }

        cache.isFull = !isFull;
        update({});
    };

    useEffect(() => {
        const dom = divRef.current;
        if (!dom) return;

        const contentDom = dom.nextElementSibling as HTMLDivElement;

        contentDom!.style.transition = `${cache.animation}s`;
        cache.bodyCssText = document.body.style.cssText;
        cache.contentDom = contentDom;
        cache.cssText = contentDom!.style.cssText;
        cache.width = contentDom.offsetWidth;
        cache.height = contentDom.offsetHeight;
        update({});
    }, []);

    return (
        <>
            <div ref={divRef} style={cache.isFull ? {width: cache.width, height: cache.height, position: 'relative', zIndex: -1} : {}} />
            {children}
            <div
                className={styles['btn']}
                style={{'--prev-height': '-' + (cache.isFull ? (cache.height) : (cache.height - 30)) + 'px'} as any}
                title="全屏"
                onClick={toggle}
            >{cache.isFull ? '退出' : '全屏'}
            </div>
        </>
    );
};

interface IFullScreenProps {
    children?: JSX.Element;
}


export default FullScreen;