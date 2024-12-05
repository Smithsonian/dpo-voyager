/**
 * 3D Foundation Project
 * Copyright 2024 Smithsonian Institution
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

import Popup, { customElement, html } from "@ff/ui/Popup";

import "@ff/ui/Button";
import "@ff/ui/TextEdit";
import CVLanguageManager from "client/components/CVLanguageManager";
import {getFocusableElements, focusTrap} from "../../utils/focusHelpers";
import { IButtonClickEvent, IButtonKeyboardEvent } from "@ff/ui/Button";

////////////////////////////////////////////////////////////////////////////////

enum EHelpSection { Nav, Menu }

@customElement("sv-main-help")
export default class HelpMain extends Popup
{
    protected url: string;
    protected language: CVLanguageManager = null;
    protected helpView: EHelpSection = EHelpSection.Nav;

    protected static readonly leftClick = html`<svg class="ff-icon" viewBox="150 150 900 900" xmlns="http://www.w3.org/2000/svg"><path d="m600 930.62c-121.73 0-220.41-98.684-220.41-220.41v-220.42c0-121.73 98.684-220.42 220.41-220.42 121.73 0 220.42 98.684 220.42 220.42v220.42c0 121.73-98.684 220.41-220.42 220.41zm-188.93-346.37h377.86v125.95c0 104.34-84.594 188.93-188.93 188.93s-188.93-84.59-188.93-188.93zm159.28-85.285c4.2188 2.8008 8.9414 4.7539 13.902 5.7617v48.035h-106.02zm-17.586-62.66v29.863c0 2.125 0.17188 4.2383 0.50391 6.3008l-137.46 80.293h-4.7383v-33.691zm62.977-71.668v-63.133c96.969 7.9961 173.18 89.234 173.18 188.28v62.977h-173.18v-48.035c7.5078-1.5273 14.469-5.2266 19.965-10.723 7.3828-7.3828 11.523-17.395 11.523-27.836v-62.977c0-10.438-4.1406-20.449-11.523-27.832-5.4961-5.4961-12.457-9.1953-19.965-10.723zm-31.488-19.664v19.664c-7.5117 1.5273-14.469 5.2266-19.965 10.723-6.5625 6.5625-10.562 15.207-11.367 24.387l-141.71 82.766c0.51953-13.695 2.4883-27.031 5.7773-39.832zm31.488 121.2v-62.977c0-2.0938-0.83594-4.0898-2.3008-5.5703-1.4766-1.4648-3.4766-2.3008-5.5703-2.3008h-15.746c-2.0938 0-4.0938 0.83594-5.5742 2.3008-1.4609 1.4805-2.2969 3.4766-2.2969 5.5703v62.977c0 2.0938 0.83594 4.0938 2.2969 5.5742 1.4805 1.4648 3.4805 2.3008 5.5742 2.3008h15.746c2.0938 0 4.0938-0.83594 5.5703-2.3008 1.4648-1.4805 2.3008-3.4805 2.3008-5.5742zm-31.488-157.66-147.54 86.184c30.262-51.859 84.516-87.992 147.54-93.188z" fill-rule="evenodd"/></svg>`;
    protected static readonly rightClick = html`<svg class="ff-icon" viewBox="150 150 900 900" xmlns="http://www.w3.org/2000/svg"><path d="m600 930.62c121.73 0 220.42-98.684 220.42-220.41v-220.42c0-121.73-98.684-220.42-220.42-220.42-121.73 0-220.41 98.684-220.41 220.42v220.42c0 121.73 98.684 220.41 220.41 220.41zm188.93-346.37h-377.86v125.95c0 104.34 84.59 188.93 188.93 188.93s188.93-84.59 188.93-188.93zm-159.28-85.285c-4.2188 2.8008-8.9414 4.7539-13.902 5.7617v48.035h106.02zm17.586-62.66v29.863c0 2.125-0.17188 4.2383-0.50391 6.3008l137.46 80.293h4.7383v-33.691zm-62.977-71.668v-63.133c-96.969 7.9961-173.18 89.234-173.18 188.28v62.977h173.18v-48.035c-7.5117-1.5273-14.469-5.2266-19.965-10.723-7.3828-7.3828-11.523-17.395-11.523-27.836v-62.977c0-10.438 4.1406-20.449 11.523-27.832 5.4961-5.4961 12.453-9.1953 19.965-10.723zm31.488-19.664v19.664c7.5078 1.5273 14.469 5.2266 19.965 10.723 6.5625 6.5625 10.562 15.207 11.367 24.387l141.71 82.766c-0.51953-13.695-2.4883-27.031-5.7773-39.832zm-31.488 121.2v-62.977c0-2.0938 0.83594-4.0898 2.2969-5.5703 1.4805-1.4648 3.4805-2.3008 5.5742-2.3008h15.746c2.0938 0 4.0938 0.83594 5.5703 2.3008 1.4648 1.4805 2.3008 3.4766 2.3008 5.5703v62.977c0 2.0938-0.83594 4.0938-2.3008 5.5742-1.4766 1.4648-3.4766 2.3008-5.5703 2.3008h-15.746c-2.0938 0-4.0938-0.83594-5.5742-2.3008-1.4609-1.4805-2.2969-3.4805-2.2969-5.5742zm31.488-157.66 147.54 86.184c-30.258-51.859-84.512-87.992-147.54-93.188z" fill-rule="evenodd"/></svg>`;
    protected static readonly mouseWheel = html`<svg class="ff-icon" viewBox="150 -100 1200 1400" xmlns="http://www.w3.org/2000/svg"><path d="m576.05 422.12v-220.24l-55.078 55.078c-9.3711 9.3711-24.551 9.3711-33.938 0-9.3828-9.3711-9.3828-24.562 0-33.938l96-96c9.3711-9.3711 24.562-9.3711 33.938 0l96 96c9.3711 9.3711 9.3711 24.562 0 33.938-4.6914 4.6953-10.824 7.0352-16.969 7.0352s-12.277-2.3398-16.969-7.0312l-55.152-55.152v220.36l55.152-55.141c9.3711-9.3828 24.562-9.3828 33.938 0 9.3711 9.3711 9.3711 24.551 0 33.938l-96 96c-4.6914 4.6914-10.824 7.0312-16.969 7.0312s-12.277-2.3398-16.969-7.0312l-96-96c-9.3828-9.3711-9.3828-24.562 0-33.938 9.3711-9.3828 24.551-9.3828 33.938 0zm455.95 9.875v336c0 238.2-193.79 432-431.98 432-238.2 0-431.98-193.8-431.98-432v-167.77c0-0.082031-0.046875-0.15625-0.046875-0.22656s0.046875-0.14453 0.046875-0.22656v-167.77c0-238.21 193.78-432 431.98-432 238.19 0 431.98 193.79 431.98 432zm-815.95 0v144h767.95v-144c0-211.74-172.25-384-383.98-384-211.73 0-383.98 172.26-383.98 384zm767.95 336v-144h-767.95v144c0 211.74 172.25 384 383.98 384 211.73 0 383.98-172.26 383.98-384z"/></svg>`;
    protected static readonly pinch = html`<svg class="ff-icon" viewBox="150 150 1100 900" xmlns="http://www.w3.org/2000/svg"><g>
        <path d="m250.61 558.14c-5.8594-5.8594-15.352-5.8594-21.211 0l-60 60c-4.2891 4.2812-5.5781 8.8711-3.25 14.469 2.332 5.6016 7.793 7.3906 13.852 7.3906h40v103.75c0 10 10 20 20 20s20-10 20-20v-103.75h40c6.0586 0 11.531-1.7812 13.859-7.3789 2.3281-5.6016 1.0391-11.129-3.25-15.41z"/>
        <path d="m300 400h-40v-96.25c0-10-10-20-20-20s-20 10-20 20v96.25h-40c-6.0586 0-11.531 5.5312-13.859 11.129-2.3281 5.6016-1.0391 12.988 3.25 17.281l60 60.469c5.8594 5.8594 15.352 6.0898 21.211 0.23047l60-59.879c4.2891-4.2891 5.5781-12.551 3.25-18.16-2.332-5.6094-7.793-11.07-13.852-11.07z"/>
        <path d="m951.12 426.6c-8.4414-23.172-31.691-38.738-57.859-38.738-7.3789 0-14.578 1.25-21.398 3.7383-6.3398 2.3008-13.488 6.6406-19.93 11.719-11.34-24.57-36.191-40.699-63.559-40.699-8.1602 0-16.219 1.4297-23.941 4.2383-15.371 5.6016-28.039 16.129-36.262 30.031-13.07-15.41-32.52-24.828-53.441-24.828-8.1602 0-16.211 1.4297-23.941 4.2383-18.199 6.6289-34.172 19.539-43.809 35.422-3.0586 5.0391-5.4492 10.32-7.1602 15.75-15.309-23.609-32.859-47.961-49.23-64.328-29.879-29.879-73.711-65.5-112.82-65.5-6.8906 0-13.461 1.1211-19.512 3.3203-18.988 6.9102-33.469 21.809-39.719 40.859-6.5312 19.941-3.2695 41.891 8.9609 60.238 9.3086 13.961 21.672 22.238 34.762 31.012 19.578 13.109 41.762 27.961 64.699 68.109 27.121 47.449 59.98 133.01 77.52 180.85l-75.461-37.262c-11.012-5.1406-22.68-7.7383-34.691-7.7383-31.52 0-60.551 18.551-73.941 47.281-19.16 41.09-1.4609 90.051 38.73 108.77 0.67969 0.35937 69.57 37.191 164.98 81.68l15.602 7.3008c61.121 28.699 118.85 55.82 185.77 55.82h0.011719c31.871 0 63.789-5.9805 97.559-18.27 118.67-43.191 136.7-117.21 145-189.31 8-69.348-73.438-294.17-76.918-303.71zm47.129 300.28c-7.8086 67.891-22.641 127.12-125.45 164.55-30.441 11.07-58.988 16.461-87.301 16.461h-0.011719c-60.219 0-112.5-24.551-173.02-52.98l-15.672-7.3281c-94.602-44.121-162.81-80.59-164.24-81.309-25.941-12.102-37.129-43.18-24.961-69.281 8.6094-18.48 26.52-29.949 46.75-29.949 7.5898 0 14.988 1.6484 21.699 4.7812l108.46 53.551c5.4609 2.7109 11.988 1.8398 16.551-2.1914 4.5703-4.0195 6.25-10.398 4.2695-16.148-2.1094-6.0898-52.059-150.32-92.289-220.73-26.449-46.27-53.961-64.699-74.051-78.148-11.461-7.6719-20.5-13.73-26.488-22.719-7.0898-10.641-9.0703-23.121-5.4219-34.262 3.3594-10.25 11.191-18.281 21.461-22.02 20.762-7.6016 59.32 13.648 100.87 55.199 37.922 37.922 85.922 128.33 86.398 129.24 3.6797 6.9609 12.121 9.8984 19.352 6.6992 7.2109-3.1992 10.711-11.43 8.0117-18.84l-13.68-37.59c-4.7305-13-3.6602-25.32 3.1797-36.602 6.1484-10.148 16.512-18.461 28.41-22.789 4.4297-1.6094 9.0312-2.4297 13.68-2.4297 16.762 0 31.871 10.59 37.602 26.328l18.809 51.68c2.8281 7.7812 11.449 11.801 19.219 8.9609 7.7812-2.8281 11.801-11.441 8.9609-19.219l-8.5391-23.5c-3.6484-10.039-3.1719-20.898 1.3398-30.59 4.5117-9.6914 12.531-17.031 22.578-20.68 4.4102-1.6094 9.0195-2.4297 13.672-2.4297 16.75 0 31.859 10.59 37.59 26.34l22.238 61.078c2.8398 7.7891 11.469 11.789 19.219 8.9609 7.7891-2.8398 11.809-11.449 8.9609-19.23l-13.18-36.238c4.0586-4.4492 12.559-11.422 18.941-13.738 3.5195-1.2812 7.2695-1.9297 11.129-1.9297 13.398 0 25.602 7.8086 29.68 19 22.93 63.145 81.23 238.27 75.27 290.04z"/></g></svg>`;
    protected static readonly oneFinger = html`<svg class="ff-icon" viewBox="150 80 1200 1100" xmlns="http://www.w3.org/2000/svg"><g fill-rule="evenodd">
        <path d="m840 440c-16.465 0-31.77 4.9766-44.492 13.504-10.934-31.16-40.613-53.504-75.508-53.504-14.57 0-28.234 3.8945-40 10.703v-170.7c0-44.184-35.816-80-80-80s-80 35.816-80 80v390.36l-40.387-69.953c-22.09-38.262-71.02-51.371-109.28-29.281-38.262 22.094-51.375 71.02-29.281 109.28 5.0859 8.8164 24.68 42.715 28.75 49.801 31.137 54.199 41.914 146.04 73.188 200.31 43.637 75.727 116.69 175.49 120.79 181.18 6.457 8.9609 18.957 10.992 27.918 4.5352 8.9609-6.457 10.992-18.957 4.5352-27.918-4.0273-5.5859-82.762-115.18-118.68-177.9-24.391-42.598-38.934-141.56-73.109-200.2-4.1055-7.0508-23.664-40.984-28.75-49.801-11.047-19.129-4.4922-43.594 14.641-54.641 19.133-11.043 43.594-4.4883 54.641 14.641l74.84 129.63c7.0039 14.672 40.188 13.93 40.188-10.035v-460c0-22.09 17.91-40 40-40s40 17.91 40 40v340c0 11.047 8.9531 20 20 20s20-8.9531 20-20v-100c0-22.09 17.91-40 40-40s40 17.91 40 40v100c0 11.047 8.9531 20 20 20s20-8.9531 20-20v-60c0-22.09 17.91-40 40-40s40 17.91 40 40v100c0 11.047 8.9531 20 20 20s20-8.9531 20-20v-60c0-22.09 17.91-40 40-40s40 17.91 40 40v140c0 130.99-80 255.81-80 360 0 11.047 8.9531 20 20 20s20-8.9531 20-20c0-89.777 80-228.5 80-360v-140c0-44.184-35.816-80-80-80-16.465 0-31.77 4.9766-44.492 13.504-10.934-31.16-40.613-53.504-75.508-53.504z"/>
        <path d="m234.14 245.86c7.8125 7.8086 7.8125 20.473 0 28.281-7.8086 7.8125-20.473 7.8125-28.281 0l-80-80c-7.8125-7.8086-7.8125-20.473 0-28.281l80-80c7.8086-7.8125 20.473-7.8125 28.281 0 7.8125 7.8086 7.8125 20.473 0 28.281l-45.855 45.859h271.71c11.047 0 20 8.9531 20 20s-8.9531 20-20 20h-271.83z"/>
        <path d="m965.86 245.86c-7.8125 7.8086-7.8125 20.473 0 28.281 7.8086 7.8125 20.473 7.8125 28.281 0l80-80c7.8125-7.8086 7.8125-20.473 0-28.281l-80-80c-7.8086-7.8125-20.473-7.8125-28.281 0-7.8125 7.8086-7.8125 20.473 0 28.281l45.855 45.859h-271.71c-11.047 0-20 8.9531-20 20s8.9531 20 20 20h271.83z"/></g></svg>`;
    protected static readonly twoFinger = html`<svg class="ff-icon" viewBox="40 80 1300 1100" xmlns="http://www.w3.org/2000/svg"><g fill-rule="evenodd">
        <path d="m154.14 245.86c7.8125 7.8086 7.8125 20.473 0 28.281-7.8086 7.8125-20.473 7.8125-28.281 0l-80-80c-7.8125-7.8086-7.8125-20.473 0-28.281l80-80c7.8086-7.8125 20.473-7.8125 28.281 0 7.8125 7.8086 7.8125 20.473 0 28.281l-45.855 45.859h271.71c11.047 0 20 8.9531 20 20s-8.9531 20-20 20h-271.83z"/>
        <path d="m1005.9 245.86c-7.8125 7.8086-7.8125 20.473 0 28.281 7.8086 7.8125 20.473 7.8125 28.281 0l80-80c7.8125-7.8086 7.8125-20.473 0-28.281l-80-80c-7.8086-7.8125-20.473-7.8125-28.281 0-7.8125 7.8086-7.8125 20.473 0 28.281l45.855 45.859h-271.71c-11.047 0-20 8.9531-20 20s8.9531 20 20 20h271.83z"/>
        <path d="m760 560c34.895 0 64.574 22.344 75.508 53.504 12.723-8.5273 28.027-13.504 44.492-13.504 44.184 0 80 35.816 80 80v140c0 131.5-80 270.22-80 360 0 11.047-8.9531 20-20 20s-20-8.9531-20-20c0-104.19 80-229.01 80-360v-140c0-22.09-17.91-40-40-40s-40 17.91-40 40v60c0 11.047-8.9531 20-20 20s-20-8.9531-20-20v-100c0-22.09-17.91-40-40-40s-40 17.91-40 40v60c0 11.047-8.9531 20-20 20s-20-8.9531-20-20v-420c0-22.09-17.91-40-40-40s-40 17.91-40 40v420c0 11.047-8.9531 20-20 20s-20-8.9531-20-20v-340c0-22.09-17.91-40-40-40s-40 17.91-40 40v460c0 23.965-33.184 24.707-40.188 10.035l-74.84-129.63c-11.047-19.129-35.508-25.684-54.641-14.641-19.133 11.047-25.688 35.512-14.641 54.641 5.0859 8.8164 24.645 42.75 28.75 49.801 34.176 58.645 48.719 157.61 73.109 200.2 35.914 62.723 114.65 172.31 118.68 177.9 6.457 8.9609 4.4258 21.461-4.5352 27.918-8.9609 6.457-21.461 4.4258-27.918-4.5352-4.0977-5.6875-77.148-105.45-120.79-181.18-31.273-54.27-42.051-146.11-73.188-200.31-4.0703-7.0859-23.664-40.984-28.75-49.801-22.094-38.262-8.9805-87.188 29.281-109.28 38.262-22.09 87.191-8.9805 109.28 29.281l40.387 69.953v-390.36c0-44.184 35.816-80 80-80 14.57 0 28.234 3.8945 40 10.703v-10.703c0-44.184 35.816-80 80-80s80 35.816 80 80v290.7c11.766-6.8086 25.43-10.703 40-10.703z"/></g></svg>`;
    protected static readonly arrowKeys = html`<svg class="ff-icon" viewBox="0 200 1300 800" xmlns="http://www.w3.org/2000/svg"><g>
        <path d="m479.04 936.24h238.92c22.559 0 40.922-18.359 40.922-40.922l-0.003906-238.92c0-22.559-18.359-40.922-40.922-40.922l-238.92 0.003907c-22.559 0-40.922 18.359-40.922 40.922v238.92c0.003906 22.555 18.363 40.914 40.922 40.914zm85.562-148.56h24.84v-86.039c0-4.9219 4.0781-9 9-9s9 4.0781 9 9v86.039h24.84c4.9219 0 7.9219 5.2812 5.5195 9.4805l-33.84 58.68c-2.3984 4.1992-8.5195 4.1992-11.039 0l-33.84-58.68c-2.4023-4.1992 0.71875-9.4805 5.5195-9.4805z"/>
        <path d="m717.96 263.76h-238.92c-22.559 0-40.922 18.359-40.922 40.922l0.003906 238.92c0 22.559 18.359 40.922 40.922 40.922h238.92c22.559 0 40.922-18.359 40.922-40.922l-0.007813-238.92c0-22.559-18.359-40.918-40.918-40.918zm-85.562 148.56h-24.84v86.039c0 4.9219-4.0781 9-9 9s-9-4.0781-9-9v-86.039h-24.84c-4.9219 0-7.9219-5.2812-5.5195-9.4805l33.84-58.68c2.3984-4.1992 8.5195-4.1992 11.039 0l33.84 58.68c2.4023 4.1992-0.59766 9.4805-5.5195 9.4805z"/>
        <path d="m1116 895.32v-238.92c0-22.559-18.359-40.922-40.922-40.922l-238.92 0.003907c-22.559 0-40.922 18.359-40.922 40.922v238.92c0 22.559 18.359 40.922 40.922 40.922h238.92c22.68-0.007813 40.918-18.367 40.918-40.926zm-148.44-85.559v-24.961h-86.039c-4.9219 0-9-4.0781-9-9s4.0781-9 9-9h86.039v-24.84c0-4.9219 5.2812-7.9219 9.4805-5.5195l58.68 33.84c4.1992 2.3984 4.1992 8.5195 0 11.039l-58.68 33.84c-4.1992 2.5195-9.4805-0.60156-9.4805-5.3984z"/>
        <path d="m84 656.4v238.92c0 22.559 18.359 40.922 40.922 40.922h238.92c22.559 0 40.922-18.359 40.922-40.922l-0.003906-238.92c0-22.559-18.359-40.922-40.922-40.922l-238.92 0.003907c-22.684 0-40.922 18.359-40.922 40.918zm148.44 85.562v24.84h86.039c4.9219 0 9 4.0781 9 9s-4.0781 9-9 9h-86.039v24.84c0 4.9219-5.2812 7.9219-9.4805 5.5195l-58.68-33.84c-4.1992-2.3984-4.1992-8.5195 0-11.039l58.68-33.84c4.1992-2.4023 9.4805 0.59766 9.4805 5.5195z"/></g></svg>`;

    static show(parent: HTMLElement, language: CVLanguageManager): Promise<void>
    {
        const menu = new HelpMain(parent, language);
        parent.appendChild(menu);

        return new Promise((resolve, reject) => {
            menu.on("close", () => resolve());
        });
    }

    constructor( parent: HTMLElement, language: CVLanguageManager )
    {
        super();

        this.language = language;
        this.position = "center";
        this.modal = true;
        this.portal = parent;

        this.url = window.location.href;
    }

    close()
    {
        this.dispatchEvent(new CustomEvent("close"));
        this.remove();
    }

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-main-help");
    }

    protected render()
    {
        const language = this.language;
        const section = this.helpView;

        const arVisible = this.parentElement.querySelector("#ar-btn") ? true : false;
        const audioVisible = this.parentElement.querySelector("#audio-btn") ? true : false;
        const toursVisible = this.parentElement.querySelector("#tour-btn") ? true : false;
        const readerVisible = this.parentElement.querySelector("#reader-btn") ? true : false;
        const annosVisible = this.parentElement.querySelector("#anno-btn") ? true : false;
        const fsVisible = this.parentElement.querySelector("#fullscreen-btn") ? true : false;
        const toolsVisible = this.parentElement.querySelector("#tools-btn") ? true : false;

        const navContent = html`<div class="sv-help-row" aria-live="polite" aria-atomic="true">
                                    <div class="sv-help-section">
                                        <ff-icon class="ff-off" name="rotate"></ff-icon>
                                        <div class="sv-help-text"><b>Orbit</b></div>
                                        <div class="sv-help-text">${HelpMain.leftClick}Left-click and drag</div>
                                        <div class="sr-only"> Or.</div>
                                        <div class="sv-help-text">${HelpMain.oneFinger}One-finger drag</div>
                                        <div class="sr-only"> Or.</div>
                                        <div class="sv-help-text">${HelpMain.arrowKeys}Arrow keys</div>
                                    </div>
                                    <div class="sv-help-section">
                                        <ff-icon class="ff-off" name="move"></ff-icon>
                                        <div class="sv-help-text"><b>Pan</b></div>
                                        <div class="sv-help-text">${HelpMain.rightClick}Right-click and drag</div>
                                        <div class="sr-only"> Or.</div>
                                        <div class="sv-help-text">${HelpMain.twoFinger}Two-finger drag</div>
                                        <div class="sr-only"> Or.</div>
                                        <div class="sv-help-text">Shift + ${HelpMain.arrowKeys}Arrow keys</div>
                                    </div>
                                    <div class="sv-help-section">
                                        <ff-icon class="ff-off" name="zoom"></ff-icon>
                                        <div class="sv-help-text"><b>Zoom</b></div>
                                        <div class="sv-help-text">${HelpMain.mouseWheel}Mouse wheel</div>
                                        <div class="sr-only"> Or.</div>
                                        <div class="sv-help-text">${HelpMain.pinch}Two-finger pinch</div>
                                        <div class="sr-only"> Or.</div>
                                        <div class="sv-help-text">Ctrl + ${HelpMain.arrowKeys}Arrow keys</div>
                                    </div>
                                    <div id="sr-trigger" class="sr-only"></div>
                                </div>`;

        const menuContent = html`<div class="sv-help-text">The tools below can be accessed by clicking the corresponding icons on the menu bar to the left of the screen.</div>
                                <div class="sv-help-row">
                                    ${arVisible ? html`<div class="sv-help-section sv-help-short">
                                        <ff-icon title="AR." class="ff-off" name="ar"></ff-icon>
                                        <div class="sv-help-text">Launch an augmented<br>reality experience.</div>
                                    </div>`:""}
                                    ${audioVisible ? html`<div class="sv-help-section sv-help-short">
                                        <ff-icon title="Play Narration." class="ff-off" name="audio"></ff-icon>
                                        <div class="sv-help-text">Hear an audio<br>narration of the scene.</div>
                                    </div>`:""}
                                    ${toursVisible ? html`<div class="sv-help-section sv-help-short">
                                        <ff-icon title="Tours." class="ff-off" name="globe"></ff-icon>
                                        <div class="sv-help-text">Take a curated guided<br>tour of the scene.</div>
                                    </div>`:""}                       
                                    ${readerVisible ? html`<div class="sv-help-section sv-help-short">
                                        <ff-icon title="Articles." class="ff-off" name="article"></ff-icon>
                                        <div class="sv-help-text">Read articles about<br>the scene content.</div>
                                    </div>`:""}
                                    ${annosVisible ? html`<div class="sv-help-section sv-help-short">
                                        <ff-icon title="Annotations." class="ff-off" name="comment"></ff-icon>
                                        <div class="sv-help-text">Show annotations<br>highlighting key points.</div>
                                    </div>`:""}
                                    <div class="sv-help-section sv-help-short">
                                        <ff-icon title="Share." class="ff-off" name="share"></ff-icon>
                                        <div class="sv-help-text">Share the experience<br>with a friend!</div>
                                    </div>
                                    ${fsVisible ? html`<div class="sv-help-section sv-help-short">
                                        <ff-icon title="Fullscreen." class="ff-off" name="expand"></ff-icon>
                                        <div class="sv-help-text">View the experience<br>in fullscreen mode.</div>
                                    </div>`:""}
                                    ${toolsVisible ? html`<div class="sv-help-section sv-help-short">
                                        <ff-icon title="Advanced Tools." class="ff-off" name="tools"></ff-icon>
                                        <div class="sv-help-text">Open the advanced<br>tool menu.</div>
                                    </div>`:""}
                                </div>`;

        return html`
        <div class="sv-help-region" role="region" aria-label="Introduction to Voyager" aria-live="polite" @keydown=${e =>this.onKeyDownMain(e)}>
            <div class="ff-flex-row">
                <div class="ff-flex-spacer ff-title"><b>${language.getLocalizedString("Introduction to Voyager")}</b></div>
                <ff-button icon="close" transparent class="ff-close-button" title=${language.getLocalizedString("Close")} @click=${this.close}></ff-button>
            </div>
            <div class="sv-commands">
                <ff-button text="Navigation" index=${EHelpSection.Nav} selectedIndex=${section} @click=${(e) => this.onClickSection(e, EHelpSection.Nav)}></ff-button>
                <ff-button text="Menu Icons" index=${EHelpSection.Menu} selectedIndex=${section} @click=${(e) => this.onClickSection(e, EHelpSection.Menu)}></ff-button>
            </div>
            ${section === EHelpSection.Nav ? navContent : menuContent}
        </div>
        `;
    }

    protected firstUpdated(changedProperties) {
        super.firstUpdated(changedProperties);

        (Array.from(this.getElementsByClassName("ff-button")).find(elem => elem.getAttribute("text") === "Navigation") as HTMLElement).focus();

        // trigger screen reader on first pass
        setTimeout(() => {this.querySelector("#sr-trigger").textContent = "section end"}, 100);
    }

    protected onClickSection(event: IButtonClickEvent, idx: number)
    {
        this.helpView = idx;
        this.requestUpdate();
    }

    protected onKeyDownMain(e: KeyboardEvent)
    {
        if (e.code === "Escape") {
            this.close();
        }
        else if(e.code === "Tab") {
            focusTrap(getFocusableElements(this) as HTMLElement[], e);
        }
    }

    // resets tabIndex if needed
    protected tabReset(e: FocusEvent) {
        const currentActive = e.target instanceof Element ? e.target as Element : null;
        if(currentActive) {
            const currentSelected = Array.from(currentActive.parentElement.children).find(elem => elem.hasAttribute("selected"));
            if(currentSelected !== currentActive) {
                currentActive.setAttribute("tabIndex", "-1");
                currentSelected.setAttribute("tabIndex", "0");
            }
        }
    }
}
