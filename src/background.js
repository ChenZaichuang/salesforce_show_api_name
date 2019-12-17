'use strict';

async function toJson(response) {
    return await response.json()
}

async function getLabelMap(host, sObjectName, sObjectId, headers) {
    return await fetch(host + '/services/data/v37.0/sobjects/' + sObjectName + '/' + sObjectId, {headers: headers}).then(toJson).then(async data => {
        let recordTypeId = data.RecordTypeId || '012000000000000AAA';
        return await fetch(host + '/services/data/v37.0/sobjects/' + sObjectName + '/describe/layouts/' + recordTypeId, {headers: headers}).then(toJson).then(data => {
            data = data.layouts != null ? data.layouts[0] : data;
            let labelMap = {};
            data.detailLayoutSections.map(section => {
                section.layoutRows.map(row => {
                    row.layoutItems.filter(item => !item.placeHolder).map(item => {
                        labelMap[item.label] = item.layoutComponents[0] && item.layoutComponents[0].value;
                    })
                })
            });
            return labelMap;
        })
    })
}

async function getSObjectName(host, headers, keyPrefix) {
    return await fetch(host + '/services/data/v37.0/sobjects', {
        method: 'GET',
        headers: headers
    }).then(toJson).then(data => {
        let sObjectName;
        for (var i = 0; i < data.sobjects.length; i++) {
            if (data.sobjects[i].keyPrefix === keyPrefix) {
                sObjectName = data.sobjects[i].name;
                break;
            }
        }
        return sObjectName;
    });
}

async function getSid(url) {
    return new Promise((resolve, reject) => {
        chrome.cookies.getAll({"url": url, "name": "sid"}, function (cookies) {
            resolve(cookies[0].value);
        });
    })
}

async function showApiName(tab) {

    let urlMatchResult = tab.url.match(/(https:\/\/[^/]+)(.+)/);
    let host = urlMatchResult[1];
    let path = urlMatchResult[2];
    let isLightningMode = host.includes("lightning");
    let matchResult;
    if (isLightningMode) {
        matchResult = path.match(/\/lightning\/r\/(\w+)\/(\w+)\W*/);
        if (!matchResult) {
            return;
        }
    } else {
        if (!path.match(/\/\w{15,18}/)) {
            return;
        }
    }
    let sObjectId;
    let sObjectName;
    host = host.endsWith(".lightning.force.com") ? host.replace('.lightning.force.com', '.my.salesforce.com') : host;
    let sid = await getSid(host);
    let headers = {"Authorization": `Bearer ${sid}`, "Content-Type": "application/json"};
    if (isLightningMode) {
        sObjectId = matchResult[2];
        sObjectName = matchResult[1];
    } else {
        sObjectId = path.substring(1, 16);
        sObjectName = await getSObjectName(host, headers, path.substring(1, 4));
    }

    let labelMap = await getLabelMap(host, sObjectName, sObjectId, headers);

    await chrome.tabs.sendMessage(tab.id, {
        command: "showApiName",
        isLightningMode: isLightningMode,
        labelMap: labelMap,
        sObjectName: sObjectName
    });
}


chrome.browserAction.onClicked.addListener(function (tab) {
    showApiName(tab).then(res => console.log(res)).catch(res => console.log(res));
});


chrome.commands.onCommand.addListener(function (command) {
    if (command === 'showApiName') {
        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            showApiName(tabs[0]).then(res => console.log(res)).catch(res => console.log(res));
        });
    }
});

