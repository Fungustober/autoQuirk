/**
*@name autoQuirk
*@author Fungustober
*@version 0.4.0
*@description Automatically style your text like Homestuck trolls.
*/

//TODO:
// Remove old to-do list - DONE
// Comment everything
// Add extra handling to protect the user from themselves - DONE
// Remove the BDFDB Library stuff and replace it with our own code
	// 1. Replace the code that allows us to do the message stuff
	// 2. Replace the code that allows us to do the settings panel stuff
	// 3. Remove the code that gets the library

module.exports = (_ => {
	const changeLog = {
		/*
		Fixes:
        Added more error handling.
        */
	};

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
					general: {
						prefix:		{value: "", 	description: "Prefix"},
						suffix:		{value: "", 	description: "Suffix"},
					},
					sr: {
						searchReplace: {value: "",	description: "Search/Replace", note:"Put > between searcher and replacer. Put ; between entries. DO NOT PUT A SPACE BETWEEN THE ; AND THE NEXT ENTRY. Put \\ before any > or ; that you want to be replaced by something else or replace something else."},
					}
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
			}
			
			onStart () {
				BDFDB.PatchUtils.forceAllUpdates(this);
			}
			
			onStop () {
				BDFDB.PatchUtils.forceAllUpdates(this);
			} 
			
			getSettingsPanel(collapseStates = {}) {
					let settingsPanel;
					return settingsPanel = BDFDB.PluginUtils.createSettingsPanel(this, {
						collapseStates: collapseStates,
						children: _ => {
							let settingsItems = [];
						
						for (let key in this.defaults.general) settingsItems.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SettingsSaveItem, {
							type: "TextInput",
							keys: ["general", key],
							plugin: this,
							label: this.defaults.general[key].description,
							value: this.settings.general[key]
						}));
						
						settingsItems.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SettingsSaveItem, {
							type: "TextInput",
							keys: ["sr", "searchReplace"],
							plugin: this,
							label: this.defaults.sr.searchReplace.description,
							note: this.defaults.sr.searchReplace.note,
							value: this.settings.sr.searchReplace
						}));
						
						return settingsItems;
						}
					});
			}
			
			processChannelTextAreaContainer (e) {
				if (!e.returnvalue) {
					console.log(e.instance.props);
					BDFDB.PatchUtils.patch(this, e.instance.props, "onSubmit", {instead: e2 => {
						if (e2.methodArguments[0].value != "" && e.instance.props.type.analyticsName != "edit"){
							e2.stopOriginalMethodCall();
							let quirkMessage = this.formatText(e2.methodArguments[0].value);
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
			
			formatText(text){
				//put the message into a variable
				let postProcess = text;
				//put the search/replace string into a variable
				let sr = this.settings.sr.searchReplace;
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
				if (this.settings.general.prefix != ""){
					//if so, add it to the front of the string
					ftext = this.settings.general.prefix + ftext;
				}
				//has the user put something into the suffix box?
				if (this.settings.general.suffix != ""){
					//if so, add it to the end of the string
					fText += this.settings.general.suffix;
				}
				//return the final text
				return fText;
			}
			
		};
	})(window.BDFDB_Global.PluginUtils.buildPlugin(changeLog));
})();