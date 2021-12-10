/**
 * 3D Foundation Project
 * Copyright 2021 Smithsonian Institution
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

const _selectors = 'a[href], button, input, textarea, select, details,[tabindex]:not([tabindex="-1"])';

// function adapted from: https://zellwk.com/blog/keyboard-focusable-elements/
export function getFocusableElements (element: HTMLElement) 
{
    return [...element.querySelectorAll(_selectors)]
      .filter(el => !el.hasAttribute('disabled') && !el.getAttribute("aria-hidden") && (el.getAttribute("tabindex") !== "-1"))
}

export function focusTrap (focusableElements: HTMLElement[], e: KeyboardEvent) 
{
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length-1];
    
    if(e.shiftKey) {
        if(e.target === firstElement) {
            e.preventDefault();
            lastElement.focus();
        }
    }
    else {
        if(e.target === lastElement) {
            e.preventDefault();
            firstElement.focus();
        }
    }
}