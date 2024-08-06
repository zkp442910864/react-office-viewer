import React, {cloneElement, FC, useEffect, useRef, useState} from 'react';

import styles from './index.module.less';

const FullScreen: FC<IFullScreenProps> = ({
    children,
    open,
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
        offsetTop: 0,
        zIndex: 99999,
    });

    const toggle = () => {
        const {contentDom, width, height, isFull} = cache;

        if (isFull) {
            // 退出
            contentDom!.style.cssText = cache.cssText;
            contentDom!.style.pointerEvents = 'none';
            setTimeout(() => {
                document.body.style.cssText = cache.bodyCssText;
            }, cache.animation * 1000);
        }
        else {
            // 全屏
            document.body.style.cssText = 'overflow:hidden';
            contentDom!.style.position = 'fixed';
            contentDom!.style.width = '100vw';
            contentDom!.style.height = '100vh';
            contentDom!.style.top = '0';
            contentDom!.style.left = '0';
            contentDom!.style.zIndex = cache.zIndex + '';
        }

        cache.isFull = !isFull;
        update({});
    };

    useEffect(() => {
        if (!open) return;

        const dom = divRef.current;
        if (!dom) return;

        const contentDom = dom.nextElementSibling as HTMLDivElement;

        contentDom!.style.transition = `${cache.animation}s`;

        cache.bodyCssText = document.body.style.cssText;
        cache.contentDom = contentDom;
        cache.cssText = contentDom!.style.cssText;
        cache.width = contentDom.offsetWidth;
        cache.height = contentDom.offsetHeight;
        cache.offsetTop = contentDom.offsetTop;

        // 这一步要放最后，
        contentDom!.style.pointerEvents = 'none';
        update({});
    }, []);

    return (
        <>
            <div ref={divRef} style={cache.isFull ? {width: cache.width, height: cache.height, position: 'relative', zIndex: -1} : {}} />
            {children}
            {
                open
                    ? (
                        <div
                            className={styles['btn']}
                            style={{
                                top: cache.isFull ? 50 : cache.offsetTop + 50,
                                position: cache.isFull ? 'fixed' : 'absolute',
                                zIndex: cache.isFull ? (cache.zIndex + 1) : '',
                            }}
                            title="全屏"
                            onClick={toggle}
                        >{cache.isFull ? '退出' : '全屏'}
                        </div>
                    )
                    : ''
            }
        </>
    );
};

interface IFullScreenProps {
    children?: JSX.Element;
    /** 全屏功能开启 */
    open?: boolean;
}


export default FullScreen;