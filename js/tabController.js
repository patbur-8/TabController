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

    var splitOriginButton = document.getElementById("split_origin_this");
    splitOriginButton.onclick = function() {
    	startSplitOriginThis();
    	return false;
    }

    var splitOriginAllButton = document.getElementById("split_origin_all");
    splitOriginAllButton.onclick = function() {
    	startSplitOriginAll();
    	return false;
    }

    var closeOriginButton = document.getElementById("close_origin_this");
    closeOriginButton.onclick = function() {
    	closeCurrentOriginThisWindow();
    	return false;
    }

    var closeOriginAllButton = document.getElementById("close_origin_all");
    closeOriginAllButton.onclick = function() {
    	closeCurrentOriginAllWindows();
    	return false;
    }

    var gatherOriginAllButton = document.getElementById("gather_origin_this");
    gatherOriginAllButton.onclick = function() {
    	gatherCurrentOriginAllWindows();
    	return false;
    }
}

function getOrigin(url) {
	return url.match(/^[\w-]+:\/*\[?([\w\.:-]+)\]?(?::\d+)?/)[1];
}

function finishedRunning() {
	window.close();
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
			var domain = getOrigin(tabs[i].url);
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
  finishedRunning();
}

function getCurrentTab() {
	//kolla om det är sista tabben
	chrome.tabs.query({currentWindow: true}, function(tabs){
		var currentTab;
		for(var i = 0; i < tabs.length; i++) {
			if(tabs[i].active === true) {
				if(i === tabs.length-1) {
					finishedRunning();
					return;
				}
				currentTab = tabs[i];
			}
		}
	    createNewWindow(currentTab);
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
		finishedRunning();
	});
}

function removeDefaultNewTab(newWindowId) {
	chrome.tabs.query({'active': true, 'windowId': newWindowId}, function (tabs) {
		var tabId = tabs[0].id;
		console.log(tabs[0]);
		chrome.tabs.remove(tabId, null);
	});
}

//// BETA

function startSplitOriginThis() {
	chrome.windows.create({"focused": false}, splitCurrentOriginThisWindow);
}

function splitCurrentOriginThisWindow(win) {
	chrome.tabs.query({"currentWindow": true}, function(tabs){
		console.log(tabs);
		console.log(tabs.length);
		var origin;
		for(var i = 0; i < tabs.length; i++) {
			if(tabs[i].active === true) {
				origin = getOrigin(tabs[i].url);
				console.log(origin);
				break;
			}
		}
		console.log("second loop");
		for(var j = 0; j < tabs.length; j++) {
			console.log(getOrigin(tabs[j].url));
			console.log(origin);
			console.log(getOrigin(tabs[j].url) === origin);
			var deleteFirst = true;
			if(getOrigin(tabs[j].url) === origin) {
				if(deleteFirst) {
					moveTab(tabs[j].id, j, win.id, removeDefaultNewTab(win.id));
					deleteFirst = false;
				} else {
					console.log("move");
					moveTab(tabs[j].id, j, win.id);
				}
				
			}
		}
	});
}

function startSplitOriginAll() {
	chrome.windows.create({"focused": false}, splitCurrentOriginAllWindows);
}

function splitCurrentOriginAllWindows(newWindow) {
	chrome.tabs.query({"currentWindow": true, "active": true}, function(tabs){
		var origin = getOrigin(tabs[0].url);
		chrome.windows.getAll({"populate" : true}, function(windows){
			var deleteFirst = true;
			var numWindows = windows.length;
			for (var i = 0; i < numWindows; i++) {
				var win = windows[i];
				if(newWindow.id != win.id) {
					var numTabs = win.tabs.length;
			    	for (var j = 0; j < numTabs; j++) {
			        	var tab = win.tabs[j];
			        	if(getOrigin(tab.url) === origin) {
			        		if(deleteFirst) {
								console.log("move first");
								moveTab(tab.id, i, newWindow.id, removeDefaultNewTab(newWindow.id));
								deleteFirst = false;
							} else {
								console.log("move");
								moveTab(tab.id, i, newWindow.id);
							}
			        	}
			        }
				}
			}
		});
	});
}
//CLOSE ORIGIN

function closeCurrentOriginThisWindow() {
	chrome.tabs.query({"currentWindow": true}, function(tabs){
		console.log(tabs);
		console.log(tabs.length);
		var origin;
		var originTab;
		for(var i = 0; i < tabs.length; i++) {
			if(tabs[i].active === true) {
				origin = getOrigin(tabs[i].url);
				originTab = tabs[i];
				console.log(origin);
				break;
			}
		}
		console.log("second loop");
		for(var j = 0; j < tabs.length; j++) {
			if(getOrigin(tabs[j].url) === origin) {
				if(tabs[j] != originTab) {
					chrome.tabs.remove(tabs[j].id, null);
				}
			}
		}
		chrome.tabs.remove(originTab.id, null);
	});
}

function closeCurrentOriginAllWindows() {
	chrome.tabs.query({"currentWindow": true, "active": true}, function(tabs){
		var origin = getOrigin(tabs[0].url);
		var originTab = tabs[0];
		chrome.windows.getAll({"populate" : true}, function(windows){
			var numWindows = windows.length;
			for (var i = 0; i < numWindows; i++) {
				var win = windows[i];
				var numTabs = win.tabs.length;
		    	for (var j = 0; j < numTabs; j++) {
		        	var tab = win.tabs[j];
		        	if(getOrigin(tab.url) === origin) {
						if(tab != originTab) {
							chrome.tabs.remove(tab.id, null);
						}
		        	}
		        }
			}
			chrome.tabs.remove(originTab.id, null);
		});
	});
}

// GATHER ORIGIN

function gatherCurrentOriginAllWindows() {
	chrome.tabs.query({"currentWindow": true, "active": true}, function(tabs){
		var origin = getOrigin(tabs[0].url);
		var originTab = tabs[0];
		var index = originTab.index;
		chrome.windows.getAll({"populate" : true}, function(windows){
			var numWindows = windows.length;
			for (var i = 0; i < numWindows; i++) {
				var win = windows[i];
				var numTabs = win.tabs.length;
		    	for (var j = 0; j < numTabs; j++) {
		        	var tab = win.tabs[j];
		        	if(getOrigin(tab.url) === origin) {
						if(tab != originTab) {
							moveTab(tab.id, index, originTab.windowId, null);
							index++;
						}
		        	}
		        }
			}
		});
	});
}

//EXPLODE ORIGIN