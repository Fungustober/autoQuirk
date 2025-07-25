/**
 *@name autoQuirk
 *@author Fungustober
 *@version 1.0.3
 *@description Automatically styles your messages.
 */

//TODO:
// - Remove old to-do list - DONE
// - Comment everything - MOSTLY DONE UNTIL I ADD MORE STUFF
// - Add extra handling to protect the user from themselves - DONE
// - Remove the BDFDB Library stuff and replace it with our own code - DONE
// 		1. Replace the code that allows us to do the settings panel stuff - DONE
// 		2. Replace the code that allows us to do the message stuff - DONE
// 		3. Remove the code that gets the library - DONE
// - Create a changelog displayer - DONE
// - Figure out what's next - IN PROGRESS
// 		- Regex maybe?

// PLANNING FOR FUTURE FEATURES:
// Maybe the Regex should be its own box so we can have more than one thing in the advanced section
// So there's "simple search/replace" and "regex search/replace"
// Could it be split into two things? i.e. Regex Search & Regex Replace
// And we can define the area that a regex search/replace is in with something like /regexhere/, so /regex1here/ /regex2here/
// Problem 1: that conflicts with what is established in the simple search/replace
// Problem 2: this could create "desyncs" between the search and replace very easily
// We can do something like: /regex_searcher_here/ > /regex_replacer_here/;
// My main worry with that is that we could run into problems very easily where someone has to crawl through a lot of text to get to the one they
	// want to edit
// Can we make the textboxes have text wrap? yes
// Is there anything else we can add to the simple section? Prefix, suffix, ???
// What about a signature?
// You can have a forum signature thing, and then activate it by typing in a pre-determined character sequence
// Anything else?
// Can we define simple tags for colors?
// That seems dangerous. Would this be something that only happens on your end, or on everyone's end? I'm pretty sure discord text-ifies html tags
	// that get sent through sendMessage, so even if we wanted to, it wouldn't even work.

const pluginVersion = "1.0.3";

