---
title: "API Example: Camera Offset"
summary: "Use API functions to get or set the Explorer active camera offset."
weight: 130
---

#### Try it out:

{{< explorer "d8c636ce-4ebc-11ea-b77f-2e728ce88125" >}}  <br>
  
Orient the scene above to the desired view and then click the button below to get the current offset values.  

{{< control-div "offset-wrapper" >}}
	{{< function-button "Get Camera Offset" "getCameraOffset" "offsetDisplay">}}
{{< /control-div >}}  

{{< control-div "offsetDisplay" >}}{{< /control-div >}}  <br>

Enter offset values in the boxes below and click the button to immediately update the camera offset in the example. Values outside of the limits imposed by the scene will be clamped to the min/max.

{{< input-submit "Set Camera Offset" "setCameraOffset" "X" "Y" "Z">}}  <br>

#### How it works:
See the annotated javascript from this page below for one way to use the ['get' and 'set' camera offset functions](../../api).

Getting and displaying camera offset:
{{<highlight js>}}
function getCameraOffset(displayElement) {
	// Get Explorer element by id
	var voyagerElement = document.getElementById("voyager");
	// Call getCameraOffset() on the object and store the resulting array
	const offset = voyagerElement.getCameraOffset();
	
	// Format the offset values and assign to the inner 
	// text of the passed in display element
	displayElement.innerText = "X: " + offset[0].toFixed(3) + "	Y: " + offset[1].toFixed(3) + "	Z: " + offset[2].toFixed(3);
}
{{</highlight>}}

Setting new camera offset values:
{{<highlight js>}}
function setCameraOffset(x, y, z) {
	// Get Explorer element by id
	var voyagerElement = document.getElementById("voyager");	
	// Call setCameraOffset() on the object with the values
	// of the x, y, and z input elements as params
	voyagerElement.setCameraOffset(x.value, y.value, z.value);
}{{</highlight>}}
