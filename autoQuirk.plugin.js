/**
 *@name autoQuirk
 *@author Fungustober
 *@version 1.0.0
 *@description Automatically style your text like Homestuck trolls.
 */

//TODO:
// - Remove old to-do list - DONE
// - Comment everything - MOSTLY DONE UNTIL I ADD MORE STUFF
// - Add extra handling to protect the user from themselves - DONE
// - Remove the BDFDB Library stuff and replace it with our own code
// 		1. Replace the code that allows us to do the settings panel stuff - DONE
// 		2. Replace the code that allows us to do the message stuff - DONE
// 		3. Remove the code that gets the library - DONE
// - Create a changelog displayer

const pluginVersion = "1.0.0";

const changelog = {
	description: "With the release of version 1.0.0, autoQuirk has been revamped significantly. Here's what's been fixed or added in this update and previous updates that led up to this update.",
	updates: [
		"Reworked the settings screen code to no longer rely on outside libraries. (v0.4.2)",
		"Improved the look of the settings screen. (v0.4.3)",
		"Split the settings screen into two parts and moved the instructions for better clarity. (v0.4.4)",
		"Reworked the patching code to no longer rely on outside libraries. (v1.0.0)",
		"Added a changelog displaying system. (v1.0.0)"
	],
	fixes: [
		"Added more error handling to help make sure the user can't run into errors caused by weird edge cases. (v0.4.0)",
		"Simplified the settings structure. (v0.4.3)",
		"Squashed some bugs introduced by simplifying the settings structure. (v0.4.4)",
		"Added comments everywhere. (v0.4.0, v0.4.1, v0.4.2, v0.4.3, v0.4.4, v1.0.0)"
	]
};

const tempSettings = {
	pluginVersion: "0",
    prefix: "",
    suffix: "",
    searchReplace: ""
};

//styling constants for the settings menu
const wrapperStyle = "margin-bottom: 8px; width: 100%;";
const boxLabelStyle = "position: relative; display: inline; flex: 1 1 auto; color: var(--header-primary); line-height: 24px; font-size: 16px; display:inline-block; margin-left:0; margin-right: auto; width:45%;";
const boxStyle = "position: relative; padding: 8px 8px 8px 8px; font-size: 16px; color: var(--header-secondary); background-color: var(--input-background); display:inline-block; margin-right:0; margin-left: auto; width:50%;";
const noteHeaderStyle = "color: var(--header-primary); line-height: 12px; font-size: 14px; font-weight: bold; margin-top: 20px;";
const noteStyle = "color: var(--header-secondary); line-height: 14px; font-size: 14px;";
const titleStyle = "color: var(--header-primary); margin-bottom: 8px; font-size: 16px; font-weight: bold";
const subsectionStyle = "margin-bottom: 16px; width: 100%;"

//styling constants for the changelog
const updateNumStyle = "color: var(--header-primary); font-size: 18px; font-weight:bold";
const logTitleStyle = "color: var(--header-primary); font-size: 18px; font-weight:bold";
const listStyle = "color: var(--header-secondary); line-height: 16px; font-size: 14px;";

