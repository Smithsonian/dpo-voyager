/**
 * 3D Foundation Project
 * Copyright 2019 Smithsonian Institution
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import "client/ui/Spinner";
import "client/ui/explorer/ReaderView";

import { customElement, html } from "client/ui/explorer/DocumentView";
import ContentView from "client/ui/explorer/ContentView";

////////////////////////////////////////////////////////////////////////////////

@customElement("split-content-view")
export default class SplitContentView extends ContentView
{

  protected render()
  {
      const system = this.system;
      const isLoading = this.assetManager.outs.busy.value;
      const isInitialLoad = this.assetManager.initialLoad;

      let readerVisible = false;
      let tourMenuVisible = false;

      const tours = this.tours;
      
      if (tours) {
          tourMenuVisible = tours.ins.enabled.value && tours.outs.tourIndex.value === -1;
      }

      let viewportOffset=0
      const width=this.offsetWidth;
      if(readerVisible) 
      {
          viewportOffset=Math.max(-.2*width , -250);
      }
      
      const sceneView = this.sceneView;


      sceneView.classList.remove("sv-blur");

      if(!isLoading && isInitialLoad) { 
          // send load timer event
          this.analytics.sendProperty("Loading.Time", this.analytics.getTimerTime()/1000);
          this.analytics.resetTimer();

          this.assetManager.initialLoad = false;
      }

      if (readerVisible) {
          return html`<div class="ff-fullsize sv-content-split">
              <div class="ff-splitter-section et-scene-section" style="flex-basis: 60%">
                  ${sceneView}
              </div>
              <ff-splitter direction="horizontal"></ff-splitter>
                  <div class="ff-splitter-section" style="flex-basis: 40%; max-width: 500px;">
                      <div class="sv-reader-container">
                          <sv-reader-view .system=${system} @close=${this.onReaderClose} ></sv-reader-view>
                      </div>
                  </div>
              </div>
              <sv-spinner ?visible=${isLoading}></sv-spinner>`;
      }

      return html`<div class="ff-fullsize sv-content-only">${sceneView}</div>
          <sv-spinner ?visible=${isLoading}></sv-spinner>`;
  }
}


