/**
*@name autoQuirk
*@author Fungustober
*@version 0.1.0
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
//let the plugin automatically download the required libraries - 0.2.0
	//stop autoquirk from functioning if it doesn't have the libraries - 0.1.2
	//dummy class - 0.1.3
	//if function to grab the libraries - 0.1.4
//let the user specify simple search/replace commands -- put ;==>; between each entry and ;=>; between the searcher and the replacer 0.3.0
		//create another text prompt called searchReplace, description of Search/Replace, note of "Put ;=>; between the thing you want to replace and what you want to replace it with. Put ;==>; between different entries."
		//split searchReplace by ;==>; into an array
			//this goes before the suffix & prefix so they don't get messed up
		//go through each cell of the array and split them by ;=>; (s;=>;r) 0.2.2
			//then, replace each instance of s in the string with r.
	//great;=>;gr8;==>;ate;=>;8;==>;:);=>;::::)
//check for empty search/replace cells and disregard them - 0.3.1

//let the user do more advanced things

module.exports = (_ => {
	const changeLog = {
		
	};

	return (([Plugin, BDFDB]) => {
	
		return class SplitLargeMessages extends Plugin {
			
			onLoad(){
				this.defaults = {
					general: {
						prefix:		{value: "", 	description: "Prefix"},
						suffix:		{value: "", 		description: "Suffix"},
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
						
						return settingsItems;
						}
					});
			}
			
			processChannelTextAreaContainer (e) {
				if (!e.returnvalue) {
					BDFDB.PatchUtils.patch(this, e.instance.props, "onSubmit", {instead: e2 => {
						if(this.settings.general.prefix == "" && this.settings.general.suffix == ""){
							return e2.callOriginalMethodAfterwards();
						}else{
							e2.stopOriginalMethodCall();
							let quirkMessage = this.formatText(e2.methodArguments[0].value);
							e2.originalMethod({stickers: [], uploads: [], value: quirkMessage}); 
							return Promise.resolve({
								shouldClear: true,
								shouldRefocus: true
							});
						}
					}}, {noCache: true});
				}
			}
			
			formatText(text){
				let fText = this.settings.general.prefix + text + this.settings.general.suffix;
				return fText;
			}
			
		};
	})(window.BDFDB_Global.PluginUtils.buildPlugin(changeLog));
})();