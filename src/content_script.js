'use strict';

const CURRENT_VERSION = '1.0.0';

const STORAGE_KEYS = {
    VERSION: 'apinames_version'
};

const TIPS_POPUP_STYLES = `
  .apinames-tips-popup {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 550px;  /* Increased from 380px */
    padding: 0;
    background: white;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.15);
    z-index: 100000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    overflow: hidden;
    animation: popup-fadeIn 0.3s ease-out;
  }
  
  .apinames-tips-popup-header {
    display: flex;
    align-items: center;
    padding: 20px;
    background: linear-gradient(135deg, #0176d3 0%, #0b5cab 100%);
    color: white;
  }
  
  .apinames-tips-popup-icon {
    width: 32px;
    height: 32px;
    margin-right: 12px;
    border-radius: 6px;
  }
  
  .apinames-tips-popup-title {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 2px;
  }
  
  .apinames-tips-popup-content {
    padding: 20px;
    line-height: 1.5;
    color: #444;
    font-size: 14px;  /* Slightly smaller font */
  }
  
  .apinames-tips-popup-list {
    margin: 15px 0;
    padding: 0;
    list-style: none;
  }
  
  .apinames-tips-popup-list li {
    display: flex;
    margin-bottom: 10px;
    white-space: nowrap;  /* Prevent line breaks */
  }
  
  .apinames-tips-popup-list li::before {
    content: "•";
    color: #0176d3;
    font-weight: bold;
    display: inline-block;
    width: 20px;
    margin-left: -10px;
  }
  
  .apinames-tips-popup-list kbd {
    display: inline-block;
    padding: 3px 6px;
    background: #f3f4f6;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    font-family: monospace;
    font-size: 0.9em;
    margin: 0 4px;
  }
  
  .apinames-tips-popup-footer {
    padding: 15px 20px;
    background: #f8f9fa;
    border-top: 1px solid #eee;
    font-size: 13px;
    color: #666;
    text-align: center;
  }
  
  .apinames-tips-popup-close {
    display: block;
    width: 100%;
    padding: 10px;
    background: #0176d3;
    color: white;
    border: none;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .apinames-tips-popup-close:hover {
    background: #0b5cab;
  }
`;

const EXTENSION_ICON_BASE64 = 'data:image/png;base64,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'; // <-- Add your base64 encoded icon here

const tipsPopup = (() => {
    const checkVersionAndShow = () => {
        chrome.storage.sync.get([STORAGE_KEYS.VERSION], (result) => {
            if (result[STORAGE_KEYS.VERSION] !== CURRENT_VERSION) {
                show();
                chrome.storage.sync.set({[STORAGE_KEYS.VERSION]: CURRENT_VERSION});
            }
        });
    };

    const show = () => {
        const overlay = document.createElement('div');
        overlay.className = 'apinames-tips-popup-overlay';

        const popup = document.createElement('div');
        popup.className = 'apinames-tips-popup';
        popup.innerHTML = `
        <div class="apinames-tips-popup-header">
            <img src="${EXTENSION_ICON_BASE64}" class="apinames-tips-popup-icon" alt="Extension icon">
            <div class="apinames-tips-popup-title">API Name Helper</div>
        </div>
        
        <div class="apinames-tips-popup-content">
            <p style="margin-bottom: 15px; white-space: nowrap;">After clicking the extension icon, API names will appear with copy buttons:</p>
            
            <ul class="apinames-tips-popup-list">
                <li><strong>Click</strong><span style="margin:0 4px">-</span>Copy single API name</li>
                <li><strong>Cmd/Ctrl+Click</strong><span style="margin:0 4px">-</span>Multi-select fields (comma-separated)</li>
                <li><strong>Shift+Cmd/Ctrl+Click</strong><span style="margin:0 4px">-</span>Generate SOQL query</li>
            </ul>
            
            <button class="apinames-tips-popup-close">Got it!</button>
        </div>
        
        <div class="apinames-tips-popup-footer">
            Access this guide anytime via the extension menu
        </div>
    `;

        const closePopup = () => {
            popup.style.animation = 'popup-fadeIn 0.3s ease-out reverse';
            overlay.style.animation = 'overlay-fadeIn 0.3s ease-out reverse';
            setTimeout(() => {
                popup.remove();
                overlay.remove();
            }, 250);
        };

        popup.querySelector('.apinames-tips-popup-close').addEventListener('click', closePopup);
        overlay.addEventListener('click', closePopup);
        popup.addEventListener('click', (e) => e.stopPropagation());

        document.body.appendChild(overlay);
        document.body.appendChild(popup);
    };

    return { checkVersionAndShow };
})();

