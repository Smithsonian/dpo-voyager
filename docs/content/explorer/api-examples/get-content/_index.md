---
title: "API Example: Get Content"
summary: "Use API functions to pull content info from the active Voyager scene."
weight: 130
parent: 'api-examples'
---

#### Try it out:

{{< explorer "d8c646aa-4ebc-11ea-b77f-2e728ce88125" >}}  <br>
  
Click below to pull article data from the example scene and display a list of the article titles.

{{< control-div "article-wrapper" >}}
{{< function-button "Get Articles" "getArticles" "articleDisplay">}}
{{< /control-div >}}

{{< control-div "articleDisplay" >}}{{< /control-div >}}  <br>

#### How it works:
The annotated javascript below shows how to call the [getArticleData()](../../api) function on the Voyager Explorer object and then parses the response for display. The articles are returned as an array of [Article data objects](https://github.com/Smithsonian/dpo-voyager/blob/master/source/client/models/Article.ts).

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
{{</highlight>}}
	

