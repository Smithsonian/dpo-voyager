---
title: "API Example: UI Configuration"
summary: "How to use the 'uiMode' attribute to customize the UI displayed on initial load of Explorer."
weight: 130
---

#### Try it out:

{{< explorer "d8c636ce-4ebc-11ea-b77f-2e728ce88125" >}}  <br>
  
Enter any combination of [EUIElements](https://github.com/Smithsonian/dpo-voyager/blob/master/source/client/components/CVInterface.ts) values (none, menu, title, logo, language) in the input box below and click "Update UI" to refresh the page with that UI config. Use “|” to concatenate multiple options.
{{< input-submit "Update UI" "updateUI" "Elements" >}}

#### How it works:
The 'uiMode' attribute can either be set directly on the Voyager Explorer component, or can be passed in as a URL parameter. For this example we chose to do the latter and append the parameter to the window location and refresh the page.

{{<highlight js>}}
function updateUI(textinput) {
	window.location = window.location.pathname + "?uiMode=" + textinput.value;
}
{{</highlight>}}

The code below shows option two with the example tag uiMode attribute directly set to display no UI.  

{{<highlight html>}}
<voyager-explorer style="display: block; position: relative; height: 450px" root="https://3d-api.si.edu/content/document/d8c636ce-4ebc-11ea-b77f-2e728ce88125/document.json" uiMode="none" dracoroot="https://voyager-dev.glitch.me/draco/" document="document.json"></voyager-explorer>
{{</highlight>}}
