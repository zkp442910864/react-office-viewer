// 所有可能出现的文件类型 判断结果
export const ALL_FILE_TYPES = [
    'xlsx', 'docx', 'pptx', 'pdf', 'xls', 'ppt', 'txt', 'json', 'md', 'other',
    // doc  'file2003', 'file2007',
];

const fileTypeMap: Record<string, string> = {
    pdf: 'application/pdf',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    json: 'application/json',
    //
    txt: 'text/plain',
    md: 'text/plain',
    default: 'text/plain',
};

const fileTypeMapReverse = Object.entries(fileTypeMap).reduce((map, [key, value]) => {
    if (!['', 'text/plain'].includes(value)) {
        map[value] = key;
    }
    return map;
}, {
    'text/plain': '',
} as Record<string, string>);


// pdf专用的
export async function _getBlobUrl(url: string, pdfDocument: any) {
    if (url.indexOf('blob:') == 0) {
        return url;
    }
    const unit8ArrayData = await pdfDocument.getData();
    const blob = new Blob([unit8ArrayData], {type: 'application/pdf'});
    return _getObjectUrl(blob);
}

export function _getBlobUrlFromBuffer(arrayBuffer: any, fileType: string) {
    const type = fileTypeMap[fileType] || fileTypeMap['default'];
    const blob = new Blob([arrayBuffer], {type});
    return _getObjectUrl(blob);
}

export function _getObjectUrl(file: Blob) {
    let url = null;
    if ((window as any).createObjectURL != undefined) {
        // basic
        url = (window as any).createObjectURL(file);
    } else if (window.webkitURL != undefined) {
        // webkit or chrome
        url = window.webkitURL.createObjectURL(file);
    } else if (window.URL != undefined) {
        // mozilla(firefox)
        url = window.URL.createObjectURL(file);
    }
    return url;
}

/**
 *
 * @param {*} blobUrl
 * @param {*} fileName
 * @param {*} ext 文件后缀名
 */
export function _download(blobUrl: string, fileName: string, ext = 'txt') {
    const a = document.createElement('a');
    const _fileName = fileName || (new Date().toLocaleDateString() + `.${ext}`);
    if (a.click) {
        a.href = blobUrl;
        a.target = '_parent';
        if ('download' in a) {
            a.download = _fileName;
        }
        (document.body || document.documentElement).appendChild(a);
        a.click();
        (document.body || document.documentElement).removeChild(a);
    } else {
        if (window.top === window && blobUrl.split('#')[0] === window.location.href.split('#')[0]) {
            const padCharacter = blobUrl.indexOf('?') === -1 ? '?' : '&';
            blobUrl = blobUrl.replace(/#|$/, padCharacter + '$&');
        }
        window.open(blobUrl, '_parent');
    }
}

// 判断文件类型
// export function getFileTypeFromFileName(fileName: string) {
//     const ext = fileName.split('.').pop()?.toLowerCase();
//     if (ext && ALL_FILE_TYPES.includes(ext)) {
//         return ext;
//     }
//     return 'other';
// }

// 判断文件类型
export function getFileTypeFromUploadType(type: string) {
    return typeof fileTypeMapReverse[type] === 'undefined' ? 'other' : fileTypeMapReverse[type];
}

/** 计算缩放度 */
export const computeZoom = (rawWidth: number, rawHeight: number) => {
    return Math.min(window.innerWidth / rawWidth, window.innerHeight / rawHeight);
};

// 判断文件类型
export function isMediaSource(type: string) {
    const imageMatch = type.match(/^(image)\/(.*)/);
    const videoMatch = type.match(/^(video)\/(.*)/);
    const audioMatch = type.match(/^(audio)\/(.*)/);

    const match = imageMatch
        ? imageMatch
        : (videoMatch ? videoMatch : audioMatch);

    if (!match) return null;

    return {
        type: match[1] as 'image' | 'video' | 'audio',
        suffix: match[2],
    };
}

