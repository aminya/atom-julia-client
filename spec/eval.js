"use strict";
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
Object.defineProperty(exports, "__esModule", { value: true });
const jasmine = require('jasmine');
const jasmine_1 = require("jasmine");
const juno = require("../lib/julia-client");
const { client } = juno.connection;
module.exports = function () {
    let editor = null;
    const command = (ed, c) => atom.commands.dispatch(atom.views.getView(ed), c);
    async function waitsForClient(done) {
        client.onceDone(done);
    }
    jasmine_1.beforeEach(async function (done) {
        await atom.workspace.open().then(ed => (editor = ed));
        // editor = atom.workspace.buildTextEditor()
        await editor.setGrammar(atom.grammars.grammarForScopeName("source.julia"));
        done();
    });
    jasmine_1.it("can evaluate code", function () {
        let spy;
        client.handle({ test: (spy = jasmine.createSpy()) });
        editor.insertText("Atom.@rpc test()");
        command(editor, "julia-client:run-block");
        waitsForClient();
        jasmine_1.expect(spy).toHaveBeenCalled();
    });
    jasmine_1.describe("when an expression is evaluated", function () {
        let results = null;
        jasmine_1.beforeEach(async function (done) {
            editor.insertText("2+2");
            await juno.runtime.evaluation.eval().then(x => {
                (results = x);
                done();
            });
        });
        jasmine_1.it("retrieves the value of the expression", function () {
            jasmine_1.expect(results.length).toBe(1);
            const view = juno.ui.views.render(results[0]);
            jasmine_1.expect(view.innerText).toBe("4");
        });
        jasmine_1.it("displays the result", function () {
            const views = atom.views.getView(editor).querySelectorAll(".result");
            jasmine_1.expect(views.length).toBe(1);
            jasmine_1.expect(views[0].innerText).toBe("4");
        });
    });
    jasmine_1.describe("completions", function () {
        const completionsData = () => ({
            editor,
            bufferPosition: editor.getCursors()[0].getBufferPosition(),
            scopeDescriptor: editor.getCursors()[0].getScopeDescriptor(),
            prefix: editor.getText()
        });
        const getSuggestions = function () {
            const completions = require("../lib/runtime/completions");
            completions.getSuggestions(completionsData());
        };
        jasmine_1.describe("basic module completions", function () {
            let completions = null;
            jasmine_1.beforeEach(async function (done) {
                editor.insertText("sin");
                await getSuggestions().then(cs => {
                    (completions = cs);
                    done();
                });
            });
            jasmine_1.it("retrieves completions", function () {
                completions = completions.map(c => c.text);
                jasmine_1.expect(completions).toContain("sin");
                jasmine_1.expect(completions).toContain("sincos");
                jasmine_1.expect(completions).toContain("sinc");
            });
        });
    });
};
//# sourceMappingURL=eval.js.map