// ==================== Constants Definition ====================
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
        MAX_WIDTH: 1500,
        LINE_MAX_LENGTH: 175
    },
    BUTTON: {
        SIZE: 18,
        ICON_SIZE: 12
    }
};

// Update the COPY_ICON_SVG to use Salesforce's clipboard icon
const COPY_ICON_SVG = `
  <svg viewBox="0 0 52 52" width="14" height="14" aria-hidden="true">
    <path d="M43,7h-5V5c0-1.6-1.3-2.9-2.9-2.9H5C3.4,2.1,2.1,3.4,2.1,5v30.1c0,1.6,1.3,2.9,2.9,2.9h2v5c0,1.6,1.3,2.9,2.9,2.9h33.1c1.6,0,2.9-1.3,2.9-2.9V9.9C45.9,8.3,44.6,7,43,7z M7.1,35.1V5h28v33.1H7.1z M42.9,45H12V9h5v28.1c0,1.6,1.3,2.9,2.9,2.9H43V45z" 
          fill="currentColor"/>
  </svg>
`;

// Update the APINAMES_STYLES with Salesforce-like styling
const APINAMES_STYLES = `
  .apinames-copy-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.5rem;
    height: 1.5rem;
    margin-left: 0.5rem;
    border: 1px solid #dddbda;
    border-radius: 0.25rem;
    cursor: pointer;
    transition: all 0.15s ease;
    padding: 0;
    vertical-align: middle;
    box-shadow: 0 1px 1px rgba(0,0,0,0.05);
  }

  .lightning-mode .apinames-copy-btn {
    background-color: #f3f2f2 !important;
    border-color: #c9c7c5 !important;
    color: #706e6b !important;
  }

  .lightning-mode .apinames-copy-btn:hover {
    background-color: #eef4ff !important;
    border-color: #1b96ff !important;
    color: #0176d3 !important;
  }

  .lightning-mode .apinames-copy-btn:active {
    background-color: #e1f0ff !important;
    border-color: #0176d3 !important;
  }

  .apinames-copy-btn {
    background-color: #ffffff;
    color: #706e6b;
  }

  .apinames-multi-selected,
  .apinames-query-selected {
    background-color: #eef4ff !important;
    border-color: #1b96ff !important;
    color: #0176d3 !important;
  }

  .apinames-copy-btn svg {
    width: 0.75rem;
    height: 0.75rem;
    pointer-events: none;
  }
`;

// ==================== Style Management ====================
// Add to Style Management section
const styleManager = (() => {
    const injectStyles = () => {
        if (!document.getElementById('apinames-styles')) {
            const style = document.createElement('style');
            style.id = 'apinames-styles';
            style.textContent = APINAMES_STYLES + TIPS_POPUP_STYLES;
            document.head.appendChild(style);
        }
    };

    return { injectStyles };
})();

// ==================== Toast Management ====================
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