const changelog = {
	description: "Additional small changes.",
	updates: [
	],
	fixes: [
		"Added to the explanation of the Search/Replace function.",
		"Made the Search/Replace box multi-line for better user visibility."
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
const areaWrapperStyle = "margin-bottom: 8px; display: flex; align-items: top; margin-right: 10px;";
const boxLabelStyle = "position: relative; flex: 1 1 auto; color: var(--header-primary); line-height: 24px; font-size: 16px; display:inline-block; margin-left:0; margin-right: auto; width:45%;";
const areaLabelStyle = "position: relative; flex: 1 1 auto; color: var(--header-primary); line-height: 24px; font-size: 16px; display:inline-block; margin-left:0; margin-right: auto; width:45%;";
const boxStyle = "position: relative; padding: 8px 8px 8px 8px; font-size: 16px; color: var(--header-secondary); background-color: var(--input-background); display:inline-block; margin-right:0; margin-left: auto; width:50%;";
const areaStyle = "resize: none; position: relative; padding: 8px 8px 8px 8px; font-size: 16px; color: var(--header-secondary); background-color: var(--input-background); display:inline-block; margin-right:0; margin-left: auto; width:50%; flex: 1 1 auto;";
const noteHeaderStyle = "color: var(--header-primary); line-height: 12px; font-size: 14px; font-weight: bold; margin-top: 20px;";
const noteStyle = "color: var(--header-secondary); line-height: 14px; font-size: 14px;";
const exampleInitialStyle = "color: var(--text-muted); line-height: 12px; font-size: 12px; margin-left: 15px;";
const exampleStyle = "color: var(--text-muted); line-height: 12px; font-size: 12px; background-color: var(--input-background); padding-left: 5px; padding-right: 5px;"
const exampleNoteStyle = "color: var(--text-muted); line-height: 12px; font-size: 12px;";
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
                description: "Prefix",
				placeholder: "Enter text to add a prefix..."
            },
            suffix: {
                value: "",
                description: "Suffix",
				placeholder: "Enter text to add a suffix..."
            },
            searchReplace: {
                value: "",
                description: "Search/Replace",
                noteHeader: "How to Use the Search/Replace:",
                note1: "- Put > between what you want to replace and what you want to replace it with.", 
				example1a: "E>3",
				example1b: "This turns every E into 3.",
				note2: "- Put ; after each entry.",
				example2a: "e>3;E>3;",
				example2b: "This turns every e or E into 3.",
				note4: "- Don't put spaces between your text and the > or ;, unless you want to have extra spaces in your text.",
				example4a: "e > E ; b > B ;",
				example4b: "This turns only \"e \" into \" E \" and only \" b \" into \" B \".",
                note3: "- Put \\ before any > or ; that you want to be replaced or replace something.",
				example3a: "e\\>>e-\\>;'>\\;;",
				example3b: "This turns every e> into e-> and every ' into ;.",
				placeholder: "Add search/replace statements here..."
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
			//do the changelog showing first, so if there's an error during its execution, the user will still be able to see the changelog later
			this.showChangelog();
			//set the plugin version in temporary memory
			tempSettings["pluginVersion"] = pluginVersion;
			//then write it to permanent memory to make sure the user won't get the popup every time the plugin starts
			BdApi.Data.save("autoQuirk", "settings", tempSettings);
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
                this.createTextBox("prefix", pfix.description, pSettings, pfix.placeholder),
                this.createTextBox("suffix", sfix.description, sSettings, sfix.placeholder),
                this.createTextArea("searchReplace", srp.description, rSettings, srp.placeholder),
                this.createGroup([
                        this.createNote(srp.noteHeader, noteHeaderStyle),
                        this.createNote(srp.note1, noteStyle),
						this.createExample(srp.example1a, srp.example1b),
                        this.createNote(srp.note2, noteStyle),
						this.createExample(srp.example2a, srp.example2b),
						this.createNote(srp.note4, noteStyle),
						this.createExample(srp.example4a, srp.example4b),
                        this.createNote(srp.note3, noteStyle),
						this.createExample(srp.example3a, srp.example3b)
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
						//if it's a \n (somehow), then
					case "\n":
						//do nothing, skip it
						break;
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

    createTextBox(boxName, boxLabel, boxValue, boxPlaceholder = null) {
		//create a div to hold the text box stuff
        let textBoxElement = document.createElement("div");
        textBoxElement.classList.add("setting");
        textBoxElement.classList.add("fungustober");
        textBoxElement.style = wrapperStyle;

        //create the label for the text box
        let elementLabel = document.createElement("div");
        elementLabel.textContent = boxLabel;
        elementLabel.style = boxLabelStyle;
		elementLabel.for = boxName;

        //create the actual text box
        let elementInput = document.createElement("input");
        elementInput.type = "text";
        elementInput.name = boxName;
		if (boxPlaceholder != null){
			elementInput.placeholder = boxPlaceholder;
		}
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

	createTextArea(areaName, areaLabel, areaValue, areaPlaceholder = null) {
		//div
		let textAreaElement = document.createElement("div");
		textAreaElement.classList.add("setting");
		textAreaElement.classList.add("fungustober");
		textAreaElement.style = areaWrapperStyle;
		
		//label
		let elementLabel = document.createElement("div");
		elementLabel.textContent = areaLabel;
		elementLabel.style = areaLabelStyle;
		elementLabel.for = areaName;
		
		//text
		let areaInput = document.createElement("textarea");
		areaInput.name = areaName;
		areaInput.id = areaName;
		//TODO: maybe let the user control how many rows there are?
		areaInput.rows = 5;
		if (areaPlaceholder != null){
			areaInput.placeholder = areaPlaceholder;
		}
		areaInput.style = areaStyle;
		areaInput.value = areaValue;
		areaInput.addEventListener("change", () => {
			tempSettings[areaName] = areaInput.value;
			BdApi.Data.save("autoquirk", "settings", tempSettings);
		});
		
		//parent
		textAreaElement.append(elementLabel, areaInput);
		
		//return
		return textAreaElement;
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
	
	createExample(exampleText, exampleNoteText = null) {
		//exampleNoteText is nullable, just in case
		
		//div
		let exElement = document.createElement("div");
		
		//start creating the example text
		let textElement = document.createElement("span");
		textElement.textContent = "Example: ";
		textElement.style = exampleInitialStyle;
		
		//create the example
		let example = document.createElement("span");
		example.textContent = exampleText;
		example.style = exampleStyle;
		
		//create the example note, if it exists
		if (exampleNoteText != null){
			let noteElement = document.createElement("span");
			noteElement.textContent = " — " + exampleNoteText;
			noteElement.style = exampleNoteStyle;
			
			//stitch it together
			exElement.append(textElement, example, noteElement);
		}else{
			//stitch it together, but without the out-of-scope noteElement, so no errors occur
			exElement.append(textElement, example);
		}
		
		//then send it back
		return exElement;
	}

    createGroup(elementsToGroup) {
		//create a div
        let groupElement = document.createElement("div");
        //give it the appropriate style
        groupElement.style = wrapperStyle;

        //shove the elements into it. Note: doesn't work with input boxes.
        for (let i = 0; i < elementsToGroup.length; i++) {
            let temp = elementsToGroup[i];
            //apparently you can just do this and it works fine
			//I have a memory of this not working for some reason, but I must have misremembered
			groupElement.appendChild(temp);
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
			let temp = listElement;
			list.appendChild(listElement);
		//console.log(list);
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
		//define updateSection and fixSection up here to stop any scope issues
		let updateSection = null;
		let fixSection = null;
		
		let updatesNotNull = false;
		let fixesNotNull = false;
		
		//create the header, list, and group for the updates section if there are updates
		if (changelog["updates"].length > 0)
		{
			updatesNotNull = true;
			let updateTitle = this.createNote("Updates:", logTitleStyle);
			let updateList = this.createList(changelog["updates"], listStyle);
			updateSection = this.createGroup([updateTitle, updateList]);
		}
		
		//create the header, list, and group for the fixes section if there are fixes
		if (changelog["fixes"].length > 0)
		{
			fixesNotNull = true;
			let fixTitle = this.createNote("Fixes:", logTitleStyle);
			let fixList = this.createList(changelog["fixes"], listStyle);
			fixSection = this.createGroup([fixTitle, fixList]);
		}
		
		//create a main holder div and put everything into it
		let mainDiv = document.createElement("div");
		//add the header to the mainDiv
		mainDiv.append(header);
		//if there's updates, add them to the mainDiv
			//technically the == true is redundant here, but I've had a number of incidents with programming in the past where just if(bool)
			//doesn't work right, so I do this just in case
		if (updatesNotNull == true){
			mainDiv.append(updateSection);
		}
		//if there's fixes, add them to the mainDiv
		if (fixesNotNull == true){
			mainDiv.append(fixSection);
		}
		
		//convert the html into react
		let reactComponent = BdApi.React.createElement(BdApi.ReactUtils.wrapElement(mainDiv)); 
		//create the changelog itself 
		BdApi.UI.alert("autoQuirk", reactComponent);
	}
};
