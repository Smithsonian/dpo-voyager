import chai from "chai";
import chaiAsPromised from "chai-as-promised";

//@ts-ignore
import sourceMaps from "source-map-support";
sourceMaps.install();

chai.use(chaiAsPromised);

process.env["TEST"] ??= "true";