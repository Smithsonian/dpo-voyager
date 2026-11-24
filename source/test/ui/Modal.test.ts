import { expect } from "chai";
import { html } from "@ff/ui/CustomElement";

import Modal, { openModal } from "client/ui/Modal";

const nextFrame = () => new Promise(resolve => setTimeout(resolve, 0));

const element = (parent: ParentNode, tag = "div") => {
    const child = document.createElement(tag);
    parent.append(child);
    return child;
};

/** Opens a popup from `from`, returns it once shown, with a function closing it. */
async function open(from: Element)
{
    const closed = openModal<void>(from, () => html`<button>OK</button>`, { label: "Test" });
    await nextFrame();

    // the popup just opened: the last one in the tree `from` is in
    const tree = from.getRootNode() as Document | ShadowRoot;
    const modal = Array.from(tree.querySelectorAll("sv-modal")).pop() as Modal;

    return { modal, close: () => { modal.close(); return closed; } };
}

describe("Modal", function() {

    // <div page>
    //     <button outside>
    //     <div voyager> (shadow root)
    //         <div content> <button>
    //         <div chrome> <button>
    //         [popups]
    //     <button after>
    let page: HTMLElement, outside: HTMLElement, after: HTMLElement;
    let shadow: ShadowRoot, content: HTMLElement, chrome: HTMLElement, chromeButton: HTMLElement;

    beforeEach(function() {
        page = element(document.body);
        outside = element(page, "button");
        const voyager = element(page);
        after = element(page, "button");

        shadow = voyager.attachShadow({ mode: "open" });
        content = element(shadow);
        element(content, "button");
        chrome = element(shadow);
        chromeButton = element(chrome, "button");
    });

    afterEach(function() {
        page.remove();
    });

    it("opens at the root of the explorer's shadow root, from any element in it", async function() {
        const { modal, close } = await open(chromeButton);

        expect(modal.parentNode).to.equal(shadow);
        expect(modal.querySelector("dialog").open).to.equal(true);
        await close();
        expect(modal.isConnected, "removed once closed").to.equal(false);
    });

    it("makes the rest of the Voyager element inert while open, not the page", async function() {
        const { modal, close } = await open(chromeButton);

        expect(content.inert, "content").to.equal(true);
        expect(chrome.inert, "chrome").to.equal(true);
        expect(modal.inert, "itself").to.equal(false);
        expect(outside.inert || after.inert || page.inert, "embedding page").to.equal(false);

        await close();
        expect(content.inert).to.equal(false);
        expect(chrome.inert).to.equal(false);
    });

    it("keeps the topmost of several popups usable, whatever order they close in", async function() {
        const first = await open(chrome);
        const second = await open(chrome);

        expect(first.modal.inert, "first, covered by second").to.equal(true);
        expect(second.modal.inert, "second").to.equal(false);

        await first.close();
        expect(content.inert, "still covered by second").to.equal(true);
        expect(second.modal.inert, "second").to.equal(false);

        await second.close();
        expect(content.inert).to.equal(false);
    });

    it("leaves elements that were already inert as they were", async function() {
        chrome.inert = true;
        const { close } = await open(content);
        await close();
        expect(chrome.inert).to.equal(true);
    });

    it("releases the rest of the Voyager element if removed without closing", async function() {
        const { modal } = await open(chrome);
        modal.remove();
        expect(content.inert).to.equal(false);
    });

    it("opens in a Voyager element without shadow root, like mini", async function() {
        const mini = element(page, "voyager-mini");
        const miniContent = element(mini);
        const { modal, close } = await open(element(miniContent, "button"));

        expect(modal.parentNode).to.equal(mini);
        expect(miniContent.inert).to.equal(true);
        expect(outside.inert).to.equal(false);
        await close();
    });

    it("covers the whole page outside of a Voyager element", async function() {
        const { modal, close } = await open(outside);

        expect(modal.parentNode).to.equal(document.body);
        expect(page.inert).to.equal(true);
        await close();
        expect(page.inert).to.equal(false);
    });
});
