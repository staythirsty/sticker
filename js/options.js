
var stickeroptions = stickeroptions || {};

stickeroptions.utils =  {

		// checks that an input string is an integer, with an optional +/- sign character.	
		'isPositiveInteger' : function  (s) {	
			var isInteger_re     = /^\s*\d+\s*$/;
			return String(s).search(isInteger_re) != -1
		},
		
		//Local Storage functions
		'storetoLocalStorage' : function (lsVar, value){
			localStorage[lsVar] = value;
		},
		
		'retreiveFromLocalStorage' : function (lsVar){
		   return typeof(localStorage[lsVar]) == "undefined" ? "" : localStorage[lsVar];
		},
		
		//Utility to and from copy data from Local Storage and Widget
		'copyFromLStoElement' : function (lsVar, widgetid){
			document.getElementById(widgetid).value = stickeroptions.utils.retreiveFromLocalStorage(lsVar);
		},
		
		'storeToLSFromElement' : function (lsVar, widgetid){
			stickeroptions.utils.storetoLocalStorage(lsVar, document.getElementById(widgetid).value);
		}
}



// Saves options to localStorage.
stickeroptions.saveoptions = function() {

	if(stickeroptions.validateOptions() == false){
		stickeroptions.setMessage("One or more errors on the page. Please fix");
		return;
	}

	for(var i=1;i< 6;i++){
	    stickeroptions.utils.storeToLSFromElement("sticker_tickers" + i,"tickers" + i);
	}
	
	stickeroptions.utils.storeToLSFromElement("sticker_stock_frequency","stockFrequency");
	stickeroptions.utils.storeToLSFromElement("sticker_display_frequency","displayFrequency");

   	stickeroptions.setMessage("Options saved");

}

stickeroptions.validateOptions = function (){

		for(var i=1;i< 6;i++){
			if(document.getElementById("tickers" + i + "_valid").value == "false"){
				console.log("validateOptions() - tickers" + i + "_valid  not valid ");
				return false;
			}
		}
		
		var frequency = document.getElementById("stockFrequency").value;
		if( frequency != null && frequency != "" ){	
			if( stickeroptions.utils.isPositiveInteger(frequency) == false){
				console.log("validateOptions() - stockFrequency  not valid " + frequency);
				return false;
			}
		}
		
		frequency = document.getElementById("displayFrequency").value;
		if( frequency != null && frequency != "" ){	
			if( stickeroptions.utils.isPositiveInteger(frequency) == false){
				console.log("validateOptions() - displayFrequency  not valid " + frequency);
				return false;
			}
		}
		
		return true;
		
}

stickeroptions.setMessage = function(msg){

		// Update status to let user know options were saved.
		var status = document.getElementById("status");
		status.innerHTML = msg;
		setTimeout(function () {
			status.innerHTML = "";
		}, 3000);
    
}

// Restores select box state to saved value from localStorage.
stickeroptions.restoreoptions = function () {

		for(var i=1;i< 6;i++){
			stickeroptions.utils.copyFromLStoElement("sticker_tickers" + i,"tickers" + i);
			document.getElementById("tickers" + i + "_valid").value = "true";
		}
	
		stickeroptions.utils.copyFromLStoElement("sticker_stock_frequency","stockFrequency");
		stickeroptions.utils.copyFromLStoElement("sticker_display_frequency","displayFrequency");

}

//validate stock ticker
stickeroptions.validateStockTicker =  function (widgetid) {

		console.log("options.js validateStockTicker widgetid " + widgetid);
	
		var tickerWidget = document.getElementById(widgetid);
		var ticker = tickerWidget.value;
		
		if( ticker == null || ticker == ""){
			tickerWidget.classList.remove('error-input-text');
			document.getElementById(widgetid + "_valid").value = "true";
			return;
		}
			
		console.log("fetch stock ticker - start");
		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function (data) {
			if (xhr.readyState == 4) {
				if (xhr.status == 200) {
					if (xhr.responseText == null) {
						tickerWidget.classList.add('error-input-text');
						document.getElementById(widgetid + "_valid").value = "false";
					}else{
						tickerWidget.classList.remove('error-input-text');
						document.getElementById(widgetid + "_valid").value = "true";
					}
				} else {
						tickerWidget.classList.add('error-input-text');
						document.getElementById(widgetid + "_valid").value = "false";
				}
			   
			   document.getElementById('save').disabled = false;
				
			}
		}
	
		var url = 'http://www.google.com/finance/info?client=ig&q=' + ticker;
		xhr.open('GET', url, true);
		document.getElementById('save').disabled = true;
	
		xhr.send();
}

//validate frequency
stickeroptions.validateFrequency = function (widgetid) {

	var frequencyWidget = document.getElementById(widgetid);
	var frequency = frequencyWidget.value;
	
	if( frequency == null || frequency == "" ){
		return;
	}
	
	if( stickeroptions.utils.isPositiveInteger(frequency) == false){
		frequencyWidget.classList.add('error-input-text');
	}else{
		frequencyWidget.classList.remove('error-input-text');
	}
		
}



document.addEventListener('DOMContentLoaded', function () {

    stickeroptions.restoreoptions();
    
    document.querySelector('#save').addEventListener('click', stickeroptions.saveoptions);
    //document.getElementById('tickers1').onclick = validateStockTicker('tickers1');


	for(var i= 1;i< 6;i++){
		document.getElementById('tickers' + i).addEventListener("blur", function(num){
			return function(){
				stickeroptions.validateStockTicker("tickers" + num);
			}
		}(i), false);
	}	
	
	document.getElementById('displayFrequency').addEventListener("blur", function(){stickeroptions.validateFrequency("displayFrequency")}, false);
	document.getElementById('stockFrequency').addEventListener("blur", function(){stickeroptions.validateFrequency("stockFrequency")}, false);

	
});