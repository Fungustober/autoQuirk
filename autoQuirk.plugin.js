/**
*@name autoQuirk
*@author Fungustober
*@version 0.4.4
*@description Automatically style your text like Homestuck trolls.
*/

//TODO:
// Remove old to-do list - DONE
// Comment everything - MOSTLY DONE UNTIL I ADD MORE STUFF
// Add extra handling to protect the user from themselves - DONE
// Remove the BDFDB Library stuff and replace it with our own code
	// 1. Replace the code that allows us to do the settings panel stuff - DONE
	// 2. Replace the code that allows us to do the message stuff
	// 3. Remove the code that gets the library

module.exports = (_ => {
	
	
	const changeLog = {
		/*
		Fixes:
		- Added more error handling.
		- Squashed bugs introduced by simplifying the settings structure.
		Shiny New Things:
		- Slowly working on removing the outside library dependencies.
		- Made the settings screen look good.
		- Simplified the settings structure.
		- Split the settings screen into two parts and moved the instructions for better clarity.
        */
	};
	
	const tempSettings = {
		prefix: "",
		suffix: "",
		searchReplace: ""
	};
	
	//Settings creation functions & variables
	
	const wrapperStyle = "margin-bottom: 8px; width: 100%;";
	const boxLabelStyle = "position: relative; display: inline; flex: 1 1 auto; color: var(--header-primary); line-height: 24px; font-size: 16px; display:inline-block; margin-left:0; margin-right: auto; width:45%;";
	const boxStyle = "position: relative; padding: 8px 8px 8px 8px; font-size: 16px; color: var(--header-secondary); background-color: var(--input-background); display:inline-block; margin-right:0; margin-left: auto; width:50%;";
	const noteHeaderStyle = "color: var(--header-primary); line-height: 12px; font-size: 14px; font-weight: bold; margin-top: 20px;";
	const noteStyle = "color: var(--header-secondary); line-height: 12px; font-size: 14px;";
	const titleStyle = "color: var(--header-primary); margin-bottom: 8px; font-size: 16px; font-weight: bold";
	const subsectionStyle = "margin-bottom: 16px; width: 100%;"
	
	function createSettingsPanel(box1, box2, box3, goop){
				
		//create the main div
		let settingsPanel = document.createElement("div");
		//set its id
		settingsPanel.id = "autoQuirk_Settings";
		
		//create the two subsections
		let simpleDiv = document.createElement("div");
		simpleDiv.style = subsectionStyle;
		
		let advancedDiv = document.createElement("div");
		advancedDiv.style = subsectionStyle;
		
		//create the two titles
		let simpleLabel = document.createElement("h1");
		simpleLabel.textContent = "Simple";
		simpleLabel.style = titleStyle;

		let advancedLabel = document.createElement("h1");
		advancedLabel.textContent = "Advanced";
		advancedLabel.style = titleStyle;
		
		//put the elements into their proper subsections
		simpleDiv.append(simpleLabel, box1, box2);
		
		advancedDiv.append(advancedLabel, box3, goop);
		
		//put the subsections into the main div
		settingsPanel.append(simpleDiv, advancedDiv);
		
		return settingsPanel;
	}
			
	function createTextBox(boxName, boxLabel, boxValue){
		//TO DO: Add CSS styling to elements
		
		//create a div to hold the text box stuff
		let textBoxElement = document.createElement("div");
		textBoxElement.classList.add("setting");
		textBoxElement.classList.add("fungustober");
		textBoxElement.style = wrapperStyle;
				
		//create the label for the text box
		let elementLabel = document.createElement("div");
		elementLabel.textContent = boxLabel;
		elementLabel.style = boxLabelStyle;
				
		//create the actual text box
		let elementInput = document.createElement("input");
		elementInput.type = "text";
		elementInput.name = boxName;
		elementInput.style = boxStyle;
		//add the data and a listener to update the data
		elementInput.value = boxValue;
		elementInput.addEventListener("change", () => {
			tempSettings[boxName] = elementInput.value;
			BdApi.Data.save("autoQuirk", "settings", tempSettings);
		});
		
		//parent the label and text box to the parent div
		textBoxElement.append(elementLabel, elementInput);
		
		//send the element back
		return textBoxElement;
	}
			
	function createNote(noteText, style){
		//TO DO: Add CSS styling to elements
		//div
		let noteElement = document.createElement("div");
		
		//create the actual text bit
		let textElement = document.createElement("span");
		textElement.textContent = noteText;
		textElement.style = style;
				
		noteElement.append(textElement);
		
		//send it back now
		return noteElement;
	}
	
	function createGroup(elementsToGroup){
		//create a div
		let groupElement = document.createElement("div");
		//give it the appropriate style
		groupElement.style = wrapperStyle;
		
		//shove the elements into it. Note: doesn't work with input boxes.
		for(let i=0; i<elementsToGroup.length; i++){
			//console.log(elementsToGroup[i]);
			let temp = elementsToGroup[i].outerHTML;
			//console.log(temp);
			groupElement.innerHTML += temp;
			//console.log(groupElement.innerHTML);
		}
		return groupElement;
	}

	return !window.BDFDB_Global || (!window.BDFDB_Global.loaded && !window.BDFDB_Global.started) ? class {
		constructor (meta) {for (let key in meta) this[key] = meta[key];}
		getName () {return this.name;}
		getAuthor () {return this.author;}
		getVersion () {return this.version;}
		getDescription () {return `You need to download the library for ${this.name}. You can get it by heading to the plugin settings.`;}
		
		downloadLibrary () {
			BdApi.Net.fetch("https://mwittrien.github.io/BetterDiscordAddons/Library/0BDFDB.plugin.js").then(r => {
				if (!r || r.status != 200) throw new Error();
				else return r.text();
			}).then(b => {
				if (!b) throw new Error();
				else return require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0BDFDB.plugin.js"), b, _ => BdApi.showToast("Finished downloading BDFDB Library", {type: "success"}));
			}).catch(error => {
				BdApi.alert("Error", "Could not download BDFDB Library Plugin. Try again later or download it manually from GitHub: https://mwittrien.github.io/downloader/?library");
			});
		}
		
		load () {
			if (!window.BDFDB_Global || !Array.isArray(window.BDFDB_Global.pluginQueue)) window.BDFDB_Global = Object.assign({}, window.BDFDB_Global, {pluginQueue: []});
			if (!window.BDFDB_Global.downloadModal) {
				window.BDFDB_Global.downloadModal = true;
				BdApi.showConfirmationModal("Library Missing", `The Library Plugin needed for ${this.name} is missing. Please click "Download" to install it.`, {
					confirmText: "Download Now",
					cancelText: "Cancel",
					onCancel: _ => {delete window.BDFDB_Global.downloadModal;},
					onConfirm: _ => {
						delete window.BDFDB_Global.downloadModal;
						this.downloadLibrary();
					}
				});
			}
			if (!window.BDFDB_Global.pluginQueue.includes(this.name)) window.BDFDB_Global.pluginQueue.push(this.name);
		}
		start () {this.load();}
		stop () {}
		getSettingsPanel () {
			let template = document.createElement("template");
			template.innerHTML = `<div style="color: var(--header-primary); font-size: 16px; font-weight: 300; white-space: pre; line-height: 22px;"><a style="font-weight: 500;">Download</a> the libraries required for this plugin by clicking download.</div>`;
			template.content.firstElementChild.querySelector("a").addEventListener("click", this.downloadLibrary);
			return template.content.firstElementChild;
		}
	} : (([Plugin, BDFDB]) => {
	
		return class AutoQuirk extends Plugin {
			
			onLoad(){
				this.defaults = {
					prefix:		{value: "", 	description: "Prefix"},
					suffix:		{value: "", 	description: "Suffix"},
					searchReplace: {value: "",	description: "Search/Replace", note1:"How to Use the Search/Replace:", note2:"- Put > between what you want to replace and what you want to replace it with. Example: E>3", note3:"- Put ; after each entry. Example: e>3;E>3;", note4:"- Put \\ before any > or ; that you use in the search/replace box. Example: e\\>>e-\\>;"}
				};
				this.modulePatches = {
					before: [
						"ChannelTextAreaContainer",
						"ChannelTextAreaEditor"
					],
					after: [
						"ChannelTextAreaContainer"
					]
				};
				let stngs = BdApi.Data.load("autoQuirk", "settings");
				tempSettings["prefix"] = stngs["prefix"];
				tempSettings["suffix"] = stngs["suffix"];
				tempSettings["searchReplace"] = stngs["searchReplace"];
			}
			
			onStart () {
				BDFDB.PatchUtils.forceAllUpdates(this);
				let stngs = BdApi.Data.load("autoQuirk", "settings");
				tempSettings["prefix"] = stngs["prefix"];
				tempSettings["suffix"] = stngs["suffix"];
				tempSettings["searchReplace"] = stngs["searchReplace"];
			}
			
			onStop () {
				BDFDB.PatchUtils.forceAllUpdates(this);
			}
			
			getSettingsPanel() {
				
				//get all of the information in short names so I don't have to write things over and over
				let pfix = this.defaults.prefix;
				let sfix = this.defaults.suffix;
				let srp = this.defaults.searchReplace;
				
				//load the settings
				let loadedSettings = BdApi.Data.load("autoQuirk", "settings");
				
				//put them into variables
				let pSettings = loadedSettings["prefix"];
				//and also load the temp settings with the correct values
				tempSettings["prefix"] = pSettings;
				let sSettings = loadedSettings["suffix"];
				tempSettings["suffix"] = sSettings;
				let rSettings = loadedSettings["searchReplace"];
				tempSettings["searchReplace"] = rSettings;
				
				//create all the different pieces and then jam them into the settings panel
				let settingsPanel = createSettingsPanel(
				createTextBox("prefix", pfix.description, pSettings),
				createTextBox("suffix", sfix.description, sSettings),
				createTextBox("searchReplace", srp.description, rSettings),
				createGroup([
				createNote(srp.note1, noteHeaderStyle),
				createNote(srp.note2, noteStyle),
				createNote(srp.note3, noteStyle),
				createNote(srp.note4, noteStyle)
				])
				);
				
				return settingsPanel;
			}
			
			processChannelTextAreaContainer (e) {
				if (!e.returnvalue) {
					console.log(e.instance.props);
					//when the user sends a message, instead
					BDFDB.PatchUtils.patch(this, e.instance.props, "onSubmit", {instead: e2 => {
						//check to see if there's actually text in the message, and that the user isn't editing the message
						//the first is done to prevent unneeded calculations
						//and the second is to prevent the prefix & suffix from applying ad infinitum
						if (e2.methodArguments[0].value != "" && e.instance.props.type.analyticsName != "edit"){
							//if the checks pass, stop discord from sending the message
							e2.stopOriginalMethodCall();
							//process the text
							let quirkMessage = this.formatText(e2.methodArguments[0].value);
							//then send the message but with the processed text instead
							e2.originalMethod(Object.assign({}, e2.methodArguments[0], {value: quirkMessage}));
							return Promise.resolve({
								shouldClear: true,
								shouldRefocus: true
							});
						}
						else return e2.callOriginalMethodAfterwards();
					}}, {noCache: true});
				}
			}
			
			formatText(messageText){
				//put the message into a variable
				let postProcess = messageText;
				//put the search/replace string into a variable
				let sr = tempSettings["searchReplace"];
				//TODO: Add various handlers for various cases
				//check to see if the user actually has anything in the search/replace text box
				if(sr != ""){
					//make sure that the search/replace string ends in ;
					if(!sr.match(/;$/)){
						sr += ";";
					}
					//instantiate variables for our process
						//keeps track of whether or not the user has used \ as an escape character
					let escaped = false;
						//the dictionary; hold the searchers and replacers
					let replace = {};
						//the buffer; temporarily holds text
					let active = [""];
					//iterate over the search/replace string
					for(let i=0; i<sr.length; i++){
						//put the current character into a temporary variable
						let currentChar = sr[i];
						//has the user entered an escape character?
						if(escaped){
							//if so, handle the following like normal text
							active[active.length-1] += currentChar;
							//then reset escaped
							escaped = false;
						}
						//otherwise
						else{
							//do things based on what the character is
							switch(sr[i]){
								//if it's a \, then
								case "\\":
									//tell the system the user has entered an escape character
									escaped = true;
									break;
								//if it's a >, then
								case ">":
									//check to see if we've already switched to the replacer portion of the buffer
									//(or, to put it simply, if the user forgot to escape the > in the replacer)
									if (active.length > 1){
										//if so, treat it like a normal character
										active[active.length-1] += currentChar;
									}
									//otherwise
									else{
										//put a blank into the end of the buffer, so we can separate the searcher and replacer
										active.push("");
									}
									break;
								//if it's a ;, then
								case ";":
									//check to see if we're still on the searcher portion of the buffer
									//(or, to put it simply, if the user forgot to escape the ; in the searcher)
									if (active.length == 1){
										//if so, treat it like a normal character
										active[active.length-1] += currentChar;
									}
									//otherwise
									else{
										//check to see if the searcher already exists
										if(replace.hasOwnProperty(active[0])){
											//if so, let the user know
											let errorMessage = `Searcher ${active[0]} has more than one replacer! `;
											errorMessage += "The second will overwrite the first.";
											BdApi.showToast(errorMessage, {type:"warning", timeout:5000});
										}
										//link the searcher and replacer in the dictionary
										replace[active[0]] = active[1];
										//reset the buffer
										active = [""];
									}
									break;
								//otherwise,
								default:
									//add the character to the end of the buffer
									active[active.length-1] += sr[i];
							}
						}
					}
					//once the s/r string has been operated on, loop through all the searchers in the dictionary
					for(let key in replace){
						//and then replace all instances of the searcher found in the message with the replacer
						postProcess = postProcess.replaceAll(key, replace[key]);
					}
				}
				//put the processed text into another variable
				let fText = postProcess;
				//has the user put something into the prefix box?
				if (tempSettings["prefix"] != ""){
					//if so, add it to the front of the string
					fText = tempSettings["prefix"] + fText;
				}
				//has the user put something into the suffix box?
				if (tempSettings["suffix"] != ""){
					//if so, add it to the end of the string
					fText += tempSettings["suffix"];
				}
				//return the final text
				return fText;
			}
			
		};
	})(window.BDFDB_Global.PluginUtils.buildPlugin(changeLog));
})();