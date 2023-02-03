import { customElement, html } from "client/ui/explorer/DocumentView";
import TagCloud from "client/ui/explorer/TagCloud";
import CVAnnotationView, { Annotation } from "client/components/CVAnnotationView";


@customElement("split-tag-cloud")
export default class SplitTagCloud extends TagCloud {

  protected get annotations()
  {
      return this.system.getComponent(CVAnnotationView, true);
  }

  protected render()
  {
      const annotations=this.annotations?.getAnnotations();

      const activeTags = this.activeTags;
      const tagCloud = this.tagCloud;
      
      const tagButtons = tagCloud.map((tag, index) =>
        html`<ff-button class="sv-tag-button" transparent text=${tag}
            ?selected=${activeTags.indexOf(tag) >= 0}
            @click=${() => this.onSelectTag(tag)}></ff-button>`);

      const annotationDescriptions = annotations.map(annotation=> 
        html`<div class="tag-description" 
        ?selected=${annotation.tags.filter(tag => activeTags.includes(tag)).length > 0 }
        @click=${() => this.onSelectAnnotation(annotation)}>
          <h2>${annotation.title}</h2>
          <p>${annotation.lead}</p>
        </div>`)

      return html`<div class="tag-cloud">
        <div class="sv-tag-buttons">${tagButtons}</div>
        <div class="tag-descriptions">${annotationDescriptions}</div>
      </div>`;
  }

  protected onSelectAnnotation(annotation: Annotation): void {
    this.dispatchEvent(new CustomEvent("select", {detail: annotation}));
  }
}