---
title: "API Example: Background Properties"
summary: "How to use change the component background properties using the API"
weight: 130
---

#### Try it out:

{{< explorer "d8c636ce-4ebc-11ea-b77f-2e728ce88125" "bgColor='red #000' bgStyle='LinearGradient'">}}  <br>

The background style and colors in this component are set via [attribute](../../api) as shown in the code block below. Background color can be defined in any standard css color format. The example demonstrates this by using both keyword for color0 and hex for color1.

{{<highlight js>}}
<voyager-explorer id="voyager" style="display: block; position: relative; height: 450px" 
	bgcolor="red #000" bgstyle="LinearGradient" root="https://3d-api.si.edu/content/document/d8c636ce-4ebc-11ea-b77f-2e728ce88125/" 
	document="document.json">
{{</highlight>}}  
  
Set a new background style (Solid, LinearGradient, RadialGradient) and click 'Set Style' to apply it to the component.
Depending on the active style, set the primary and secondary colors and click 'Set Color' to apply.
{{< option-submit "Style" "Set Style" "setBackgroundStyle" "Solid" "LinearGradient" "RadialGradient">}}

{{< two-color-submit "Color0" "Color1" "setBackgroundColor" "Set Color">}}

#### How it works:
Below we will break down the javascript from this page that makes use of the [setBackgroundColor() and setBackgroundStyle()](../../api) API functions.

Note that in each case the respective HTML input elements are passed in to provide access to the user input.

{{<highlight js>}}
function setBackgroundStyle(style) {
	// Get reference to the Explorer element by id
	var voyagerElement = document.getElementById("voyager");
	
	// Call the style function with the value of the 
	// option input element as the parameter
	voyagerElement.setBackgroundStyle(style.value);
}
{{</highlight>}}

To set the color we follow the same pattern. Pass in the two color inputs and find the Explorer element.  

{{<highlight js>}}
function setBackgroundColor(color0,color1) {
	// Get reference to the Explorer element by id
	var voyagerElement = document.getElementById("voyager");
	
	// Call the color function with the color input
	// element current values
	voyagerElement.setBackgroundColor(color0.value, color1.value);
}
{{</highlight>}}
