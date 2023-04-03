---
title: "API Example: Annotations"
summary: "Use API functions to control annotations."
weight: 130
---

#### Try it out:

{{< explorer "d8c62be8-4ebc-11ea-b77f-2e728ce88125" >}}  <br>
  
Activate an annotation by specifying the unique id of a specific annotation in the box below and clicking the "Activate" button.
For the example model try the ids "ELDyp7AvKp8A" or "Y1KN8HQHKaxT".

If the id supplied is not valid, no annotation will be activated (and as a resulted, any currently activated one will be deactivated).

Depending on the annotation style, activating may also expand the annotation to reveal additional text. 
To find unknown annotation ids try the getAnnotations() function. [See an example here](../get-content) on how to use it.  

{{< input-submit "Activate" "setActiveAnnotation" "Annotation_ID">}}  <br>

#### How it works:
See the annotated javascript from this page below for how to use the [setActiveAnnotation(id) function](../../api).

{{<highlight js>}}
function setActiveAnnotation(id) {
	// Get reference to the Explorer element by id
	var voyagerElement = document.getElementById("voyager");
	
	// Call the setActiveAnnotation function with the value of the 
	// option input element as the parameter
	voyagerElement.setActiveAnnotation(id.value);
}
{{</highlight>}}
