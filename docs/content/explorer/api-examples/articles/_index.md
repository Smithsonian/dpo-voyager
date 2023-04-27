---
title: "API Example: Articles"
summary: "Use API functions to control articles."
weight: 130
---

#### Try it out:

{{< explorer "d8c62be8-4ebc-11ea-b77f-2e728ce88125" >}}  <br>
  
Activate an article by specifying the unique id of a specific article in the box below and clicking the "Activate" button.
For the example model try the ids "uFOESOA9g7nz" or "TX9D2DGfuv5V".

If the id supplied is not valid, no article will be activated and the user will be taken to the article menu.

To find unknown article ids try the getArticles() function. [See an example here](../get-content) on how to use it.  

{{< input-submit "Activate" "setActiveArticle" "Article_ID">}}  <br>

#### How it works:
See the annotated javascript from this page below for an example of how to use the [setActiveArticle(id) function](../../api).

{{<highlight js>}}
function setActiveArticle(id) {
	// Get reference to the Explorer element by id
	var voyagerElement = document.getElementById("voyager");
	
	// Call the setActiveArticle function with the value of the 
	// option input element as the parameter
	voyagerElement.setActiveArticle(id.value);
}
{{</highlight>}}