module.exports = class autoQuirk {
    load() {
        this.defaults = {
            prefix: {
                value: "",
                description: "Prefix"
            },
            suffix: {
                value: "",
                description: "Suffix"
            },
            searchReplace: {
                value: "",
                description: "Search/Replace",
                note1: "How to Use the Search/Replace:",
                note2: "- Put > between what you want to replace and what you want to replace it with. Example: E>3",
                note3: "- Put ; after each entry. Example: e>3;E>3;",
                note4: "- Put \\ before any > or ; that you use in the search/replace box. Example: e\\>>e-\\>;"
            }
        };
    }

    start() {
        //retrieve the module with sendMessage in it
        let messageModule = BdApi.Webpack.getByKeys("sendMessage");
        //patch sendMessage so before it executes, we are able to perform our needed calculations
        BdApi.Patcher.before("autoQuirk", messageModule, "sendMessage", (thisObject, args) => {
            //apply the quirk rules to the text
            let formattedMessage = this.formatText(args[1].content);
            //then set the message to the formatted text
            args[1].content = formattedMessage;
        });
        //make absolutely sure that we load in the data
        let stngs = BdApi.Data.load("autoQuirk", "settings");
        tempSettings["prefix"] = stngs["prefix"];
        tempSettings["suffix"] = stngs["suffix"];
        tempSettings["searchReplace"] = stngs["searchReplace"];
		tempSettings["pluginVersion"] = stngs["pluginVersion"];
		//check to see if the user has had a previous version the program
		if (tempSettings["pluginVersion"] != pluginVersion){
			tempSettings["pluginVersion"] = pluginVersion;
			BdApi.Data.save("autoQuirk", "settings", tempSettings);
			this.showChangelog();	
		}
    }

    stop() {
        //remove the sendMessage patch from memory
        BdApi.Patcher.unpatchAll("autoQuirk");
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
        let settingsPanel = this.createSettingsPanel(
                this.createTextBox("prefix", pfix.description, pSettings),
                this.createTextBox("suffix", sfix.description, sSettings),
                this.createTextBox("searchReplace", srp.description, rSettings),
                this.createGroup([
                        this.createNote(srp.note1, noteHeaderStyle),
                        this.createNote(srp.note2, noteStyle),
                        this.createNote(srp.note3, noteStyle),
                        this.createNote(srp.note4, noteStyle)
                    ]));

        return settingsPanel;
    }

    formatText(messageText) {
        //put the message into a variable
        let postProcess = messageText;
        //put the search/replace string into a variable
        let sr = tempSettings["searchReplace"];
        //TODO: Add various handlers for various cases
        //check to see if the user actually has anything in the search/replace text box
        if (sr != "") {
            //make sure that the search/replace string ends in ;
            if (!sr.match(/;$/)) {
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
            for (let i = 0; i < sr.length; i++) {
                //put the current character into a temporary variable
                let currentChar = sr[i];
                //has the user entered an escape character?
                if (escaped) {
                    //if so, handle the following like normal text
                    active[active.length - 1] += currentChar;
                    //then reset escaped
                    escaped = false;
                }
                //otherwise
                else {
                    //do things based on what the character is
                    switch (sr[i]) {
                        //if it's a \, then
                    case "\\":
                        //tell the system the user has entered an escape character
                        escaped = true;
                        break;
                        //if it's a >, then
                    case ">":
                        //check to see if we've already switched to the replacer portion of the buffer
                        //(or, to put it simply, if the user forgot to escape the > in the replacer)
                        if (active.length > 1) {
                            //if so, treat it like a normal character
                            active[active.length - 1] += currentChar;
                        }
                        //otherwise
                        else {
                            //put a blank into the end of the buffer, so we can separate the searcher and replacer
                            active.push("");
                        }
                        break;
                        //if it's a ;, then
                    case ";":
                        //check to see if we're still on the searcher portion of the buffer
                        //(or, to put it simply, if the user forgot to escape the ; in the searcher)
                        if (active.length == 1) {
                            //if so, treat it like a normal character
                            active[active.length - 1] += currentChar;
                        }
                        //otherwise
                        else {
                            //check to see if the searcher already exists
                            if (replace.hasOwnProperty(active[0])) {
                                //if so, let the user know
                                let errorMessage = `Searcher ${active[0]} has more than one replacer! `;
                                errorMessage += "The second will overwrite the first.";
                                BdApi.showToast(errorMessage, {
                                    type: "warning",
                                    timeout: 5000
                                });
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
                        active[active.length - 1] += sr[i];
                    }
                }
            }
            //once the s/r string has been operated on, loop through all the searchers in the dictionary
            for (let key in replace) {
                //and then replace all instances of the searcher found in the message with the replacer
                postProcess = postProcess.replaceAll(key, replace[key]);
            }
        }
        //put the processed text into another variable
        let fText = postProcess;
        //has the user put something into the prefix box?
        if (tempSettings["prefix"] != "") {
            //if so, add it to the front of the string
            fText = tempSettings["prefix"] + fText;
        }
        //has the user put something into the suffix box?
        if (tempSettings["suffix"] != "") {
            //if so, add it to the end of the string
            fText += tempSettings["suffix"];
        }
        //return the final text
        return fText;
    }

    //Settings creation functions

    createSettingsPanel(box1, box2, box3, goop) {

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

    createTextBox(boxName, boxLabel, boxValue) {
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

    createNote(noteText, style) {
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

    createGroup(elementsToGroup) {
        //create a div
        let groupElement = document.createElement("div");
        //give it the appropriate style
        groupElement.style = wrapperStyle;

        //shove the elements into it. Note: doesn't work with input boxes.
        for (let i = 0; i < elementsToGroup.length; i++) {
            let temp = elementsToGroup[i].outerHTML;
            groupElement.innerHTML += temp;
        }
        return groupElement;
    }
	
	createList(listItems, itemStyle){
		let list = document.createElement("ul");
		list.style = itemStyle;
		for(let item in listItems){
			let listElement = document.createElement("li");
			listElement.textContent = "    - " + listItems[item];
			listElement.style = "margin-bottom: 4px;";
			let temp = listElement.outerHTML;
			list.append(listElement);
		console.log(list);
		}
		return list;
	}
	
	//changelog functions
	showChangelog(){
		//create the version title
		let versionNum = this.createNote("Update v"+pluginVersion, updateNumStyle);
		//create the version description
		let logDescription = this.createNote(changelog["description"], noteStyle);
		let header = this.createGroup([versionNum, logDescription]);
		
		//create the headers for the updates section and the fixes section
		let updateTitle = this.createNote("Updates:", logTitleStyle);
		let fixTitle = this.createNote("Fixes:", logTitleStyle);
		
		//create the lists of updates and fixes
		let updateList = this.createList(changelog["updates"], listStyle);
		let fixList = this.createList(changelog["fixes"], listStyle);
		
		let updateSection = this.createGroup([updateTitle, updateList]);
		let fixSection = this.createGroup([fixTitle, fixList]);
		
		//create a main holder div and put everything into it
		let mainDiv = document.createElement("div");
		mainDiv.append(header, updateSection, fixSection);
		
		//convert the html into react
		let reactComponent = BdApi.React.createElement(BdApi.ReactUtils.wrapElement(mainDiv)); 
		//create the changelog itself 
		BdApi.UI.alert("autoQuirk", reactComponent);
	}
};
