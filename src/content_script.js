// content_script.js
'use strict';


// 显示操作提示（新增）
function showToast(message) {
    // 移除旧Toast防止重复
    const oldToast = document.getElementById('apinames-toast');
    oldToast?.remove();

    const toast = document.createElement('div');
    toast.id = 'apinames-toast';

    // 处理多行消息
    toast.innerHTML = message.split('\n').map(line => {
        const isLong = line.length > 35; // 超过35字符视为长文本
        return `
            <div class="toast-line" title="${escapeHtml(line)}">
                ${isLong ? '…' + line.slice(-35) : line}
            </div>
        `;
    }).join('');

    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 16px;
        background: rgba(0, 0, 0, 0.85);
        color: white;
        border-radius: 4px;
        z-index: 99999;
        max-width: 300px;
        font-size: 13px;
        line-height: 1.4;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: toast-fadeInOut 2.5s ease-in-out;
    `;

    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
}

function escapeHtml(str) {
    return str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// 在 content_script.js 开头添加
const APINAMES_STYLES = `
    /* 容器样式 */
    @keyframes toast-fadeInOut {
        0% { opacity: 0; transform: translateY(10px); }
        10% { opacity: 1; transform: translateY(0); }
        90% { opacity: 1; transform: translateY(0); }
        100% { opacity: 0; transform: translateY(-10px); }
    }
    .toast-line {
        margin: 4px 0;
    }
    .toast-line:first-child {
        font-weight: bold;
    }

    .apinames-api-container {
        display: block;
        margin: 3px 0 5px;
        line-height: 1.4;
    }

    /* API文本样式 */
    .apinames-api-text {
        color: #A9A9A9;
        font-weight: normal;
        font-family: monospace;
        font-size: 0.9em;
    }

    /* 复制按钮样式 */
    .apinames-copy-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 18px;
        height: 18px;
        margin-left: 5px;
        padding: 2px;
        background: none;
        border: 1px solid #ddd;
        border-radius: 3px;
        cursor: pointer;
        opacity: 0.7;
        transition: all 0.2s;
    }

    .apinames-copy-btn:hover {
        opacity: 1;
        background: #f0f0f0;
    }

    .apinames-copy-btn svg {
        width: 12px;
        height: 12px;
    }

    /* 选中状态 */
    .apinames-multi-selected {
        border-color: #2196F3 !important;
    }

    .apinames-query-selected {
        border-color: #4CAF50 !important;
        background: rgba(76, 175, 80, 0.1) !important;
    }
    
    .toast-line {
        /* 保持原有样式 */
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        direction: rtl; /* 从右向左显示 */
        text-align: left;
        unicode-bidi: plaintext;
    }
    
    /* 鼠标悬停时显示完整内容 */
    .toast-line:hover {
        overflow: visible;
        white-space: normal;
        background: rgba(0,0,0,0.9);
        max-height: none;
    }
    
    .toast-line:not(:first-child) {
        color: rgba(255,255,255,0.8);
        font-size: 0.9em;
        border-top: 1px solid rgba(255,255,255,0.1);
        margin-top: 6px;
        padding-top: 6px;
    }
`;

function injectStyles() {
    if (!document.getElementById('apinames-styles')) {
        const style = document.createElement('style');
        style.id = 'apinames-styles';
        style.textContent = APINAMES_STYLES;
        document.head.appendChild(style);
    }
}
injectStyles();

// 状态管理（保持不变）
let currentContext = { sObjectName: null };
let copyState = { multiItems: [], queryItems: [], lastAction: null };

// 添加复制按钮和处理器
function createCopyButton(apiName) {
    const btn = document.createElement('button');
    btn.className = 'apinames-copy-btn';
    // 使用SVG图标（更清晰）
    btn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M8 17H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3m4 4v6a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2z"/>
        </svg>
    `;
    btn.style.cssText = `
        margin-left: 5px;
        cursor: pointer;
        background: none;
        border: none;
        padding: 2px;
        width: 18px;
        height: 18px;
        vertical-align: middle;
    `;

    // 状态管理
    let isSelected = false;
    let selectionType = null;

    // 鼠标悬停效果
    btn.addEventListener('mouseenter', () => btn.style.opacity = '1');
    btn.addEventListener('mouseleave', () => {
        if (!isSelected) btn.style.opacity = '0.6'
    });

    // 点击处理
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const isMulti = e.metaKey || e.ctrlKey;
        const isQueryMode = e.shiftKey && isMulti;

        // 初始状态处理
        if ((isMulti || isQueryMode) && !copyState.lastAction) {
            navigator.clipboard.writeText('');
            showToast('Multi-select mode activated');
        }

        if (isQueryMode) {
            const wasSelected = btn.classList.contains('apinames-query-selected');
            btn.classList.toggle('apinames-query-selected');

            if (!wasSelected) {
                if (copyState.queryItems.length === 0) {
                    navigator.clipboard.writeText(`SELECT ${apiName}`);
                    showToast(`SOQL started: SELECT ${apiName}`);
                }
                handleQuerySelection(apiName, true);
            } else {
                handleQuerySelection(apiName, false);
                showToast(`Removed: ${apiName}`);
            }

        } else if (isMulti) {
            const wasSelected = btn.classList.contains('apinames-multi-selected');
            btn.classList.toggle('apinames-multi-selected');

            if (!wasSelected) {
                if (copyState.multiItems.length === 0) {
                    navigator.clipboard.writeText(apiName);
                    showToast(`Copied: ${apiName}`);
                }
                handleMultiCopy(apiName, true);
            } else {
                handleMultiCopy(apiName, false);
            }

        } else {
            navigator.clipboard.writeText(apiName).then(() => {
                showToast(`Copied: ${apiName}`);
                flashButton(btn);
                resetStates();
            });
        }
    });

    return btn;
}

