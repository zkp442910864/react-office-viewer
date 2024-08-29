import React, {useEffect, useState, useRef, useLayoutEffect} from 'react';
import * as XLSX from 'xlsx';
import {HotTable} from '@handsontable/react';
import 'handsontable/dist/handsontable.full.css';
import {MergeCells, registerPlugin} from 'handsontable/plugins';

import styles from './style.module.less';
import {Loading, TitleWithDownload, ErrorLine} from '../pageComps';
import {_getBlobUrlFromBuffer, _download} from '../../utils/utils';

registerPlugin(MergeCells);
export default function XlsxViewer(props: {file: any; fileName?: string; width?: string; height?: string; _fileType?: any; timeout?: number;}) {
    const {file: outFile, fileName: outFileName, height, _fileType, timeout} = props;
    const [data, setData] = useState<Record<string, any[]>>({});
    const [mergeData, setMergeData] = useState<Record<string, any[]>>({});
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
            const data = workbook.Sheets[sheetName];
            const merges = data['!merges'] || [];
            const json = XLSX.utils.sheet_to_json(data, {header: 'A', blankrows: true, defval: ''});
            const mergeCells = merges.reduce((arr, item) => {
                const {s: {c: startCol, r: startRow}, e: {c: endCol, r: endRow}} = item;
                const hasVal = (endCol || endRow) > 0;
                arr.push({col: startCol, row: startRow, colspan: hasVal ? (endCol - startCol + 1) : endCol, rowspan: hasVal ? (endRow - startRow + 1) : endRow});
                return arr;
            }, [] as any);

            // console.log(merges, json, mergeCells);

            setData(data => {
                return {
                    ...data,
                    [subDivId]: json,
                };
            });
            setMergeData(data => {
                return {
                    ...data,
                    [subDivId]: mergeCells,
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
                    // console.log('workbook', workbook);
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
        <div className={styles['wbSheets_wrapper']} id='wbSheets_wrapper_id'>
            <Loading showLoading={showLoading} />
            <ErrorLine errorInfo={errorInfo} showError={showError} onShowError={onShowError} />
            <TitleWithDownload disabled={!fileArrayBuffer} fileName={fileName} handleDownload={handleDownload} />
            <HotTable
                colHeaders={true}
                data={data[activeTabKey] || []}
                height={`calc(${height} - 25px - 38px)`}
                licenseKey="non-commercial-and-evaluation"
                // mergeCells={[
                //     // {col: 0, row: 0, colspan: 5, rowspan: 1},
                //     {col: 0, row: 0, colspan: 5, rowspan: 1},
                //     {col: 0, row: 2, colspan: 1, rowspan: 99},
                //     // {col: 0, row: 0, colspan: 5, rowspan: 0}
                //     // {row: 1, col: 1, rowspan: 3, colspan: 3},
                // ]}
                mergeCells={mergeData[activeTabKey] || []}
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
                style={{flex: 1}}
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