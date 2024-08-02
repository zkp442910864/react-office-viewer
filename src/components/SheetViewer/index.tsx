import React, {useEffect, useState, useRef} from 'react';
import * as XLSX from 'xlsx';
import {HotTable} from '@handsontable/react';
import 'handsontable/dist/handsontable.full.css';

import styles from './style.module.less';
import {Loading, TitleWithDownload, ErrorLine} from '../pageComps';
import {_getBlobUrlFromBuffer, _download} from '../../utils/utils';

export default function XlsxViewer(props: {file: any; fileName?: string; width?: string; height?: string; _fileType?: any; timeout?: number;}) {
    const {file: outFile, fileName: outFileName, width, height, _fileType, timeout} = props;
    const [data, setData] = useState<Record<string, any[]>>({});
    const [file, setFile] = useState<File>();
    const [fileArrayBuffer, setFileArrayBuffer] = useState<ArrayBuffer>(); // ArrayBuffer类型的文件
    const [fileName, setFileName] = useState('');
    const [showLoading, setShowLoading] = useState(false);
    const [showError, setShowError] = useState(false);
    const [errorInfo, setErrorInfo] = useState('仅支持File类型的xls/xlsx文件！');
    const [activeTabKey, setActiveTabKey] = useState('');
    const [sheetNames, setSheetNames] = useState<string[]>([]);

    const onShowError = (status: boolean, info?: string) => {
        setShowLoading(false);
        setShowError(status);
        if (info) {
            setErrorInfo(info);
        }
    };

    const loadData = (workbook: XLSX.WorkBook) => {
        const sheetNames = workbook.SheetNames;
        if (sheetNames && sheetNames.length > 0) {
            setSheetNames(sheetNames);
            setActiveTabKey('wbSheets_0');
        }
        sheetNames.forEach(function (sheetName, idx) {
            const subDivId = 'wbSheets_' + idx;
            const json = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {header: 'A', blankrows: false});
            setData(data => {
                return {
                    ...data,
                    [subDivId]: json,
                };
            });
        });
        setShowLoading(false);
    };


    const onChangeTab = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, subDivId: string) => {
        e.preventDefault();
        setActiveTabKey(subDivId);
    };

    const handleDownload = () => {
        const fileUrl = _getBlobUrlFromBuffer(fileArrayBuffer, _fileType);
        _download(fileUrl, fileName, _fileType);
    };

    useEffect(() => {
        setFile(outFile);
    }, [outFile]);

    useEffect(() => {
        if (outFileName) {
            setFileName(outFileName);
        }
    }, [outFileName]);

    useEffect(() => {
        if (file) {
            onShowError(false);
            setShowLoading(true);
            if (file instanceof File) {
                const fName = file.name;
                const reader = new FileReader();
                reader.readAsArrayBuffer(file);
                reader.onload = e => {
                    setFileName(fName);
                    const data = e.target!.result;
                    setFileArrayBuffer(data as ArrayBuffer);
                    const workbook = XLSX.read(data, {type: 'array'});
                    // console.log('workbook', workbook)
                    loadData(workbook);
                };

                // } else {
                //     onShowError(true)
                // }
            } else {
                onShowError(true);
            }

        } else {
            //
        }
    }, [file]);

    return (
        <div className={styles['wbSheets_wrapper']} id='wbSheets_wrapper_id' style={{width: width || '100%', overflow: 'hidden'}}>
            <Loading showLoading={showLoading} />
            <ErrorLine errorInfo={errorInfo} showError={showError} onShowError={onShowError} />
            <TitleWithDownload disabled={!fileArrayBuffer} fileName={fileName} handleDownload={handleDownload} />
            <HotTable
                colHeaders={true}
                data={data[activeTabKey] || []}
                height={height || document.body.offsetHeight - 45 + 'px'}
                licenseKey="non-commercial-and-evaluation"
                readOnly={true}
                rowHeaders={true}
                settings={{
                // columns: [{editor: false}],
                    fixedColumnsLeft: 0,
                    fixedRowsTop: 0,
                    stretchH: 'none',
                    colWidths: 200,
                    startRows: 1,
                    startCols: 1,
                    wordWrap: true,
                    autoRowSize: true,
                    autoColumnSize: true,
                }}
                title={fileName}
                width="100%"
            />
            <ul className={styles['wbSheets_clas_ul']}>
                {
                    sheetNames.map((item, index) => (
                        <li className={activeTabKey == 'wbSheets_' + index ? styles['selected'] : ''} key={item}>
                            <a href={'wbSheets_' + index} onClick={(e) => onChangeTab(e, 'wbSheets_' + index)}>{item}</a>
                        </li>
                    ))
                }
            </ul>
        </div>
    );
}