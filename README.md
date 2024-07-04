# autoQuirk
A discord plugin that automatically styles your text like Homestuck trolls. Currently it lets you specify a prefix and/or a suffix to add to your message, as well as having a search and replace function that lets you change out various strings for others. It works like the following:

<img width="443" alt="quirk setup screen" src="https://github.com/Fungustober/autoQuirk/blob/main/example%201.png">
<img width="443" alt="quirk example" src="https://github.com/Fungustober/autoQuirk/blob/main/example%202.png">

Anything before the > is the text that you want to replace. Anything after the > but before the ; is what you want to replace that text with. If you want to replace > or ; you'll need to put \ before them, like so:

A\\>>A-\\>;A\\;>A:;     This turns A> into A-> and A; into A:

Warning: If you try placing a space between a ; and the next entry (like a>4; e>3;) then it will factor that space into the text to be replaced, meaning it will only replace instances of " e" and not "e".
