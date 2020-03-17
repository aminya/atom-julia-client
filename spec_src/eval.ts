/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

const jasmine = require('jasmine')
import {describe, beforeEach, it, expect} from 'jasmine'

const juno = require("../lib/julia-client")
const { client } = juno.connection

module.exports = function() {
  let editor = null

  const command = (ed, c) => atom.commands.dispatch(atom.views.getView(ed), c)

  async function waitsForClient(done?) {
    client.onceDone(done)
  }

  beforeEach(async function(done) {
    await atom.workspace.open().then(ed => (editor = ed))
    // editor = atom.workspace.buildTextEditor()
    await editor.setGrammar(atom.grammars.grammarForScopeName("source.julia"))
    done()
  })

  it("can evaluate code", function() {
    let spy
    client.handle({ test: (spy = jasmine.createSpy()) })
    editor.insertText("Atom.@rpc test()")
    command(editor, "julia-client:run-block")
    waitsForClient()
    expect(spy).toHaveBeenCalled()
  })

  describe("when an expression is evaluated", function() {
    let results = null

    beforeEach(async function(done) {
      editor.insertText("2+2")
      await juno.runtime.evaluation.eval().then(x => {
          (results = x)
          done()
        })
    })

    it("retrieves the value of the expression", function() {
      expect(results.length).toBe(1)
      const view = juno.ui.views.render(results[0])
      expect(view.innerText).toBe("4")
    })

    it("displays the result", function() {
      const views = atom.views.getView(editor).querySelectorAll(".result")
      expect(views.length).toBe(1)
      expect(views[0].innerText).toBe("4")
    })
  })

  describe("completions", function() {
    const completionsData = () => ({
      editor,
      bufferPosition: editor.getCursors()[0].getBufferPosition(),
      scopeDescriptor: editor.getCursors()[0].getScopeDescriptor(),
      prefix: editor.getText()
    })

    const getSuggestions = function() {
      const completions = require("../lib/runtime/completions")
      completions.getSuggestions(completionsData())
    }

    describe("basic module completions", function() {
      let completions = null

      beforeEach(async function(done) {
        editor.insertText("sin")
        await getSuggestions().then(cs => {
            (completions = cs)
            done()
        })
      })

      it("retrieves completions", function() {
        completions = completions.map(c => c.text)
        expect(completions).toContain("sin")
        expect(completions).toContain("sincos")
        expect(completions).toContain("sinc")
      })
    })
  })
}
