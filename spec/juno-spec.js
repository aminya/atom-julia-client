"use strict";
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
Object.defineProperty(exports, "__esModule", { value: true });
const jasmine = require('jasmine');
const jasmine_1 = require("jasmine");
const juno = require("../lib/julia-client");
const { client } = juno.connection;
if (process.platform === "darwin") {
    process.env.PATH += ":/usr/local/bin";
}
async function basicSetup() {
    jasmine.attachToDOM(atom.views.getView(atom.workspace));
    await atom.packages.activatePackage("language-julia");
    await atom.packages.activatePackage("ink");
    await atom.packages.activatePackage("julia-client");
    await atom.config.set("julia-client", {
        juliaPath: "julia",
        juliaOptions: {
            bootMode: "Basic",
            optimisationLevel: 2,
            deprecationWarnings: false
        },
        consoleOptions: {
            rendererType: true
        }
    });
}
async function cyclerSetup() {
    await basicSetup();
    await atom.config.set("julia-client.juliaOptions.bootMode", "Cycler");
}
let conn = null;
async function withClient() {
    jasmine_1.beforeEach(async function () {
        if (conn != null) {
            await client.attach(conn);
        }
    });
}
const testClient = require("./client");
const testEval = require("./eval");
jasmine_1.describe("managing a basic client", function () {
    jasmine_1.beforeEach(basicSetup);
    await testClient();
});
jasmine_1.describe("interaction with client cycler", function () {
    jasmine_1.beforeEach(cyclerSetup);
    await testClient();
});
jasmine_1.describe("before use", function () {
    jasmine_1.beforeEach(basicSetup);
    jasmine_1.it("boots the client", function (done) {
        setTimeout(function (done1) {
            juno.connection.boot()
                .then(() => done1());
        }, 5 * 60 * 1000);
        conn = client.conn;
        done();
    });
});
jasmine_1.describe("in an editor", function () {
    jasmine_1.beforeEach(basicSetup);
    withClient();
    testEval();
});
jasmine_1.describe("after use", function () {
    jasmine_1.beforeEach(basicSetup);
    withClient();
    jasmine_1.it("kills the client", () => client.kill());
});
//# sourceMappingURL=juno-spec.js.map