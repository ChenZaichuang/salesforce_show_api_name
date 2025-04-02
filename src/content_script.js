'use strict';

// ==================== 常量定义 ====================
const SELECTORS = {
    LIGHTNING: {
        FIELD_LABEL: '.test-id__field-label-container.slds-form-element__label',
        OBJECT_TITLE: '.slds-page-header__title'
    },
    CLASSIC: {
        FIELD_LABEL: '.labelCol',
        OBJECT_TITLE: '.pageType'
    }
};

const STYLE_CONFIG = {
    TOAST: {
        MAX_WIDTH: 300,
        LINE_MAX_LENGTH: 35
    },
    BUTTON: {
        SIZE: 18,
        ICON_SIZE: 12
    }
};

const COPY_ICON_SVG = `
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M8 17H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3m4 4v6a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2z"/>
  </svg>
`;

const APINAMES_STYLES = `
  @keyframes toast-fadeInOut {
    0% { opacity: 0; transform: translateY(10px); }
    10% { opacity: 1; transform: translateY(0); }
    90% { opacity: 1; transform: translateY(0); }
    100% { opacity: 0; transform: translateY(-10px); }
  }
  .apinames-api-container {
    display: block;
    margin: 3px 0 5px;
    line-height: 1.4;
    display: flex !important;
    align-items: center !important;
  }
  .apinames-api-text {
    color: #A9A9A9;
    font-family: monospace;
    font-size: 0.9em;
  }
  .apinames-copy-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    margin-left: 5px;
    border: 1px solid #ddd;
    border-radius: 3px;
    cursor: pointer;
    opacity: 0.7;
    transition: all 0.2s;
  }
  /* 其他样式保持原有内容 */
`;

// ==================== 样式管理 ====================
const styleManager = (() => {
    const injectStyles = () => {
        if (!document.getElementById('apinames-styles')) {
            const style = document.createElement('style');
            style.id = 'apinames-styles';
            style.textContent = APINAMES_STYLES;
            document.head.appendChild(style);
        }
    };

    return { injectStyles };
})();

// ==================== Toast 管理 ====================
const toastManager = (() => {
    const show = (message) => {
        removeExistingToast();
        const toast = createToastElement(message);
        document.body.appendChild(toast);
        autoRemoveToast(toast);
    };

    const removeExistingToast = () => {
        document.getElementById('apinames-toast')?.remove();
    };

    const createToastElement = (message) => {
        const toast = document.createElement('div');
        toast.id = 'apinames-toast';
        toast.innerHTML = formatToastContent(message);
        Object.assign(toast.style, getToastStyle());
        return toast;
    };

    const formatToastContent = (message) => message.split('\n')
        .map(line => createToastLine(line))
        .join('');

    const createToastLine = (line) => `
    <div class="toast-line" title="${utils.escapeHtml(line)}">
      ${utils.truncateText(line, STYLE_CONFIG.TOAST.LINE_MAX_LENGTH)}
    </div>
  `;

    const getToastStyle = () => ({
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        padding: '12px 16px',
        background: 'rgba(0, 0, 0, 0.85)',
        color: 'white',
        borderRadius: '4px',
        zIndex: '99999',
        maxWidth: `${STYLE_CONFIG.TOAST.MAX_WIDTH}px`,
        fontSize: '13px',
        lineHeight: '1.4',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        animation: 'toast-fadeInOut 2.5s ease-in-out'
    });

    const autoRemoveToast = (toast) => {
        setTimeout(() => toast.remove(), 2500);
    };

    return { show };
})();

