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

import CustomElement, { customElement, html } from "@ff/ui/CustomElement";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-logo")
export default class Logo extends CustomElement
{
    protected static readonly h = html`<div class="sv-sunburst"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 161">
      <path style="stroke-width:1.40431406744;fill:#00a5e8" d="M82.02 53.44C86.63 53.44 91.25 53.44 95.85 53.44C95.85 71.29 95.85 89.13 95.85 107.0C91.22 107.0 86.57 107.0 81.93 107.0C81.93 99.63 81.93 92.29 81.93 84.94C75.24 84.94 68.56 84.94 61.86 84.94C61.86 88.25 61.86 91.54 61.86 94.85C75.96 103.4 90.07 112.0 104.2 120.6C104.2 93.71 104.2 66.84 104.2 39.97C96.79 44.46 89.4 48.96 82.02 53.44C82.02 53.44 82.02 53.44 82.02 53.44M47.94 74.18C44.6 76.21 41.25 78.25 37.9 80.28C41.25 82.32 44.6 84.35 47.94 86.38C47.94 82.31 47.94 78.25 47.94 74.18C47.94 74.18 47.94 74.18 47.94 74.18M81.93 53.5C75.24 57.57 68.56 61.64 61.86 65.71C61.86 68.53 61.86 71.34 61.86 74.16C68.56 74.16 75.24 74.16 81.93 74.16C81.93 67.28 81.93 60.38 81.93 53.5C81.93 53.5 81.93 53.5 81.93 53.5" id="polygon3684" />
      <path style="stroke-width:1.40431406744;fill:#00517d" d="M81.93 85.51C82.17 84.75 81.45 84.95 80.94 84.94C74.58 84.94 68.22 84.94 61.86 84.94C61.86 89.2 61.86 93.46 61.86 97.72C68.56 93.65 75.24 89.58 81.93 85.51C81.93 85.51 81.93 85.51 81.93 85.51M81.93 73.91C75.24 69.84 68.56 65.77 61.86 61.7C61.86 65.85 61.86 70.01 61.86 74.16C68.56 74.16 75.24 74.16 81.93 74.16C81.93 74.06 81.93 73.99 81.93 73.91C81.93 73.91 81.93 73.91 81.93 73.91" id="polygon3708" />
    </svg></div>`;
    protected static readonly text = html`<div class="sv-smithsonian"><svg xmlns="http://www.w3.org/2000/svg" viewBox="150 0 362 161">
      <g class="logo-text" style="fill:#103040;">
        <path id="text-h"
          d="m 159.7,44.78 c 0,0 0,20.63 0,20.63 0.4,-0.35 0.9,-0.81 1.7,-1.36 0.7,-0.56 1.7,-1.11 2.7,-1.67 1.2,-0.56 2.5,-1.04 4.1,-1.45 1.5,-0.41 3.3,-0.61 5.3,-0.61 3.4,0 6,0.51 8.1,1.53 2.1,1.03 3.7,2.33 4.9,3.91 1.2,1.58 2,3.28 2.5,5.13 0.4,1.85 0.6,3.59 0.6,5.22 0,0 0,30.89 0,30.89 0,0 -11.7,0 -11.7,0 0,0 0,-29.74 0,-29.74 0,-2.05 -0.6,-3.71 -1.8,-4.96 -1.3,-1.26 -3.3,-1.89 -6.3,-1.89 -1.4,0 -2.7,0.19 -3.9,0.57 -1.2,0.38 -2.2,0.82 -3,1.32 -0.8,0.5 -1.6,0.98 -2.1,1.45 -0.5,0.47 -0.9,0.79 -1,0.96 0,0 0,32.29 0,32.29 0,0 -11.7,0 -11.7,0 0,0 0,-62.22 0,-62.22 0,0 11.6,0 11.6,0"
          />
        <path id="text-o"
          d="m 219.1,60.32 c 3.4,0 6.7,0.61 9.8,1.84 3.1,1.23 5.6,2.91 7.9,5.05 2.3,2.13 4,4.66 5.3,7.59 1.3,2.93 1.9,6.09 1.9,9.49 0,3.33 -0.6,6.46 -1.8,9.39 -1.2,2.93 -2.9,5.46 -5.1,7.62 -2.2,2.1 -4.8,3.8 -7.8,5.1 -3.1,1.3 -6.5,1.9 -10.2,1.9 -3.6,0 -7,-0.6 -10.1,-1.8 -3,-1.2 -5.6,-2.8 -7.8,-5 -2.3,-2.07 -4,-4.62 -5.3,-7.55 -1.2,-2.93 -1.8,-6.15 -1.8,-9.65 0,-3.28 0.6,-6.38 1.9,-9.31 1.3,-2.93 3,-5.47 5.2,-7.63 2.2,-2.17 4.7,-3.88 7.8,-5.14 3.1,-1.27 6.4,-1.9 10.1,-1.9 0,0 0,0 0,0 m -13.1,23.66 c 0,2.04 0.3,3.88 1,5.51 0.6,1.63 1.5,3.03 2.7,4.2 1.1,1.16 2.5,2.07 4.1,2.71 1.6,0.65 3.4,0.96 5.3,0.96 1.8,0 3.6,-0.31 5.2,-0.96 1.6,-0.64 3,-1.56 4.1,-2.76 1.2,-1.19 2.1,-2.61 2.7,-4.24 0.7,-1.63 1,-3.42 1,-5.33 0,-1.81 -0.3,-3.5 -1,-5.08 -0.6,-1.58 -1.5,-2.96 -2.7,-4.15 -1.1,-1.19 -2.5,-2.12 -4.1,-2.8 -1.6,-0.67 -3.4,-1 -5.2,-1 -2,0 -3.8,0.34 -5.4,1 -1.7,0.68 -3,1.59 -4.1,2.75 -1.2,1.17 -2,2.55 -2.7,4.11 -0.6,1.57 -0.9,3.27 -0.9,5.08 0,0 0,0 0,0"/>
        <path id="text-l"
          d="m 259.7,44.78 c 0,0 0,62.22 0,62.22 0,0 -11.6,0 -11.6,0 0,0 0,-62.22 0,-62.22 0,0 11.6,0 11.6,0" />
        <path id="text-u"
          d="M306.7377 61.54635C306.7377 61.54635 306.7377 94.55367 306.7377 94.55367C306.7377 96.65883 306.837 98.38665 306.9363 99.7272C307.1349 101.1174 307.2342 102.1104 307.4328 103.0041C307.6314 103.7985 307.83 104.3943 308.0286 104.8908C308.2272 105.3873 308.4258 105.6852 308.5251 105.9831C308.5251 105.9831 297.2049 107.7705 297.2049 107.7705C296.7084 106.7775 296.4105 105.5859 296.2119 104.295C296.0133 103.0041 295.914 101.8125 295.8147 100.6209C295.5168 101.0181 295.1196 101.6139 294.6231 102.5076C294.0273 103.302 293.2329 104.1957 292.1406 104.9901C290.949 105.8838 289.5588 106.6782 287.7714 107.274C286.0833 107.9691 283.8987 108.267 281.2176 108.267C278.4372 108.267 276.054 107.7705 274.068 106.8768C272.082 105.8838 270.4932 104.6922 269.3016 103.1034C268.0107 101.5146 267.117 99.7272 266.5212 97.75113C266.0247 95.73534 265.7268 93.64011 265.7268 91.47537C265.7268 91.47537 265.7268 61.54635 265.7268 61.54635C265.7268 61.54635 277.2456 61.54635 277.2456 61.54635C277.2456 61.54635 277.2456 89.80713 277.2456 89.80713C277.2456 95.18919 280.026 97.88022 285.4875 97.88022C286.7784 97.88022 287.97 97.67169 289.1616 97.26456C290.2539 96.85743 291.3462 96.2517 292.2399 95.46723C293.1336 94.68276 293.8287 93.70962 294.4245 92.56767C294.921 91.42572 295.2189 90.15468 295.2189 88.75455C295.2189 88.75455 295.2189 61.54635 295.2189 61.54635C295.2189 61.54635 306.7377 61.54635 306.7377 61.54635" />
        <path id="text-s"
            d="M331.7613 60.31503C333.8466 60.31503 335.8326 60.49377 337.7193 60.84132C339.5067 61.18887 341.1948 61.60593 342.585 62.07264C344.0745 62.53935 345.2661 63.02592 346.2591 63.52242C347.2521 64.01892 348.0465 64.44591 348.543 64.79346C348.543 64.79346 343.9752 73.04529 343.9752 73.04529C343.6773 72.8169 343.1808 72.48921 342.3864 72.08208C341.6913 71.67495 340.7976 71.26782 339.7053 70.85076C338.7123 70.44363 337.4214 70.07622 336.1305 69.75846C334.7403 69.4407 333.3501 69.27189 331.9599 69.27189C330.0732 69.27189 328.3851 69.60951 326.7963 70.28475C325.3068 70.95999 324.5124 71.85369 324.5124 72.96585C324.5124 73.73046 324.8103 74.36598 325.3068 74.89227C325.9026 75.41856 326.697 75.88527 327.69 76.2924C328.7823 76.69953 330.0732 77.11659 331.5627 77.52372C333.0522 77.93085 334.7403 78.39756 336.627 78.92385C338.613 79.50972 340.4997 80.21475 342.1878 81.02901C343.7766 81.8532 345.2661 82.8462 346.4577 84.00801C347.7486 85.17975 348.6423 86.53023 349.4367 88.04952C350.1318 89.56881 350.4297 91.29663 350.4297 93.22305C350.4297 95.09982 350.0325 96.92694 349.1388 98.70441C348.3444 100.5216 347.0535 102.1104 345.2661 103.5006C343.578 104.8908 341.4927 105.9831 338.9109 106.8768C336.3291 107.7705 333.3501 108.267 329.9739 108.267C327.3921 108.267 324.9096 107.9691 322.725 107.4726C320.5404 106.8768 318.6537 106.3803 316.9656 105.6852C315.2775 105.0894 313.8873 104.3943 312.795 103.7985C311.7027 103.1034 310.9083 102.6069 310.5111 102.4083C310.5111 102.4083 315.4761 93.24291 315.4761 93.24291C316.9656 94.29549 318.9516 95.34807 321.3348 96.40065C323.8173 97.45323 326.5977 97.97952 329.7753 97.97952C335.634 97.97952 338.613 96.51981 338.613 93.59046C338.613 92.7762 338.2158 92.05131 337.5207 91.43565C336.8256 90.81999 335.9319 90.26391 334.7403 89.76741C333.5487 89.27091 332.2578 88.8042 330.7683 88.36728C329.2788 87.93036 327.69 87.44379 326.2005 86.9175C324.4131 86.39121 322.8243 85.79541 321.1362 85.12017C319.5474 84.44493 318.0579 83.61081 316.767 82.61781C315.5754 81.62481 314.4831 80.44314 313.6887 79.06287C312.8943 77.69253 312.5964 75.97464 312.5964 73.92906C312.5964 71.88348 313.0929 70.02657 314.0859 68.35833C315.0789 66.69009 316.3698 65.26017 318.1572 64.05864C319.8453 62.85711 321.9306 61.93362 324.2145 61.2981C326.5977 60.64272 329.0802 60.31503 331.7613 60.31503C331.7613 60.31503 331.7613 60.31503 331.7613 60.31503" />
        <path id="text-i"
          d="M352.6143 48.37917C352.6143 46.39317 353.3094 44.72493 354.6996 43.37445C356.0898 42.0339 357.7779 41.35866 359.7639 41.35866C361.6506 41.35866 363.3387 42.01404 364.7289 43.33473C366.1191 44.65542 366.8142 46.33359 366.8142 48.37917C366.8142 50.42475 366.0198 52.11285 364.6296 53.42361C363.2394 54.7443 361.6506 55.39968 359.7639 55.39968C357.7779 55.39968 356.1891 54.7443 354.6996 53.42361C353.3094 52.11285 352.6143 50.43468 352.6143 48.37917C352.6143 48.37917 352.6143 48.37917 352.6143 48.37917M365.5233 61.54635C365.5233 61.54635 365.5233 106.9761 365.5233 106.9761C365.5233 106.9761 354.0045 106.9761 354.0045 106.9761C354.0045 106.9761 354.0045 61.54635 354.0045 61.54635C354.0045 61.54635 365.5233 61.54635 365.5233 61.54635" />
        <path id="text-o"
          d="M394.9161 60.31503C398.4909 60.31503 401.7678 60.93069 404.7468 62.16201C407.8251 63.39333 410.5062 65.0715 412.6908 67.20645C414.9747 69.3414 416.7621 71.87355 417.9537 74.8029C419.2446 77.73225 419.8404 80.88999 419.8404 84.28605C419.8404 87.62253 419.2446 90.75048 418.053 93.67983C416.8614 96.60918 415.1733 99.14133 412.9887 101.316C410.8041 103.4013 408.123 105.0894 405.144 106.3803C402.0657 107.6712 398.6895 108.267 394.9161 108.267C391.3413 108.267 387.9651 107.6712 384.9861 106.4796C381.9078 105.288 379.2267 103.6992 377.0421 101.5146C374.8575 99.4293 373.0701 96.87729 371.8785 93.94794C370.6869 91.01859 369.9918 87.80127 369.9918 84.29598C369.9918 81.01908 370.6869 77.92092 371.8785 74.99157C373.1694 72.06222 374.8575 69.52014 377.0421 67.3554C379.2267 65.19066 381.9078 63.4827 384.8868 62.22159C387.9651 60.95055 391.3413 60.31503 394.9161 60.31503C394.9161 60.31503 394.9161 60.31503 394.9161 60.31503M382.0071 83.97822C382.0071 86.0238 382.305 87.86085 382.9008 89.48937C383.5959 91.11789 384.4896 92.51802 385.5819 93.68976C386.7735 94.8615 388.1637 95.7552 389.6532 96.40065C391.242 97.0461 393.0294 97.36386 394.9161 97.36386C396.9021 97.36386 398.6895 97.0461 400.179 96.40065C401.7678 95.7552 403.158 94.84164 404.3496 93.64011C405.4419 92.44851 406.3356 91.02852 407.0307 89.4C407.6265 87.77148 407.9244 85.98408 407.9244 84.06759C407.9244 82.26033 407.6265 80.57223 407.0307 78.99336C406.3356 77.41449 405.4419 76.03422 404.3496 74.84262C403.158 73.65102 401.7678 72.7176 400.179 72.04236C398.6895 71.36712 396.9021 71.03943 394.9161 71.03943C392.9301 71.03943 391.1427 71.37705 389.5539 72.04236C387.9651 72.7176 386.5749 73.63116 385.4826 74.79297C384.3903 75.96471 383.4966 77.33505 382.9008 78.90399C382.305 80.47293 382.0071 82.17096 382.0071 83.97822C382.0071 83.97822 382.0071 83.97822 382.0071 83.97822" />
        <path id="text-n"
          d="M464.724 106.9761C464.724 106.9761 453.1059 106.9761 453.1059 106.9761C453.1059 106.9761 453.1059 79.71825 453.1059 79.71825C453.1059 76.84848 452.3115 74.64402 450.822 73.09494C449.2332 71.54586 446.6514 70.77132 443.1759 70.77132C440.7927 70.77132 439.1046 70.87062 438.1116 71.03943C437.1186 71.21817 436.2249 71.44656 435.4305 71.74446C435.4305 71.74446 435.4305 106.9761 435.4305 106.9761C435.4305 106.9761 423.8124 106.9761 423.8124 106.9761C423.8124 106.9761 423.8124 69.98685 423.8124 69.98685C423.8124 68.69595 423.8124 67.72281 423.8124 67.04757C423.7131 66.37233 423.7131 65.8659 423.6138 65.50842C423.5145 65.16087 423.3159 64.88283 423.1173 64.6743C422.9187 64.46577 422.7201 64.13808 422.4222 63.66144C423.3159 63.37347 424.3089 63.03585 425.5005 62.64858C426.6921 62.27124 428.0823 61.90383 429.7704 61.55628C431.4585 61.20873 433.4445 60.91083 435.7284 60.68244C438.0123 60.45405 440.6934 60.33489 443.7717 60.33489C446.9493 60.33489 449.829 60.71223 452.3115 61.47684C454.8933 62.24145 457.1772 63.39333 458.9646 64.94241C460.8513 66.49149 462.2415 68.43777 463.2345 70.78125C464.2275 73.12473 464.724 75.87534 464.724 79.03308C464.724 79.03308 464.724 106.9761 464.724 106.9761" />
      </g>
    </svg></div>`;

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-logo");
    }

    protected render()
    {
        return html`<div class="sv-short">${Logo.h}</div><div class="sv-full">${Logo.h}${Logo.text}</div>`;
    }
}