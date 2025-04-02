'use strict';

function appendSpanToElement(el, content, isBelow) {
    const span = document.createElement('span');
    span.textContent = content;
    span.className = 'apinames-script-element';
    span.style = isBelow
        ? 'display: block; font-weight: normal; color: #A9A9A9; margin: 3px 0 5px;'
        : 'display: inline-table; margin-left: 1rem;';
    el.appendChild(span);
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
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
        appendSpansToElement(elements[elements.length - 1], [apiName, longId]);
    }
}

function addFieldAPIName(selector, filter, labelExtractor, labelMap) {
    const elements = document.querySelectorAll(selector);
    const labelCounts = {};

    elements.forEach(el => {
        if (filter(el)) {
            const label = labelExtractor(el);
            const apiName = findApiName(label, labelCounts, labelMap);
            if (apiName) appendSpanToElement(el, apiName, true);
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

async function toggleAPIDisplay(isLightning, sObjectName, labelMap, longId) {
    window.showAPINameScript = window.showAPINameScript || { isOn: false };

    const elements = document.querySelectorAll('.apinames-script-element, .apinames-script-container');
    if (window.showAPINameScript.isOn) {
        elements.forEach(el => el.remove());
    } else {
        if (isLightning) {
            addFieldAPIName(
                '.test-id__field-label-container.slds-form-element__label',
                el => el.childNodes.length > 0,
                el => el.firstChild?.innerText,
                labelMap
            );
            addObjectAPIName('.entityNameTitle', sObjectName, longId);
        } else {
            addFieldAPIName(
                '.labelCol',
                () => true,
                el => el.textContent.split('sfdcPage.')[0],
                labelMap
            );
            addObjectAPIName('.pageType', sObjectName, longId);
        }
    }
    window.showAPINameScript.isOn = !window.showAPINameScript.isOn;
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