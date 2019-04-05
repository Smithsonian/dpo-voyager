/**
 * 3D Foundation Project
 * Copyright 2018 Smithsonian Institution
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

import DocumentView, { customElement, html } from "./DocumentView";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-reader-view")
export default class ReaderView extends DocumentView
{
    protected firstConnected()
    {
        this.classList.add("sv-reader-view");
    }

    protected render()
    {
        return html`<div class="sv-left"></div><div class="sv-article">
            <h1>Article Title</h1>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
            dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex
            ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat
            nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit
            anim id est laborum.</p>
            <h2>Paragraph</h2>
            <p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam
            rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt
            explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur
            magni dolores eos qui ratione voluptatem sequi nesciunt.</p>
            <h2>Subtitle</h2>
            <p>Aliquam posuere vel arcu a ullamcorper. Donec ultricies arcu dolor, sed elementum nibh placerat vitae.
            Aliquam fermentum augue ante, ac ornare sapien lobortis et. Cras eget mauris sit amet nibh viverra euismod
            in et massa. In luctus velit odio. Vestibulum sed blandit turpis. Proin sagittis ultrices sem, non efficitur
            ante luctus suscipit.</p>
            <p>Sed maximus luctus cursus. Nullam eget nulla nunc. Maecenas et turpis nec sem varius
            egestas ac nec est. Sed et sodales justo. Duis scelerisque arcu quis nunc pretium, a accumsan lacus
            bibendum. Nam malesuada sem elit, eu volutpat tortor lobortis varius. Donec eget lacus id ex lacinia
            consectetur. Sed ornare tristique risus quis luctus. Nam euismod massa in accumsan volutpat.</p>
        </div><div class="sv-right"></div>`;
    }
}