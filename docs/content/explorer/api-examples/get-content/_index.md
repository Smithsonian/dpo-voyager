---
title: "API Example: Get Content"
summary: "Use API functions to pull content info from the active Voyager scene."
weight: 130
parent: 'api-examples'
---

#### Try it out:

{{< explorer "d8c646aa-4ebc-11ea-b77f-2e728ce88125" >}}  <br>
  
Click below to pull and display article or annotation data from the example scene.

{{< control-div "article-wrapper" >}}
{{< function-button "Get Articles" "getArticles" "articleDisplay">}}
{{< /control-div >}}

{{< control-div "articleDisplay" >}}{{< /control-div >}}  <br>

{{< control-div "annotation-wrapper" >}}
{{< function-button "Get Annotations" "getAnnotations" "annotationDisplay">}}
{{< /control-div >}}

{{< control-div "annotationDisplay" >}}{{< /control-div >}}  <br>

#### How it works:
The annotated javascript below shows how to call the [getArticles()](../../api) and [getAnnotations()](../../api) functions on the Voyager Explorer object 
and then parses the response for display. The articles are returned as an array of [Article data objects](https://github.com/Smithsonian/dpo-voyager/blob/master/source/client/models/Article.ts)
and the annotations are returned as an array of [Annotation data objects](https://github.com/Smithsonian/dpo-voyager/blob/d3d63fedeb595ac7b664a2b2e081b691bbdc3084/source/client/schema/model.ts#L63).

{{<highlight js>}}
function getArticles(displayElement) {
	// Get Explorer element by id
	var voyagerElement = document.getElementById("voyager");
	// Call getArticles() on the object and store the resulting array
	const articles = voyagerElement.getArticles();

	// For each article in the array, grab the title attribute 
	// and add it to a string.
	var articleNames = "";
	articles.forEach(article => {
		articleNames += article.title.length > 0 ? article.title 
			: article.titles["EN"];
		articleNames += " | ";
	});
  
	// Set the innerText of the passed in display element to 
	// the string of titles.
	displayElement.innerText = articleNames;
}

function getAnnotations(displayElement) {
	// Get Explorer element by id
	var voyagerElement = document.getElementById("voyager");
	// Call getAnnotations() on the object and store the resulting array
	const annotations = voyagerElement.getAnnotations();

	// For each annotation in the array, grab the id 
	// and title attributes and add to a string.
	var annotationNames = "";
	annotations.forEach(annotation => {
		annotationNames += "[id: " + annotation.id + " title: " + annotation.title + "]";
		annotationNames += " | ";
	});
  
	// Set the innerText of the passed in display element to 
	// the string of annotation data.
	displayElement.innerText = annotationNames;
}
{{</highlight>}}
	