function truncateText(text, maxLength = 35) {
    return text.length > maxLength ? '…' + text.slice(-maxLength) : text;
}

// 处理多选复制
function handleMultiCopy(value, isAdd) {
    if (isAdd) {
        copyState.multiItems.push(value);
        if (copyState.multiItems.length === 1) {
            navigator.clipboard.writeText(value);
            showToast(`Copied: ${value}`); // 第一个字段提示
        } else {
            const text = copyState.multiItems.join(', ');
            navigator.clipboard.writeText(text);
            showToast(`Added: ${value}\nCurrent: ${text}`); // 后续字段提示
        }
    } else {
        copyState.multiItems = copyState.multiItems.filter(v => v !== value);
        const text = copyState.multiItems.join(', ');
        navigator.clipboard.writeText(text || '');
        showToast(`Removed: ${value}\nCurrent: ${text || '(empty)'}`); // 移除字段提示
    }
    copyState.lastAction = 'multi';

    if (isAdd) {
        // 添加时的提示
        const displayText = copyState.multiItems.length > 1
            ? truncateText(copyState.multiItems.join(', '))
            : value;
        showToast(`Added: ${value}\nCurrent: ${displayText}`);
    } else {
        // 移除时的提示
        const displayText = copyState.multiItems.length > 0
            ? truncateText(copyState.multiItems.join(', '))
            : '(empty)';
        showToast(`Removed: ${value}\nCurrent: ${displayText}`);
    }
}

// 处理查询生成
function handleQuerySelection(value, isAdd) {
    if (isAdd) {
        copyState.queryItems.push(value);
        // 从第二个字段开始自动更新SOQL
        if (copyState.queryItems.length > 1) {
            generateSOQL();
        }
    } else {
        copyState.queryItems = copyState.queryItems.filter(v => v !== value);
        if (copyState.queryItems.length > 0) {
            generateSOQL();
        } else {
            navigator.clipboard.writeText('');
        }
    }
    copyState.lastAction = 'query';
}

// 全局事件监听
document.addEventListener('keyup', (e) => {
    if (e.key === 'Meta' || e.key === 'Control' || e.key === 'Shift') {
        if (copyState.lastAction === 'query' && copyState.queryItems.length > 0) {
            generateSOQL(); // 现在可以访问currentContext
        }
        resetStates();
    }
});

// 生成SOQL语句
function generateSOQL() {
    if (!currentContext.sObjectName) {
        currentContext.sObjectName = document.querySelector('.slds-page-header__title, .pageType')
            ?.textContent?.split(':')[0]?.trim() || 'UnknownObject';
    }

    const fields = [...new Set(copyState.queryItems)];
    if (fields.length === 0) return;

    // 自动格式化字段列表（新增）
    const formattedFields = fields.map(f =>
        f.includes(' ') ? `"${f}"` : f
    ).join(', ');

    const soql = `SELECT ${formattedFields} FROM ${currentContext.sObjectName}`;
    navigator.clipboard.writeText(soql);
    showToast(`SOQL copied: ${soql}`);

    const displaySOQL = truncateText(soql, 40);
    showToast(`SOQL generated:\n${displaySOQL}`);
}

// 重置状态
function resetStates() {
    copyState = { multiItems: [], queryItems: [], lastAction: null };
    document.querySelectorAll('.apinames-multi-selected, .apinames-query-selected')
        .forEach(el => {
            el.classList.remove('apinames-multi-selected', 'apinames-query-selected');
            el.style.opacity = '0.6';
        });
}

// 按钮反馈动画
function flashButton(btn) {
    btn.animate([
        { background: 'rgba(0,255,0,0.2)' },
        { background: 'transparent' }
    ], {
        duration: 500,
        iterations: 1
    });
}