// ==================== 复制管理 ====================
const copyManager = (() => {
    let state = {
        multiItems: [],
        queryItems: [],
        lastAction: null
    };

    let currentSObjectName = 'UnknownObject'; // 新增存储

    const init = (sObjectName) => { // 新增初始化方法
        currentSObjectName = sObjectName;
    };

    const handleCopy = (apiName, event) => {
        event.preventDefault();
        event.stopPropagation();

        const isMulti = event.metaKey || event.ctrlKey;
        const isQuery = event.shiftKey;

        if (isQuery && isMulti) {
            handleQuerySelection(apiName, event.target, currentSObjectName);
        } else if (isMulti) {
            handleMultiSelection(apiName, event.target, currentSObjectName);
        } else {
            singleCopy(apiName, event);
        }
    };

    const handleQuerySelection = async (apiName, target, sObjectName) => {
        const wasSelected = target.classList.contains('apinames-query-selected');
        target.classList.toggle('apinames-query-selected', !wasSelected);

        state.queryItems = wasSelected
            ? state.queryItems.filter(v => v !== apiName)
            : [...state.queryItems, apiName];

        await generateSOQL(sObjectName); // 确保等待完成
        state.lastAction = 'query';
    };

    const handleMultiSelection = (apiName, target) => {
        const wasSelected = target.classList.contains('apinames-multi-selected');
        target.classList.toggle('apinames-multi-selected');

        if (!wasSelected) {
            state.multiItems.push(apiName);
        } else {
            state.multiItems = state.multiItems.filter(v => v !== apiName);
        }
        updateMultiCopyState();
        state.lastAction = 'multi';
    };

    const singleCopy = (apiName, event) => { // ✅ 接收 event 参数
        navigator.clipboard.writeText(apiName).then(() => {
            toastManager.show(`Copied: ${apiName}`);
            flashButton(event.target); // ✅ 现在 event 已定义
            resetState();
        }).catch(err => {
            console.error('Copy failed:', err);
            toastManager.show('Copy failed!');
        });
    };

    const flashButton = (btn) => {
        btn.animate([
            { backgroundColor: 'rgba(0, 255, 0, 0.3)' },
            { backgroundColor: 'transparent' }
        ], { duration: 500 });
    };

    const generateSOQL = async (sObjectName) => {  // 接收明确参数
        try {
            if (!sObjectName || sObjectName === 'UnknownObject') {
                toastManager.show('⚠️ 无效的对象名称');
                return;
            }

            const fields = [...new Set(state.queryItems)];
            if (fields.length === 0) {
                await navigator.clipboard.writeText('');
                return;
            }

            const soql = `SELECT ${fields.map(f =>
                f.includes(' ') ? `"${f}"` : f
            ).join(', ')} FROM ${sObjectName}`;

            await writeToClipboard(soql);
            toastManager.show(`✅ SOQL已生成:\n${utils.truncateText(soql, 45)}`);
        } catch (err) {
            console.error('SOQL生成失败:', err);
            toastManager.show('❌ 复制失败，请重试');
        }
    };

    const writeToClipboard = async (text) => {
        try {
            // 方法1：优先使用现代API
            await navigator.clipboard.writeText(text);
        } catch (err) {
            // 方法2：降级方案
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            document.body.appendChild(textarea);
            textarea.select();

            try {
                document.execCommand('copy');
            } finally {
                document.body.removeChild(textarea);
            }
        }
    };

    // const formatField = (field) => field.includes(' ') ? `"${field}"` : field;

    const updateMultiCopyState = () => {
        const text = state.multiItems.join(', ');
        navigator.clipboard.writeText(text);
        toastManager.show(`Multi selection:\n${utils.truncateText(text)}`);
    };

    const resetState = () => {
        state = { multiItems: [], queryItems: [], lastAction: null };
        document.querySelectorAll('.apinames-multi-selected, .apinames-query-selected')
            .forEach(el => el.classList.remove('apinames-multi-selected', 'apinames-query-selected'));
    };

    return { init, handleCopy, resetState };
})();

// ==================== DOM 工具 ====================
const domHelper = {
    createElement: (tag, config) => {
        const el = document.createElement(tag);
        Object.assign(el, config);
        return el;
    },

    createApiContainer: (apiName, isField = true) => {
        const container = domHelper.createElement('div', {
            className: 'apinames-api-container',
            style: `display: ${isField ? 'block' : 'inline-flex'}; margin: ${isField ? '3px 0 5px' : '0 0 0 10px'};`
        });

        const textSpan = domHelper.createElement('span', {
            className: 'apinames-api-text',
            textContent: apiName
        });

        container.append(textSpan, domHelper.createCopyButton(apiName));
        return container;
    },

    createCopyButton: (apiName) => {
        const button = domHelper.createElement('button', {
            className: 'apinames-copy-btn',
            innerHTML: COPY_ICON_SVG,
            onclick: (e) => copyManager.handleCopy(apiName, e),
            style: `
                width: 22px;
                height: 22px;
                padding: 3px;
              `
        });

        Object.assign(button.style, {
            width: `${STYLE_CONFIG.BUTTON.SIZE}px`,
            height: `${STYLE_CONFIG.BUTTON.SIZE}px`
        });

        return button;
    }
};

