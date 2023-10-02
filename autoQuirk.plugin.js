/**
*@name autoQuirk
*@author Fungustober
*@version 0.2.1
*@description Automatically style your text like Homestuck trolls.
*/

//minimum viable product todo: 
//get a prefix and suffix option - DONE
//if there's no prefix or suffix, don't do anything - DONE
//otherwise, catch the message as it's being sent - DONE
//add the prefix to the beginning if there is one, and add the suffix to the end if there is one - DONE
//send the message for real this time - DONE


//things todo after that:
//upload to github
//let the plugin automatically download the required libraries - DONE
//let the user specify simple search/replace commands -- put ;==>; between each entry and ;=>; between the searcher and the replacer - DONE
		//create another text prompt called searchReplace, description of Search/Replace, note of "Put ;=>; between the thing you want to replace and what you want to replace it with. Put ;==>; between different entries."
		//split searchReplace by ;==>; into an array
			//this goes before the suffix & prefix so they don't get messed up
		//go through each cell of the array and split them by ;=>; (s;=>;r) - DONE
			//then, replace each instance of s in the string with r.
	//great;=>;gr8;==>;ate;=>;8;==>;:);=>;::::)
//check for empty search/replace cells and disregard them - DONE

//let the user do more advanced things
	//turn the searcher of a searchReplaceKey into a regex statement so users can use regex

module.exports = (_ => {
	const changeLog = {
		/*
		New Additions:
		You can now specify multiple Search and Replace expressions by separating them with ;==>;
		
		Fixes:
        Editing a message now no longer adds a prefix and/or a suffix.
		Users can now send files and stickers while this plugin is active (whoops).
        */
	};

	return !window.BDFDB_Global || (!window.BDFDB_Global.loaded && !window.BDFDB_Global.started) ? class {
		constructor (meta) {for (let key in meta) this[key] = meta[key];}
		getName () {return this.name;}
		getAuthor () {return this.author;}
		getVersion () {return this.version;}
		getDescription () {return `You need to download the library for ${this.name}. You can get it by heading to the plugin settings.`;}
		
		downloadLibrary () {
			require("request").get("https://mwittrien.github.io/BetterDiscordAddons/Library/0BDFDB.plugin.js", (e, r, b) => {
				if (!e && b && r.statusCode == 200) require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0BDFDB.plugin.js"), b, _ => BdApi.showToast("Finished downloading BDFDB Library", {type: "success"}));
				else BdApi.alert("Error", "Could not download BDFDB Library Plugin. Try again later or download it manually from GitHub: https://mwittrien.github.io/downloader/?library");
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
	
		return class SplitLargeMessages extends Plugin {
			
			onLoad(){
				this.defaults = {
					general: {
						prefix:		{value: "", 	description: "Prefix"},
						suffix:		{value: "", 	description: "Suffix"},
					},
					sr: {
						searchReplace: {value: "",	description: "Search/Replace", note:"Put ;=>; between searcher and replacer. Put ;==>; between entries."},
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
							console.log(e2.methodArguments[0]);
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
				let preProcess = text;
				let postProcess = "";
				if(this.settings.sr.searchReplace != ""){
					postProcess = preProcess;
					let searchReplaceList = this.settings.sr.searchReplace.split(";==>;");
					for (let srKey in searchReplaceList){
						let searchReplaceKey = searchReplaceList[srKey].split(";=>;");
						if (searchReplaceKey.length > 1){
							postProcess = postProcess.replaceAll(searchReplaceKey[0], searchReplaceKey[1]);
						}
					}
				}else{
					postProcess = preProcess;
				}
				let fText = postProcess;
				if (this.settings.general.prefix != "" || this.settings.general.suffix != ""){
					fText = this.settings.general.prefix + postProcess + this.settings.general.suffix;
				}
				return fText;
			}
			
		};
	})(window.BDFDB_Global.PluginUtils.buildPlugin(changeLog));
})();