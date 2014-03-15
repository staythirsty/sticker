var sticker = sticker || {

	'config' : {
		'url' : 'https://www.google.com/finance/info?client=ig&q=',
		'currentScrollText' : '~' + document.title,
		'newScrollText' : '',
		'counter' : 0 ,
		'tickerSymbols' : '',
		'stockFrequency' : 60000,
		'displayFrequency' : 1000,
		'originalDocTitle' : document.title,
		'marqueeTimeoutVar' : {},
		'stockTickerTimeoutVar' : {}
	},

 	//marquee functionality to display stock in blocks seperated by ~
	'marquee2' : function(){
		
		//checks if new stock ticker data is available.
		if(sticker.config.newScrollText != ""){
			sticker.config.currentScrollText = sticker.config.newScrollText;
			sticker.config.newScrollText = "";
		}

		var splitArray = sticker.config.currentScrollText.split("~");
		//console.log (splitArray.length + splitArray[sticker.config.counter] + sticker.config.counter);
		document.title = splitArray[sticker.config.counter];
		sticker.config.counter = sticker.config.counter + 1;
		sticker.config.counter = sticker.config.counter % (splitArray.length);
		 	
 		sticker.config.marqueeTimeoutVar = setTimeout("sticker.marquee2()", sticker.config.displayFrequency);
		
	},
	
	
	 //Ajax request to fetch stock tickers
 	'fetchStockTicker' : function (callback) {
 
 			console.log("contentscript.js - fetch stock ticker - start");
  			var xhr = new XMLHttpRequest();
			xhr.onreadystatechange = function(data) {
    			if (xhr.readyState == 4) {
      				if (xhr.status == 200) {
      					//google return json data but begins with "// "
        				var data = JSON.parse(xhr.responseText.substring(3));
       					callback(data);
      				} else {
        				callback(null);
      				}
    			}
  			}
  
  			var url =  sticker.config.url + sticker.config.tickerSymbols;
  			xhr.open('GET', url, true);
  			xhr.send();
  
  	},

	//call back to process stock tickers 
	'cbProcessStockTickers' : function (tickers) {
			
			var tempNewScrollText = "";
   			if(tickers == null)
   				tempNewScrollText = "xx";
   			else{
				for(i=0;i<tickers.length;i++){
					tempNewScrollText += "~" + tickers[i].t + ":" + tickers[i].l + " " + tickers[i].c;
					tempNewScrollText += "~" + tickers[i].t + ":" + tickers[i].l + " (%" + tickers[i].cp + ")";
				}
   			}
   	
   			sticker.config.newScrollText = tempNewScrollText.substring(1);
  			console.log("contentscript.js - fetch stock ticker - finish");
 			console.log("contentscript.js - fetch stock ticker - %s", sticker.config.newScrollText);

  			sticker.config.stockTickerTimeoutVar = setTimeout("sticker.fetchStockTicker(sticker.cbProcessStockTickers)", sticker.config.stockFrequency);
	},

	//method that kicks everything off - call background.js method
	'init' : function (){
	
			console.log("init sticker");
	
			console.log("clearing if timeouts were set - ajax page load tiggers tab load event ");
			if(sticker.config.marqueeTimeoutVar)
					clearTimeout(sticker.config.marqueeTimeoutVar);		
			if(sticker.config.stockTickerTimeoutVar)	
					clearTimeout(sticker.config.stockTickerTimeoutVar);
	
	
			chrome.extension.sendRequest({method: "getStockTickers"}, function(response) {
	
					console.log("stock tickers from option page - " + response.tickers);
					console.log("stock frequency from option page - " + response.stock_frequency);
					console.log("display frequency from option page - " + response.display_frequency);
					console.log("goNoGo from option page - " + response.go_no_go);
	
					if(response.go_no_go === "false"){
							return;
					}
	
					//set page level variables
					sticker.config.tickerSymbols = response.tickers ;
					sticker.config.stockFrequency = response.stock_frequency;
					sticker.config.displayFrequency = response.display_frequency;
	
					//start marquee and stock ticker
					sticker.marquee2();
					sticker.fetchStockTicker(sticker.cbProcessStockTickers);
			});
		},


		//stop - sticker. Puts original title back and clears marquee and stock ticker
		'resetAction' : function (){

				console.log("resetting the page title to " + sticker.config.originalDocTitle);
				document.title = sticker.config.originalDocTitle;
				clearTimeout(sticker.config.marqueeTimeoutVar);
				clearTimeout(sticker.config.stockTickerTimeoutVar);
		}

};



//method for extension to start/stop sticker
chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
  
  	//retreives stock tickers from local storage
  	console.log("contentscript.js - request.method " + request.method );
  	if (request.method == "resetAction"){
      	sticker.resetAction();
    }
    
    //method that kicks everything off - call background.js method
  	if (request.method == "resumeAction"){
		sticker.init();
	}
      
});


//init();


