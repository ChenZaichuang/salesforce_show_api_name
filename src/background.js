'use strict';

async function getLabelMap(host, sObjectName, sObjectId, headers) {
    const response = await fetch(`${host}/services/data/v37.0/sobjects/${sObjectName}/${sObjectId}`, { headers });
    const data = await response.json();

    const recordTypeId = data.RecordTypeId || '012000000000000AAA';
    const layoutResponse = await fetch(`${host}/services/data/v37.0/sobjects/${sObjectName}/describe/layouts/${recordTypeId}`, { headers });
    const layoutData = await layoutResponse.json();

    const labelMap = {};
    const labelShowTimes = {};
    (layoutData.layouts?.[0]?.detailLayoutSections || layoutData.detailLayoutSections).forEach(section => {
        section.layoutRows?.forEach(row => {
            row.layoutItems?.filter(item => !item.placeHolder).forEach(item => {
                labelShowTimes[item.label] = (labelShowTimes[item.label] || -1) + 1;
                labelMap[item.label] = labelMap[item.label] || {};
                labelMap[item.label][labelShowTimes[item.label]] = item.layoutComponents[0]?.value;
            });
        });
    });

    const describeResponse = await fetch(`${host}/services/data/v37.0/sobjects/${sObjectName}/describe`, { headers });
    const describeData = await describeResponse.json();

    const assistLabelMap = {};
    describeData.fields?.forEach(field => {
        if (!labelMap[field.label]) {
            assistLabelMap[field.label] = field.name;
        }
    });

    if (sObjectName === 'User') {
        Object.assign(assistLabelMap, {
            'Debug Mode': 'UserPreferencesUserDebugModePref',
            'Delegated Approver': 'DelegatedApproverId',
            'Individual': 'IndividualId',
            'Failed Login Attempts': 'NumberOfFailedLogins',
            'Cache Diagnostics': 'UserPreferencesCacheDiagnostics',
            'Development Mode': 'UserPreferencesApexPagesDeveloperMode',
            'Modified By': 'LastModifiedById'
        });
    }

    return { labelMap, assistLabelMap };
}

async function getSObjectName(host, headers, keyPrefix) {
    const response = await fetch(`${host}/services/data/v37.0/sobjects`, { headers });
    const data = await response.json();
    return data.sobjects?.find(obj => obj.keyPrefix === keyPrefix)?.name;
}

async function getTokenAndDomainInClassic(url) {
    const cookies = await chrome.cookies.getAll({ url, name: 'sid' });
    return cookies[0] ? [cookies[0].value, cookies[0].domain] : [null, null];
}

async function getTokenAndDomainInLightning(customDomain) {
    const cookies = await chrome.cookies.getAll({ domain: 'salesforce.com', name: 'sid' });
    for (const cookie of cookies) {
        if (cookie.domain.startsWith(`${customDomain}.`)) {
            return [cookie.value, cookie.domain];
        }
    }
    return [null, null];
}

function getLongId(originalId) {
    if (!originalId || originalId.length < 15) return '';
    originalId = originalId.substring(0, 15);

    let addon = '';
    for (let block = 0; block < 3; block++) {
        let loop = 0;
        for (let position = 0; position < 5; position++) {
            const current = originalId.charAt(block * 5 + position);
            if (current >= 'A' && current <= 'Z') loop += 1 << position;
        }
        addon += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ012345'.charAt(loop);
    }
    return originalId + addon;
}

async function showApiName(tab) {
    try {
        const url = new URL(tab.url);
        const isLightning = url.host.includes('lightning.force.com');

        let sid, domain;
        if (isLightning) {
            const customDomain = url.host.split('.')[0];
            [sid, domain] = await getTokenAndDomainInLightning(customDomain);
        } else {
            [sid, domain] = await getTokenAndDomainInClassic(url.origin);
        }

        if (!sid) return;

        const headers = {
            'Authorization': `Bearer ${sid}`,
            'Content-Type': 'application/json'
        };

        const apiHost = `https://${isLightning ? domain : url.host}`;
        const pathSegments = url.pathname.split('/');

        let sObjectId, sObjectName;
        if (isLightning) {
            const match = url.pathname.match(/\/lightning\/r\/(\w+)\/(\w+)/);
            if (!match) return;
            sObjectName = match[1];
            sObjectId = match[2];
        } else {
            sObjectId = pathSegments[1]?.substring(0, 15);
            const keyPrefix = pathSegments[1]?.substring(0, 3);
            sObjectName = await getSObjectName(apiHost, headers, keyPrefix);
        }

        if (!sObjectName || !sObjectId) return;

        const labelMap = await getLabelMap(apiHost, sObjectName, sObjectId, headers);
        const longId = getLongId(sObjectId);

        await chrome.tabs.sendMessage(tab.id, {
            command: "showApiName",
            isLightningMode: isLightning,
            labelMap,
            sObjectName,
            longId
        });
    } catch (error) {
        console.error('Error in showApiName:', error);
    }
}

// Event Listeners
chrome.action.onClicked.addListener(showApiName);
chrome.commands.onCommand.addListener((command) => {
    if (command === 'showApiName') {
        chrome.tabs.query({ active: true, currentWindow: true })
            .then(([tab]) => tab && showApiName(tab));
    }
});