'use strict';


async function replaceWithAPINames(isLightningMode, sObjectName, labelMap) {

    window.apinamesScript = window.apinamesScript || {};
    window.apinamesScript.isOn = !!window.apinamesScript.isOn;

    if (!window.apinamesScript.isOn) {

        if (isLightningMode) {
            let fieldElements = document.querySelectorAll('.test-id__field-label-container.slds-form-element__label');
            Array.prototype.map.call(fieldElements, el => {
                if (el.childNodes.length > 0) {
                    let fieldLabel = el.childNodes[0].innerText;
                    let apiName;
                    if (labelMap[fieldLabel] != null) {
                        apiName = labelMap[fieldLabel];
                    } else if (fieldLabel.toLowerCase().includes('currency')) {
                        apiName = 'CurrencyIsoCode';
                    }
                    let apiNameElement = document.createElement('span');
                    apiNameElement.style = 'display: block;font-weight: normal;color: #A9A9A9;margin-top: 3px;margin-bottom: 5px;';
                    apiNameElement.textContent = apiName;
                    apiNameElement.className = "apinames-script-class";
                    el.appendChild(apiNameElement);
                }
            });
            let objectLabelElements = document.querySelectorAll('.entityNameTitle.slds-line-height_reset');
            let objectLabelElement = objectLabelElements[objectLabelElements.length - 1];
            let objectNameElement = document.createElement('span');
            objectNameElement.style = 'display: block;font-weight: normal;color: #A9A9A9;margin-top: 3px;margin-bottom: 5px;';
            objectNameElement.textContent = sObjectName;
            objectNameElement.className = "apinames-script-class";
            objectLabelElement.appendChild(objectNameElement);
        } else {
            let fieldElements = document.querySelectorAll('.labelCol');
            Array.prototype.map.call(fieldElements, el => {
                let fieldLabel = el.textContent.split('sfdcPage.')[0];
                let apiName;
                if (labelMap[fieldLabel] != null) {
                    apiName = labelMap[fieldLabel];
                } else if (fieldLabel.toLowerCase().includes('currency')) {
                    apiName = 'CurrencyIsoCode';
                }
                let apiNameElement = document.createElement('span');
                apiNameElement.style = 'display: block;font-weight: normal;color: #A9A9A9;margin-top: 3px;margin-bottom: 5px;';
                apiNameElement.textContent = apiName;
                apiNameElement.className = "apinames-script-class";
                el.appendChild(apiNameElement);
            });
            let objectLabelElement = document.querySelectorAll('.pageType')[0];
            let objectNameElement = document.createElement('span');
            objectNameElement.style = 'display: block;font-weight: normal;color: #A9A9A9;margin-top: 3px;margin-bottom: 5px;';
            objectNameElement.textContent = sObjectName;
            objectNameElement.className = "apinames-script-class";
            objectLabelElement.appendChild(objectNameElement);

        }
    } else {
        let els = document.querySelectorAll('.apinames-script-class');
        Array.prototype.map.call(els, el => {
            el.parentNode.removeChild(el);
        });
    }
    window.apinamesScript.isOn = !window.apinamesScript.isOn;
}

chrome.runtime.onMessage.addListener(function (message) {
    switch (message.command) {
        case "showApiName":
            replaceWithAPINames(message.isLightningMode, message.sObjectName, message.labelMap).then(res => console.log(res)).catch(res => console.log(res));
            break;
    }
});