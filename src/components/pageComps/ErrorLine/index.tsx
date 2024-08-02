import React from 'react';

import styles from '../style.module.less';

export default function ErrorLine(props: {showError?: boolean; errorInfo: any; onShowError: any;}) {

    const {showError = false, errorInfo, onShowError} = props;
    return (
        <div className={styles.errorLine} style={{display: showError ? 'flex' : 'none'}}>
            <em>无效或损坏的文件。详细信息： {errorInfo}</em>
            <button onClick={() => onShowError(false)}>关闭</button>
        </div>
    );
}