function appendApiNameElement(parentEl, apiName, isField = true) {
    const container = document.createElement('div');
    container.className = 'apinames-api-container';
    container.style.cssText = `
        display: ${isField ? 'block' : 'inline-flex'};
        margin: ${isField ? '3px 0 5px' : '0 0 0 10px'};
        align-items: center;
    `;

    const textSpan = document.createElement('span');
    textSpan.textContent = apiName;
    textSpan.className = 'apinames-api-text';
    textSpan.style.cssText = `
        color: #A9A9A9;
        font-weight: normal;
        font-family: ${isField ? 'monospace' : 'inherit'};
        font-size: 0.9em;
        margin-right: 5px;
    `;

    container.appendChild(textSpan);
    container.appendChild(createCopyButton(apiName));

    // 字段API名称插入到标签下方，对象API名称插入到标题旁边
    if (isField) {
        const fieldContainer = parentEl.closest('.slds-form-element__control, .labelCol') || parentEl;
        fieldContainer.appendChild(container);
    } else {
        parentEl.appendChild(container);
    }
}


// 修改后的 appendSpanToElement
function appendSpanToElement(el, apiName, isBelow) {
    const container = document.createElement('div');
    container.className = 'apinames-api-container';
    container.style.cssText = `
        display: block;
        margin-top: 3px;
        margin-bottom: 5px;
    `;

    const textSpan = document.createElement('span');
    textSpan.textContent = apiName;
    textSpan.className = 'apinames-api-text';
    textSpan.style.cssText = `
        color: #A9A9A9;
        font-weight: normal;
        margin-right: 5px;
    `;

    container.appendChild(textSpan);
    container.appendChild(createCopyButton(apiName));

    // 如果是字段API名称，插入到标签下方
    if (isBelow) {
        const fieldContainer = el.closest('.slds-form-element__control, .labelCol');
        fieldContainer?.appendChild(container);
    } else {
        el.appendChild(container);
    }
}

function appendSpansToElement(el, contents) {
    const container = document.createElement('div');
    container.className = 'apinames-script-container';
    container.style = 'position: absolute; display: inline-block; color: #A9A9A9;';
    contents.forEach(content => appendSpanToElement(container, content, false));
    el.style.position = 'relative';
    el.appendChild(container);
}


function addObjectAPIName(selector, apiName, longId) {
    const titleElements = document.querySelectorAll(selector);
    if (titleElements.length > 0) {
        const titleEl = titleElements[titleElements.length - 1];

        // 清除旧的内容
        const oldContainers = titleEl.querySelectorAll('.apinames-script-container');
        oldContainers.forEach(el => el.remove());

        // 创建新的容器
        const container = document.createElement('div');
        container.className = 'apinames-script-container';
        container.style.cssText = `
            display: inline-block;
            margin-left: 10px;
            vertical-align: middle;
        `;

        // 添加API名称和ID
        appendApiNameElement(container, apiName, false);
        if (longId) appendApiNameElement(container, longId, false);

        titleEl.style.position = 'relative';
        titleEl.appendChild(container);
    }
}

function addFieldAPIName(selector, filter, labelExtractor, labelMap) {
    const elements = document.querySelectorAll(selector);
    const labelCounts = {};

    elements.forEach(el => {
        if (filter(el)) {
            const label = labelExtractor(el);
            const apiName = findApiName(label, labelCounts, labelMap);
            if (apiName) {
                // 先移除已存在的API显示
                const existing = el.closest('.slds-form-element__item, .dataCol')?.querySelector('.apinames-api-container');
                existing?.remove();

                appendApiNameElement(el, apiName);
            }
        }
    });
}

function findApiName(label, counts, { labelMap, assistLabelMap }) {
    counts[label] = (counts[label] || -1) + 1;

    if (labelMap?.[label]?.[counts[label]]) {
        return labelMap[label][counts[label]];
    }
    if (assistLabelMap?.[label]) {
        return assistLabelMap[label];
    }
    if (label.toLowerCase().includes('currency')) {
        return 'CurrencyIsoCode';
    }
    return null;
}

function isAPINameVisible() {
    return document.querySelector('.apinames-script-element') !== null;
}

function toggleAPIDisplay(isLightning, sObjectName, labelMap, longId) {
    currentContext.sObjectName = sObjectName;

    if (isAPINameVisible()) {
        document.querySelectorAll('.apinames-api-container, .apinames-script-container')
            .forEach(el => el.remove());
    } else {
        if (isLightning) {
            // Lightning模式
            addFieldAPIName(
                '.test-id__field-label-container.slds-form-element__label',
                el => el.childNodes.length > 0,
                el => el.firstChild?.innerText,
                labelMap
            );
            addObjectAPIName('.slds-page-header__title', sObjectName, longId);
        } else {
            // Classic模式
            addFieldAPIName(
                '.labelCol',
                () => true,
                el => el.textContent.split('sfdcPage.')[0],
                labelMap
            );
            addObjectAPIName('.pageType', sObjectName, longId);
        }
    }
}

chrome.runtime.onMessage.addListener((message) => {
    if (message.command === 'showApiName') {
        toggleAPIDisplay(
            message.isLightningMode,
            message.sObjectName,
            message.labelMap,
            message.longId
        );
    }
});