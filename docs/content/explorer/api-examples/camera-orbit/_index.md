---
title: "API Example: Camera Orbit"
summary: "Use API functions to get or set the Explorer active camera orbit."
weight: 130
---

#### Try it out:

{{< explorer "d8c636ce-4ebc-11ea-b77f-2e728ce88125" >}}  <br>
  
Orient the seen above to the desired view and then click the button below to get the yaw and pitch values.  

{{< control-div "orbit-wrapper" >}}
	{{< function-button "Get Camera Orbit" "getCameraOrbit" "orbitDisplay">}}
{{< /control-div >}}  

{{< control-div "orbitDisplay" >}}{{< /control-div >}}  <br>

Enter yaw and pitch angles (degrees) in the boxes below and click the button to immediately update the camera orbit in the example.

{{< input-submit "Set Camera Orbit" "setCameraOrbit" "Yaw" "Pitch">}}  <br>

#### How it works:
See the annotated javascript from this page below for one way to use the ['get' and 'set' camera orbit functions](../../api).

Getting and displaying camera orbit:
{{<highlight js>}}
function getCameraOrbit(displayElement) {
	// Get Explorer element by id
	var voyagerElement = document.getElementById("voyager");
	// Call getCameraOrbit() on the object and store the resulting array
	const orbitAngles = voyagerElement.getCameraOrbit();
	
	// Format the angles and assign to the inner text of
	// the passed in display element
	displayElement.innerText = "Yaw: " + orbitAngles[0] + "	Pitch: " + orbitAngles[1];
}
{{</highlight>}}

Setting new camera orbit values:
{{<highlight js>}}
function setCameraOrbit(yaw, pitch) {
	// Get Explorer element by id
	var voyagerElement = document.getElementById("voyager");	
	// Call setCameraOrbit() on the object with the values
	// of the yaw and pitch input elements as params
	voyagerElement.setCameraOrbit(yaw.value, pitch.value);
}{{</highlight>}}
