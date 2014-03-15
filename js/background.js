
var stickerbackground = stickerbackground || {
	//variable that controls if the sticker is on or off
	'goNoGo' : 'true',

	//utility to retreive from local storage
	'retreiveFromLocalStorage' : function(lsVar){
   			return typeof(localStorage[lsVar]) == "undefined" ? "" : localStorage[lsVar];
	},
	//Local Storage functions
	'storetoLocalStorage' : function (lsVar, value){
		localStorage[lsVar] = value;
	},
	'init' : function (){
	
		stickerbackground.goNoGo = "true";
	
		var tickersExist = false;
		for(var i=1;i< 6;i++){
			var tempTicker = stickerbackground.retreiveFromLocalStorage("sticker_tickers" + i);
			if(tempTicker != ""){
				tickersExist = true;
				break;	
			}
		}

		if(tickersExist == false){
			stickerbackground.storetoLocalStorage("sticker_tickers1","GOOG");
		}

		if(stickerbackground.retreiveFromLocalStorage('sticker_display_frequency') == "")
			stickerbackground.storetoLocalStorage("sticker_display_frequency", 5);
		
		if(stickerbackground.retreiveFromLocalStorage('sticker_stock_frequency') == "")
			stickerbackground.storetoLocalStorage("sticker_stock_frequency", 5);

		if(stickerbackground.retreiveFromLocalStorage('sticker_status') == "")
			stickerbackground.storetoLocalStorage("sticker_status", "true");
	
	}
};

stickerbackground.init();


//method used by contentscript to retreive options. contentscript cannot access local storage.
chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
  
  
  	console.log("background.js onrequest - request.method " + request.method );


  	//retreives stock tickers and frequency info from local storage
  	if (request.method == "getStockTickers"){
  		
  		//retrive from local storage
  		var tickers = "";
  		for(var i=1;i< 6;i++){
			var tempTicker = stickerbackground.retreiveFromLocalStorage("sticker_tickers" + i);
			if(tempTicker == "")
				continue;
			tickers += tempTicker + ",";
		}
	
      	var displayFrequency = stickerbackground.retreiveFromLocalStorage('sticker_display_frequency');
      	var stockFrequency = stickerbackground.retreiveFromLocalStorage('sticker_stock_frequency');
      	var status = stickerbackground.retreiveFromLocalStorage('sticker_status');
      	stickerbackground.goNoGo = status;
     
     	//log 
     	console.log("background.js onrequest - tickers %s", tickers.substring(0,tickers.length -1));
     	console.log("background.js onrequest - stock_frequency %s ",stockFrequency);
     	console.log("background.js onrequest - display_frequency %s", displayFrequency);
     	console.log("background.js onrequest - status %s", status);
     	console.log("background.js onrequest - goNoGo %s", stickerbackground.goNoGo);
     	
  
     	sendResponse({	"tickers": tickers.substring(0,tickers.length -1), 
     					"stock_frequency": stockFrequency * 60 * 1000,
     					"display_frequency" : displayFrequency * 1000,
     					"go_no_go": stickerbackground.goNoGo});
      }else{
      	sendResponse({}); // snub them.
      }
      
});


//methods that listens for tab changes action.
 chrome.tabs.onActivated.addListener(function(activeInfo) {
 
 	if(stickerbackground.goNoGo === "false"){
 		console.log("background.js tabs.onActivated - but no go %s", stickerbackground.goNoGo);
 		return;
 	}
 	
 	console.log("background.js tabs.onActivated - " + activeInfo.tabId);
 	 chrome.tabs.query( new Object(), function(tabs){
 	 	for(var i=0; i < tabs.length;i++){
 	 	
 	 		if(tabs[i].id != activeInfo.tabId){
 	 			console.log("background.js tabs.onActivated  - send 'resetAction' to tabs - " + tabs[i].id);
 	 			chrome.tabs.sendMessage(tabs[i].id,{method: "resetAction"});
 	 		}
 	 	}
 	 }); 
 	 
 	 
 	 console.log("background.js tabs.onActivated  - send 'resumeAction' to tab- " + activeInfo.tabId);
 	 chrome.tabs.sendMessage(activeInfo.tabId,{method:"resumeAction"});
 	
 
 }); 
 
 
 chrome.tabs.onUpdated.addListener(function( tabId , info ) {
    if ( info.status == "complete" ) {

 	 	chrome.tabs.query( new Object(), function(tabs){
 	 		var flag = false;
 	 		for(var i=0; i < tabs.length;i++){
	
	 	 		if(tabs[i].id == tabId && tabs[i].active == true) {
 	 				console.log("background.js tabs.onUpdate  - tab finished loaded and is active - " + tabs[i].id);
 	 				chrome.tabs.sendMessage(tabs[i].id,{method: "resumeAction"});
 	 				flag = true;
 	 			}
 	 		}
 	 		
 	 		if(flag == false){
 	 				console.log("background.js tabs.onUpdate  - tab finished loaded and but not active - " + tabId);
 	 		}
 	 	});

    }
});


 
 



//method to omnibox suggest commands ( start and stop ) to users
chrome.omnibox.onInputChanged.addListener(
  function(text, suggest) {
    suggest([
      {content: text + " start", description: "start sticker extension"},
      {content: text + " stop", description: "stop sticker extension"}
    ]);
  });


//method to handle start and stop commands from omnibox
// This event is fired with the user accepts the input in the omnibox.
chrome.omnibox.onInputEntered.addListener(
  function(text) {

    console.log('background.js omnibox.onInputChanged - command - ' + text);
    
    if(text === "start"){
    	
    	stickerbackground.goNoGo = "true";
    	stickerbackground.storetoLocalStorage("sticker_status", "true");

    	
    	//send 'resumeAction' (start) to active tab and 'resetAction' (stop) to the rest.
    	chrome.tabs.query( new Object(), function(tabs){
 			for(var i=0; i < tabs.length;i++){
 				if(tabs[i].active == true){
					console.log("background.js omnibox.onInputChanged - send 'resetAction' to tabs - " + tabs[i].id);
					chrome.tabs.sendMessage(tabs[i].id,{method:"resumeAction"});
 				}else{
					console.log("background.js omnibox.onInputChanged  - send 'resetAction' to tabs - " + tabs[i].id);
 	 				chrome.tabs.sendMessage(tabs[i].id,{method: "resetAction"});
 	 			}
 	 		}
 	 	});

 	}else if( text === "stop"){
 		
 		stickerbackground.goNoGo = "false";
 		stickerbackground.storetoLocalStorage("sticker_status", "false");

 		
    	//send 'resetAction' (stop) to all tabs
    	chrome.tabs.query( new Object(), function(tabs){
 			for(var i=0; i < tabs.length;i++){
 	 			chrome.tabs.sendMessage(tabs[i].id,{method: "resetAction"});
 	 		}
 	 	});
 
 
 	}else if( text === "pause"){
 		
 		stickerbackground.goNoGo = "false";
 		
    	//send 'resetAction' (stop) to all tabs
    	chrome.tabs.query( new Object(), function(tabs){
 			for(var i=0; i < tabs.length;i++){
 	 			chrome.tabs.sendMessage(tabs[i].id,{method: "resetAction"});
 	 		}
 	 	});
 
 
 	}else if (text === "options"){
 		chrome.tabs.create({
        	url: "options.html"
		});
 	}
		
  });
  
  