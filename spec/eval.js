/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

const juno = require("../lib/julia-client")
const { client } = juno.connection

module.exports = function() {
  let editor = null

  const command = (ed, c) => atom.commands.dispatch(atom.views.getView(ed), c)

  async function waitsForClient() {
    return new Promise(resolve => client.onceDone(resolve))
  }

  beforeEach(async () => {
    editor = await atom.workspace.open()
    // editor = atom.workspace.buildTextEditor()
    await editor.setGrammar(atom.grammars.grammarForScopeName("source.julia"))
  })

  it("can evaluate code", async () => {
    const spy = jasmine.createSpy()
    client.handle({ test: spy })
    editor.insertText("Atom.@rpc test()")
    command(editor, "julia-client:run-block")
    await waitsForClient()
    expect(spy).toHaveBeenCalled()
  })

  describe("when an expression is evaluated", () => {
    let results = null

    beforeEach(async () => {
      editor.insertText("2+2")
      results = await juno.runtime.evaluation.eval()
    })

    it("retrieves the value of the expression", () => {
      expect(results.length).toBe(1)
      const view = juno.ui.views.render(results[0])
      expect(view.innerText).toBe("4")
    })

    it("displays the result", () => {
      const views = atom.views.getView(editor).querySelectorAll(".result")
      expect(views.length).toBe(1)
      expect(views[0].innerText).toBe("4")
    })
  })

  describe("completions", () => {
    function completionsData() {
      return {
        editor,
        bufferPosition: editor.getCursors()[0].getBufferPosition(),
        scopeDescriptor: editor.getCursors()[0].getScopeDescriptor(),
        prefix: editor.getText()
      }
    }

    function getSuggestions() {
      const completions = require("../lib/runtime/completions")
      completions.getSuggestions(completionsData())
    }

    describe("basic module completions", () => {
      let completions = null

      beforeEach(async () => {
        editor.insertText("sin")
        completions = await getSuggestions()
      })

      it("retrieves completions", () => {
        completions = completions.map(c => c.text)
        expect(completions).toContain("sin")
        expect(completions).toContain("sincos")
        expect(completions).toContain("sinc")
      })
    })
  })
}