// ==================== 工具函数 ====================
const utils = {
    escapeHtml: (str) => str.replace(/</g, '&lt;').replace(/>/g, '&gt;'),

    truncateText: (text, maxLength = 35) =>
        text.length > maxLength ? `…${text.slice(-maxLength)}` : text,

    getSObjectName: () => {
        const selector = `${SELECTORS.LIGHTNING.OBJECT_TITLE}, ${SELECTORS.CLASSIC.OBJECT_TITLE}`;
        return document.querySelector(selector)?.textContent?.split(':')[0]?.trim() || 'UnknownObject';
    },

    isAPINameVisible: () => document.querySelector('.apinames-api-container') !== null,

    removeAllApiElements: () => {
        document.querySelectorAll('.apinames-api-container, .apinames-script-container')
            .forEach(el => el.remove());
    }
};

// ==================== 主逻辑 ====================
const apiNameManager = (() => {
    const processFields = (selector, filter, labelExtractor, labelMap) => {
        const elements = document.querySelectorAll(selector);
        const labelCounts = {};

        elements.forEach(el => {
            if (!filter(el)) return;

            const label = labelExtractor(el);
            const apiName = findApiName(label, labelCounts, labelMap);
            if (apiName) {
                removeExistingApiElement(el);
                appendApiElement(el, apiName);
            }
        });
    };

    const findApiName = (label, counts, { labelMap, assistLabelMap }) => {
        counts[label] = (counts[label] || -1) + 1;
        return labelMap?.[label]?.[counts[label]] || assistLabelMap?.[label];
    };

    const removeExistingApiElement = (el) => {
        el.closest('.slds-form-element__item, .dataCol')
            ?.querySelector('.apinames-api-container')
            ?.remove();
    };

    const appendApiElement = (el, apiName) => {
        const container = domHelper.createApiContainer(apiName);
        const fieldContainer = el.closest('.slds-form-element__control, .labelCol') || el;
        fieldContainer.appendChild(container);
    };

    const addObjectApiName = (selector, sObjectName, longId) => {
        const titleElements = document.querySelectorAll(selector);
        if (titleElements.length === 0) return;

        const titleEl = titleElements[titleElements.length - 1];
        titleEl.querySelectorAll('.apinames-script-container').forEach(el => el.remove());

        const container = domHelper.createElement('div', {
            className: 'apinames-script-container',
            style: 'display: inline-block; margin-left: 10px;'
        });

        container.append(domHelper.createApiContainer(sObjectName, false));
        if (longId) container.append(domHelper.createApiContainer(longId, false));

        titleEl.style.position = 'relative';
        titleEl.appendChild(container);
    };

    const handleKeyUp = (e) => {
        if (['Meta', 'Control', 'Shift'].includes(e.key)) {
            copyManager.resetState();
        }
    };

    const handleMessage = (message) => {
        if (message.command === 'showApiName') {
            copyManager.init(message.sObjectName); // 初始化名称存储
            toggleDisplay({
                isLightning: message.isLightningMode,
                sObjectName: message.sObjectName, // 直接传递
                labelMap: message.labelMap,
                longId: message.longId
            });
        }
    };

    // 保持参数结构一致
    const toggleDisplay = ({ isLightning, sObjectName, labelMap, longId }) => {
        if (utils.isAPINameVisible()) {
            utils.removeAllApiElements();
        } else {
            const mode = isLightning ? 'LIGHTNING' : 'CLASSIC';
            injectApiNames(
                SELECTORS[mode].FIELD_LABEL,
                SELECTORS[mode].OBJECT_TITLE,
                sObjectName,
                labelMap,
                longId,
                isLightning
            );
        }
    };

    const injectApiNames = (fieldSelector, objectSelector, sObjectName, labelMap, longId, isLightning) => {
        if (isLightning) {
            processFields(fieldSelector,
                el => el.childNodes.length > 0,
                el => el.firstChild?.innerText,
                labelMap
            );
        } else {
            processFields(fieldSelector,
                () => true,
                el => el.textContent.split('sfdcPage.')[0],
                labelMap
            );
        }
        addObjectApiName(objectSelector, sObjectName, longId);
    };

    const init = () => {
        styleManager.injectStyles();
        chrome.runtime.onMessage.addListener(handleMessage);
        document.addEventListener('keyup', handleKeyUp);
    };

    return { init };
})();

// ==================== 初始化 ====================
apiNameManager.init();