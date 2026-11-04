---
title: "API Example: Toggle Displays"
summary: "Use API functions to turn on/off functionality without the native UI"
weight: 130
---

#### Try it out:

{{< explorer "d8c62be8-4ebc-11ea-b77f-2e728ce88125" >}}  <br>
  
Click any of the buttons below to toggle on and of the respective functionality. This is especially useful if you [launch Explorer without the related UI visible](../ui-config/).  

{{< control-div "toggle-wrapper" >}}
{{< function-button "Annotations" "toggleAnnotations" >}}
{{< function-button "Tours" "toggleTours" >}}
{{< function-button "Reader" "toggleReader" >}}
{{< function-button "Tools" "toggleTools" >}}
{{< /control-div >}}

#### How it works:
Each toggle button function starts with finding the Voyager Explorer element based on id and then calls the relevant function on the object. Code examples from this page shown below.

{{<highlight js>}}
function toggleAnnotations() {
	var voyagerElement = document.getElementById("voyager");
	voyagerElement.toggleAnnotations();
}
function toggleReader() {
	var voyagerElement = document.getElementById("voyager");
	voyagerElement.toggleReader();
}
function toggleTours() {
	var voyagerElement = document.getElementById("voyager");
	voyagerElement.toggleTours();
}
function toggleTools() {
	var voyagerElement = document.getElementById("voyager");
	voyagerElement.toggleTools();
}
{{</highlight>}}

#### Enabling features explicitly

If you need to set a feature to a specific state rather than flipping its current state, use the `set*Enabled` counterparts. These are especially useful when integrating Voyager into a custom UI where you need predictable behavior regardless of the current state.

{{<highlight js>}}
// Ensure annotations are visible before activating one
voyagerElement.setAnnotationsEnabled(true);

// Hide the tools panel
voyagerElement.setToolsEnabled(false);

// Other available functions:
// voyagerElement.setReaderEnabled(true/false);
// voyagerElement.setToursEnabled(true/false);
// voyagerElement.setMeasurementEnabled(true/false);
{{</highlight>}}

The same mutual-exclusion rules apply as with the toggle functions: enabling annotations will hide the tools panel, and enabling tools will hide annotations.
	

