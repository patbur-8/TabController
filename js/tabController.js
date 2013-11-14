//Smart bookmarks
//Automatisk kategorisering av bookmarks
window.onload = function() {

	var removeDuplicatesButton = document.getElementById("remove_this");
    removeDuplicatesButton.onclick = function() {
    	removeDuplicates(-1);
    	return false;
    }

   	var removeDuplicatesAllButton = document.getElementById("remove_all");
    removeDuplicatesAllButton.onclick = function() {
    	removeDuplicatesAllWindows();
    	return false;
    }

    var reorderTabsButton = document.getElementById("sort_this");
    reorderTabsButton.onclick = function() {
    	reorderTabs(-1);
    	return false;
    }

   	var reorderTabsAllButton = document.getElementById("sort_all");
    reorderTabsAllButton.onclick = function() {
    	reorderTabsAllWindows();
    	return false;
    }

    var mergeWindowsButton = document.getElementById("merge_all");
    mergeWindowsButton.onclick = function() {
    	startMerge();
    	return false;
    }

    var splitCurrentButton = document.getElementById("split_this");
    splitCurrentButton.onclick = function() {
    	getCurrentTab();
    	return false;
    }
}

function removeDuplicatesAllWindows() {
	chrome.windows.getAll({},function(windows){
	  windows.forEach(function(window){
	    removeDuplicates(window.id);
	  });
	});
	removeDuplicates(-1);
}

function removeDuplicates(windowId) {
	var params = {};
	console.log(windowId);
	if(windowId === -1) {
		params.currentWindow = true;
	} else {
		params.currentWindow = false;
		params.windowId = windowId;
	}

	var tabOrder = [];
	chrome.tabs.query(params, function(tabs) {
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

function reorderTabsAllWindows() {
	chrome.windows.getAll({},function(windows){
	  windows.forEach(function(window){
	    reorderTabs(window.id);
	  });
	});
	reorderTabs(-1);
}

function reorderTabs(windowId) {
	var params = {};
	if(windowId === -1) {
		params.currentWindow = true;
	} else {
		params.currentWindow = false;
		params.windowId = windowId;
	}
	var tabOrder = [];
	chrome.tabs.query(params, function(tabs) {
		for (var i = 0; i < tabs.length; i++) {
	    	tabOrder.push([tabs[i].url,tabs[i].id]);                      
	    }
		tabOrder.sort();
		for(var j = tabOrder.length-1; j>0; j--) {
			var id = tabOrder[j][1];
			moveTab(id,j);
		}
	});
	
}

function moveTabData(index, windowId) {
	var params = {};
	params.index = index;
	if(windowId != null) {
		params.windowId = windowId;
	}
  return params;
}

function moveTab(id, index, windowId, callback) {
  try {
    chrome.tabs.move(id, moveTabData(index, windowId), callback);
  } catch (e) {
    alert(e);
  }
}

// MERGE
var targetWindow = null;
var tabCount = 0;

function startMerge() {
  chrome.windows.getCurrent(getWindows);
}

function getWindows(win) {
  targetWindow = win;
  chrome.tabs.getAllInWindow(targetWindow.id, getTabs);
}

function getTabs(tabs) {
  tabCount = tabs.length;
  // We require all the tab information to be populated.
  chrome.windows.getAll({"populate" : true}, mergeAllWindow);
}

function mergeAllWindow(windows) {
  var numWindows = windows.length;
  var tabPosition = tabCount;

  for (var i = 0; i < numWindows; i++) {
    var win = windows[i];

    if (targetWindow.id != win.id) {
      var numTabs = win.tabs.length;

      for (var j = 0; j < numTabs; j++) {
        var tab = win.tabs[j];
        // Move the tab into the window that triggered the browser action.
        chrome.tabs.move(tab.id,
            {"windowId": targetWindow.id, "index": tabPosition});
        tabPosition++;
      }
    }
  }
  window.close();
}

function getCurrentTab() {
	//kolla om det är sista tabben
	chrome.tabs.query({currentWindow: true, active: true}, function(tabs){
	    createNewWindow(tabs[0]);
	});
}

var activeTab;
function createNewWindow(tab) {
	activeTab = tab;
	console.log(tab);
	console.log(tab.id);
	console.log(tab.windowId);
	chrome.windows.create({"focused": false}, moveTabsToNewWindow);
}

function moveTabsToNewWindow(win) {
	console.log(win.id)
	var currentTabId = activeTab.id;
	var tabOrder = [];
	chrome.tabs.query({"windowId" : activeTab.windowId}, function(tabs) {
		var addNext = false;
		for (var i = 0; i < tabs.length; i++) {
			if(tabs[i].id === currentTabId) {
	    		addNext = true;
			}   
			if(addNext === true) {
				tabOrder.push([tabs[i].url,tabs[i].id]);  
			}
                 
	    }
		for(var j = tabOrder.length-1; j>0; j--) {
			var id = tabOrder[j][1];
			if(j === tabOrder.length-1) {
				moveTab(id,j, win.id,removeDefaultNewTab(win.id));	
			} else {
				moveTab(id,j, win.id);
			}
		}
		window.close();
	});
}

function removeDefaultNewTab(newWindowId) {
	chrome.tabs.query({'active': true, 'windowId': newWindowId}, function (tabs) {
		var tabId = tabs[0].id;
		chrome.tabs.remove(tabId, null);
	});
}
