'use strict';

function appendSpanToElement(el, content, toBelow) {
    let apiElement = document.createElement('span');
    apiElement.textContent = content;
    if (toBelow) {
        apiElement.className = "apinames-script-class";
        apiElement.style = 'display: block;font-weight: normal;color: #A9A9A9;margin-top: 3px;margin-bottom: 5px;';
    } else {
        apiElement.style = 'display: inline-table; margin-left: 1rem';
    }
    el.appendChild(apiElement);
}

function appendSpansToElement(el, contentArray) {
    let divElement = document.createElement('div');
    divElement.style = 'position: absolute; display: inline-block; font-weight: normal;color: #A9A9A9;';
    divElement.className = "apinames-script-class";
    for (let content of contentArray) {
        appendSpanToElement(divElement, content, false);
    }
    el.style.position = 'relative';
    el.appendChild(divElement);
}

function addObjectAPIName(objectClass, objectAPIName, longId) {
    let objectLabelElements = document.querySelectorAll(objectClass);
    if (objectLabelElements.length > 0) {
        let objectLabelElement = objectLabelElements[objectLabelElements.length - 1];
        appendSpansToElement(objectLabelElement, [objectAPIName, longId])
    }
}

function addFieldAPIName(fieldClass, filter, getFieldFunc, labelMap) {
    let fieldElements = document.querySelectorAll(fieldClass);
    let labelShowTimes = {};
    Array.prototype.map.call(fieldElements, el => {
        if (filter(el)) {
            let fieldLabel = getFieldFunc(el);
            if (labelMap.labelMap[fieldLabel] != null) {
                labelShowTimes[fieldLabel] = labelShowTimes[fieldLabel] !== undefined ? labelShowTimes[fieldLabel] + 1 : 0;
                appendSpanToElement(el, labelMap.labelMap[fieldLabel][labelShowTimes[fieldLabel]], true);
            } else if (labelMap.assistLabelMap[fieldLabel] != null) {
                appendSpanToElement(el, labelMap.assistLabelMap[fieldLabel], true);
            } else if (fieldLabel.toLowerCase().includes('currency')) {
                appendSpanToElement(el, 'CurrencyIsoCode', true);
            }
        }
    })
}

async function replaceWithAPINames(isLightningMode, sObjectName, labelMap, longId) {

    window.showAPINameScript = window.showAPINameScript || {};
    window.showAPINameScript.isOn = window.showAPINameScript.isOn === undefined ? false : !window.showAPINameScript.isOn;

    if (!window.showAPINameScript.isOn) {
        if (isLightningMode) {
            addFieldAPIName('.test-id__field-label-container.slds-form-element__label', el => {return el.childNodes.length > 0}, el => {return el.childNodes[0].innerText}, labelMap);
            addObjectAPIName('.entityNameTitle', sObjectName, longId);
        } else {
            addFieldAPIName('.labelCol', _ => {return true}, el => {return el.textContent.split('sfdcPage.')[0]}, labelMap);
            addObjectAPIName('.pageType', sObjectName, longId);
        }
    } else {
        let els = document.querySelectorAll('.apinames-script-class');
        Array.prototype.map.call(els, el => {
            el.parentNode.removeChild(el);
        });
    }
}

chrome.runtime.onMessage.addListener(function (message) {
    switch (message.command) {
        case "showApiName":
            replaceWithAPINames(message.isLightningMode, message.sObjectName, message.labelMap, message.longId).then(res => {}).catch(res => console.log(res));
            break;
    }
});
