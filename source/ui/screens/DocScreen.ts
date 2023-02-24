
import { customElement, property, html, TemplateResult, LitElement, css } from "lit-element";
import {unsafeHTML} from 'lit-html/directives/unsafe-html.js';

import "@ff/ui/Button";

import "client/ui/Spinner";
import { route, router } from "../state/router";

import "../composants/DocView";
/**
 * Main UI view for the Voyager Explorer application.
 */
 @customElement("doc-screen")
 export default class DocScreen extends router(LitElement)
 {
  @route()
  static "/:name" = (parent, {name})=> html`<doc-view path="/${name.toLowerCase()}" ></doc-view>`;


  render(){
    return html`
      <h1>eCorpus documentation</h1>
      ${this.renderContent()}
    `;
  }
 }