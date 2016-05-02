function checkForValidUrl(tabId, changeInfo, tab) {
   if (tab != null && tab.url.indexOf( "force.com" ) > 0) {
       chrome.pageAction.show(tabId);
   }
};

chrome.tabs.onUpdated.addListener(checkForValidUrl);
chrome.tabs.onHighlighted.addListener(checkForValidUrl);

var url = '';
var current_tabid = 0;
chrome.pageAction.onClicked.addListener(function() {
   chrome.tabs.query({'active': true, 'windowId': chrome.windows.WINDOW_ID_CURRENT},
       function(tabs){
          url = tabs[0].url;
          if(current_tabid != 0) {
              chrome.windows.remove(current_tabid-1, function(window) {});
            }   

          chrome.windows.create({'url': 'demo.html', 'type': 'popup', 'height':750, 'width':360, 'left': 350}, function(window) {
              console.log("NEW WINDOW ID :::>>>>"+window.id);
              current_tabid = window.id+1;
             });   
       });
});


var case_window_id = 0;
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    console.log(message.request.id);
    if(message.request.type == 'open') {
        chrome.windows.create({'url': 'https://login.salesforce.com/'+message.request.id, 'type': 'popup', 'height':850, 'width':1200, 'left': 150}, function(window) {
          case_window_id = window.id;
        }); 
        console.log(case_window_id);
        console.log('opened');
    }

    else if(message.request.type == 'update') {
      chrome.tabs.get(case_window_id+1,function(tab){
        new_url = tab.url;
        console.log(new_url);
        if(new_url.indexOf('?t=') > 0) { 
          new_url = new_url.split('?t=')[0];
          new_url += "?t=";
          new_url += Math.random();
        }
        
        console.log(new_url);
        chrome.tabs.update(tab.id, {url: new_url});
      })
      console.log('updated');
    }

    else if(message.request.type == 'close') {
        chrome.windows.remove(case_window_id, function(window) {});
        console.log('closed');
    }


    sendResponse({msg:'completed'});
});




