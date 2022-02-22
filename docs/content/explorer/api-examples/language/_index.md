---
title: "API Example: Set Language"
summary: "Use API functions to set the active language."
weight: 130
---

#### Try it out:

{{< explorer "92c986d0-2b8d-43c1-8354-e9a2e80d0f9e">}}  <br>
  
Change the active language for content and UI elements by entering a supported language code in the box below and clicking the "Set Language" button.

The [setLanguage()](../../api) function uses language codes from the [ISO 639-1 Code standard](https://www.loc.gov/standards/iso639-2/php/code_list.php).
Keep in mind that a language will only be available if the scene contains content in that language. This example scene has both English (en) and Spanish (es) content.

{{< input-submit "Set Language" "setLanguage" "language">}}  <br>

#### How it works:
See the annotated javascript from this page below for how to use the [setLanguage() function](../../api).

{{<highlight js>}}
function setTourStep(stepIdx) {
	// Get reference to the Explorer element by id
	var voyagerElement = document.getElementById("voyager");
	
	// Call the setTourStep function with the value of the 
	// option input element as the parameter.
	// **Note the hard-coded tour index and interpolate flag.
	voyagerElement.setTourStep(0, stepIdx.value, true);
}
{{</highlight>}}
