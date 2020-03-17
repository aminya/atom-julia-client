"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const atom_jasmine3_test_runner_1 = require("atom-jasmine3-test-runner");
// https://github.com/UziTech/atom-jasmine3-test-runner#api
exports.default = atom_jasmine3_test_runner_1.createRunner({
    timeReporter: true,
    specHelper: true,
    testPackages: ["language-julia", "ink"]
});
//# sourceMappingURL=runner.js.map