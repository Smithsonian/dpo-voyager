import { expect } from "chai";
import System from "@ff/graph/System";
import CSunLight from "@ff/scene/components/CSunLight";
import { getTimezoneCoordinates } from "@ff/scene/components/timezoneCoordinates";
import CVSunLight from "client/components/lights/CVSunLight";
import { IDocument, INode } from "client/schema/document";

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
});
