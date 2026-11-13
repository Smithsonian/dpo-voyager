import { expect } from "chai";
import System from "@ff/graph/System";
import CSunLight from "@ff/scene/components/CSunLight";
import { getTimezoneCoordinates } from "@ff/scene/components/timezoneCoordinates";
import Notification from "@ff/ui/Notification";
import CVSunLight from "client/components/lights/CVSunLight";
import CVTimeManager from "client/components/CVTimeManager";
import { IDocument, INode } from "client/schema/document";
import PropertyString from "client/ui/properties/PropertyString";
import PropertyView from "client/ui/story/PropertyView";

class TestTimeManager extends CVTimeManager {
    coordinateChanged(light: CVSunLight) { this.onLatLongChanged(light); }
}

async function timezoneInput(light: CSunLight): Promise<{ view: PropertyView; input: HTMLInputElement }> {
    const view = new PropertyView();
    view.property = light.ins.timezone;
    document.body.appendChild(view);
    await view.updateComplete;
    const field = view.querySelector("sv-property-string") as PropertyString;
    await field.updateComplete;
    return { view, input: field.querySelector("input") };
}

function changeTimezone(input: HTMLInputElement, timezone: string): void {
    input.value = timezone;
    input.dispatchEvent(new Event("change", { bubbles: true }));
}

describe("sunlight timezone defaults", function() {
    it("uses representative locations for different timezones and aliases", function() {
        expect(getTimezoneCoordinates("America/New_York", -300)).to.deep.equal([40.714167, -74.006389]);
        expect(getTimezoneCoordinates("Asia/Kolkata", 330)).to.deep.equal([22.533333, 88.366667]);
        expect(getTimezoneCoordinates("Asia/Calcutta", 330)).to.deep.equal(getTimezoneCoordinates("Asia/Kolkata", 330));
        expect(getTimezoneCoordinates("US/Eastern", -300)).to.deep.equal(getTimezoneCoordinates("America/New_York", -300));
        expect(getTimezoneCoordinates("Europe/Kiev", 120)).to.deep.equal(getTimezoneCoordinates("Europe/Kyiv", 120));
        expect(getTimezoneCoordinates("UTC", 0)).to.deep.equal([0, 0]);
        expect(getTimezoneCoordinates("Etc/GMT+5", -300)).to.deep.equal([0, -75]);
        expect(getTimezoneCoordinates("Etc/GMT-14", 840)).to.deep.equal([0, 180]);
    });

    it("initializes a new light with the guessed timezone's coordinates", function() {
        const node = new System().graph.createNode("Test");
        const light = new CSunLight(node, "sun");
        const expected = getTimezoneCoordinates(light.ins.timezone.value, -new Date().getTimezoneOffset());
        expect([light.ins.latitude.value, light.ins.longitude.value]).to.deep.equal(expected);
        const knownCoordinates: Record<string, [number, number]> = {
            "Europe/Amsterdam": [52.366667, 4.9],
            "America/New_York": [40.714167, -74.006389],
            "Asia/Calcutta": [22.533333, 88.366667],
            "Asia/Kolkata": [22.533333, 88.366667],
            "UTC": [0, 0],
        };
        if (knownCoordinates[light.ins.timezone.value]) {
            expect([light.ins.latitude.value, light.ins.longitude.value]).to.deep.equal(knownCoordinates[light.ins.timezone.value]);
        }
    });

    it("preserves coordinates loaded from a document", function() {
        const node = new System().graph.createNode("Test");
        const light = new CVSunLight(node, "sun");
        const document = { lights: [{ type: "sun", sun: {
            timezone: "Asia/Tokyo", latitude: 35.5, longitude: 139.5
        } }] } as IDocument;
        light.fromDocument(document, { light: 0, name: "Sun" } as INode);
        expect(light.ins.timezone.value).to.equal("Asia/Tokyo");
        expect(light.ins.latitude.value).to.equal(35.5);
        expect(light.ins.longitude.value).to.equal(139.5);
    });

    it("updates coordinates when the timezone field is edited without a feedback loop", async function() {
        const node = new System().graph.createNode("Test");
        const light = new CVSunLight(node, "sun");
        const manager = new TestTimeManager(node, "time");
        light.ins.latitude.on("value", () => manager.coordinateChanged(light));
        light.ins.longitude.on("value", () => manager.coordinateChanged(light));
        const { view, input } = await timezoneInput(light);
        try {
            changeTimezone(input, "Asia/Tokyo");
            expect(light.ins.timezone.value).to.equal("Asia/Tokyo");
            expect([light.ins.latitude.value, light.ins.longitude.value])
                .to.deep.equal(getTimezoneCoordinates("Asia/Tokyo", 540));

            light.ins.latitude.setValue(36);
            expect(light.ins.timezone.value).to.equal("Asia/Tokyo");
            expect(light.ins.latitude.value).to.equal(36);

            changeTimezone(input, "America/New_York");
            expect(light.ins.timezone.value).to.equal("America/New_York");
            expect([light.ins.latitude.value, light.ins.longitude.value]).to.deep.equal([40.714167, -74.006389]);
        }
        finally {
            view.remove();
        }
    });

    it("does not change coordinates for programmatic timezone updates", function() {
        const light = new CSunLight(new System().graph.createNode("Test"), "sun");
        const coordinates = [light.ins.latitude.value, light.ins.longitude.value];
        light.ins.timezone.setValue("Asia/Tokyo");
        expect([light.ins.latitude.value, light.ins.longitude.value]).to.deep.equal(coordinates);
    });

    it("rejects an invalid timezone edit without changing coordinates", async function() {
        const light = new CSunLight(new System().graph.createNode("Test"), "sun");
        const { view, input } = await timezoneInput(light);
        const originalShow = Notification.show;
        const messages: string[] = [];
        Notification.show = message => { messages.push(message); };
        try {
            changeTimezone(input, "Asia/Tokyo");
            const coordinates = [light.ins.latitude.value, light.ins.longitude.value];
            changeTimezone(input, "Not/A_Timezone");
            expect(light.ins.timezone.value).to.equal("Asia/Tokyo");
            expect([light.ins.latitude.value, light.ins.longitude.value]).to.deep.equal(coordinates);
            expect(messages).to.have.length(1);
        }
        finally {
            Notification.show = originalShow;
            view.remove();
        }
    });
});
