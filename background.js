
chrome.browserAction.onClicked.addListener(function() {
	console.log("test");
	reorderTabs();

});
var tabOrder = [];
function reorderTabs() {
	tabOrder = [];
	chrome.tabs.query({'currentWindow' : true}, function(tabs) {
		console.log(tabs.length);
		for (var i = 0; i < tabs.length; i++) {
			var domain = tabs[i].url.match(/^[\w-]+:\/*\[?([\w\.:-]+)\]?(?::\d+)?/)[1];
	    	tabOrder.push([domain,tabs[i].id]);                      
	    }

	    tabOrder.sort();

	    for(var i = 0; i < tabs.length-1; i++) {
	    	if(tabOrder[i][0] === tabOrder[i+1][0]) {
	    		chrome.tabs.remove(tabOrder[i][1]);
	    	}
		}
	});
	
}

function moveTabData(index) {
  return {
    'index': index 
  }
}

function moveTab(id, index) {
  try {
    chrome.tabs.move(id, moveTabData(index));
  } catch (e) {
    alert(e);
  }
}