// ==================== Copy Management ====================
const copyManager = (() => {
    let state = {
        multiItems: [],
        queryItems: [],
        lastAction: null
    };

    let currentSObjectName = 'UnknownObject'; // Store current object name

    const init = (sObjectName) => {
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

        await generateSOQL(sObjectName); // Ensure completion
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

    const singleCopy = (apiName, event) => {
        navigator.clipboard.writeText(apiName).then(() => {
            toastManager.show(`Copied: ${apiName}`);
            flashButton(event.target);
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

    const generateSOQL = async (sObjectName) => {
        try {
            if (!sObjectName || sObjectName === 'UnknownObject') {
                toastManager.show('⚠️ Invalid object name');
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
            toastManager.show(`✅ SOQL generated:\n${utils.truncateText(soql, STYLE_CONFIG.TOAST.LINE_MAX_LENGTH)}`);
        } catch (err) {
            console.error('SOQL generation failed:', err);
            toastManager.show('❌ Copy failed, please try again');
        }
    };

    const writeToClipboard = async (text) => {
        try {
            // Method 1: Prefer modern API
            await navigator.clipboard.writeText(text);
        } catch (err) {
            // Method 2: Fallback solution
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

    const updateMultiCopyState = () => {
        const text = state.multiItems.join(', ');
        navigator.clipboard.writeText(text);
        toastManager.show(`Multi selection:\n${utils.truncateText(text, STYLE_CONFIG.TOAST.LINE_MAX_LENGTH)}`);
    };

    const resetState = () => {
        state = { multiItems: [], queryItems: [], lastAction: null };
        document.querySelectorAll('.apinames-multi-selected, .apinames-query-selected')
            .forEach(el => el.classList.remove('apinames-multi-selected', 'apinames-query-selected'));
    };

    return { init, handleCopy, resetState };
})();

// ==================== DOM Utilities ====================
const domHelper = {
    createElement: (tag, config) => {
        const el = document.createElement(tag);
        Object.assign(el, config);
        return el;
    },

    createApiContainer: (apiName, isField = true) => {
        const container = domHelper.createElement('div', {
            className: 'apinames-api-container',
            style: `display: ${isField ? 'block' : 'inline-flex'}; margin: ${isField ? '0.25rem 0 0' : '0 0 0 0.5rem'};`
        });

        const textSpan = domHelper.createElement('span', {
            className: 'apinames-api-text',
            textContent: apiName
        });

        container.append(textSpan, domHelper.createCopyButton(apiName));
        return container;
    },

    createCopyButton: (apiName) => {
        const button = document.createElement('button');
        button.className = 'apinames-copy-btn';
        button.innerHTML = COPY_ICON_SVG;
        button.title = 'Copy API Name';
        button.style.cssText = `
      display: inline-flex;
      align-items: center;
      justify-content: center;
    `;

        button.addEventListener('click', (e) => {
            copyManager.handleCopy(apiName, e);
        });

        return button;
    }
};

// ==================== Utility Functions ====================
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

// ==================== Main Logic ====================
const apiNameManager = (() => {
    const init = () => {
        styleManager.injectStyles();
        chrome.runtime.onMessage.addListener(handleMessage);
        document.addEventListener('keyup', handleKeyUp);
        tipsPopup.checkVersionAndShow();
    };

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
            copyManager.init(message.sObjectName); // Initialize name storage
            toggleDisplay({
                isLightning: message.isLightningMode,
                sObjectName: message.sObjectName,
                labelMap: message.labelMap,
                longId: message.longId
            });
        }
    };

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

    // In the injectApiNames function, add the lightning mode class to body
    const injectApiNames = (fieldSelector, objectSelector, sObjectName, labelMap, longId, isLightning) => {
        if (isLightning) {
            document.body.classList.add('lightning-mode');
            processFields(fieldSelector,
                el => el.childNodes.length > 0,
                el => el.firstChild?.innerText,
                labelMap
            );
        } else {
            document.body.classList.remove('lightning-mode');
            processFields(fieldSelector,
                () => true,
                el => el.textContent.split('sfdcPage.')[0],
                labelMap
            );
        }
        addObjectApiName(objectSelector, sObjectName, longId);
    };

    return { init };
})();

// ==================== Initialization ====================
apiNameManager.init();