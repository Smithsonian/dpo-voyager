---
title: "API Example: Tours"
summary: "Use API functions to control tours."
weight: 130
---

#### Try it out:

{{< explorer "e7514eea-3f12-490d-a2d0-999f2a1a70f7" "uiMode='None'">}}  <br>
  
Activate a tour step by entering a tour step index in the box below and clicking the "Activate" button.

The [setTourStep()](../../api) function also allows for specifying the tour index (for the purposes of this demo we have hard coded it to 0),
and an optional 'interpolate' flag to indicate if the viewer should animate or jump directly to the next scene state (defaults to 'True').

{{< input-submit "Activate" "setTourStep" "step">}}  <br>

#### How it works:
See the annotated javascript from this page below for how to use the [setTourStep() function](../../api).

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
