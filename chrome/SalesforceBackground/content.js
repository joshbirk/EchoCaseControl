window.onload = function() {
    url = chrome.extension.getBackgroundPage().url;
    host = url.split('.com/')[0];
    host = host + '.com';
    window.location.href = host + '/apex/SalesforceBackgroundControl';
}

