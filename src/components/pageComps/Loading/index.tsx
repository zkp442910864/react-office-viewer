import React from 'react';

import styles from '../style.module.less';
import loadingImg from '../../../assets/images/loading-icon.gif';

export default function Loading(props: {showLoading?: boolean;}) {
    const {showLoading = false} = props;
    return (
        <div className={styles.loadingPage} style={{display: showLoading ? 'block' : 'none'}}>
            <div className={styles.loading}><img src={loadingImg} /></div>
        </div>
    );
}
