/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

const path = require("path")
const juno = require("../lib/julia-client")

const { client } = juno.connection

module.exports = function() {
  const clientStatus = () => [client.isActive(), client.isWorking()]
  const { echo, evalsimple } = client.import(["echo", "evalsimple"])

  describe("before booting", function() {
    const checkPath = p => juno.misc.paths.getVersion(p)

    it("can invalidate a non-existant julia binary", done => checkPath(path.join(__dirname, "foobar")).catch(() => done()))

    it("can validate a julia command", done => checkPath("julia").then(() => done()))

    it("can invalidate a non-existant julia command", done => checkPath("nojulia").catch(() => done()))
  })

  let conn = null
  beforeEach(function() {
    if (conn != null) {
      client.attach(conn)
    }
  })

  describe("when booting the client", function() {
    it("recognises the client's state before boot", () => expect(clientStatus()).toEqual([false, false]))

    it("initiates the boot", async function() {
      await juno.connection.local.start()
      conn = client.conn
    })

    it("waits for the boot to complete", function(done) {
      const pong = client.import("ping")()
      expect(clientStatus()).toEqual([true, true])

      setTimeout(() => {
        pong.then(function(pong) {
          expect(pong).toBe("pong")
          done()
        })
      }, 5 * 60 * 1000)
    })

    // it "recognises the client's state after boot", ->
    //   expect(clientStatus()).toEqual [true, false]

    describe("while the client is active", function() {
      it("can send and receive nested objects, strings and arrays", async function() {
        const msg = { x: 1, y: [1, 2, 3], z: "foo" }
        return await (() => echo(msg).then(response => expect(response).toEqual(msg)))
      })

      it("can evaluate code and return the result", function() {
        const remote = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(x => evalsimple(`${x}^2`))
        return Promise.all(remote).then(remote =>
            expect(remote).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(x => Math.pow(x, 2))
        ))
      })

      it("can rpc into the frontend", function() {
        let x
        client.handle({
          test(x) {
            Math.pow(x, 2)
          }
        })
        const remote = (() => {
          let i
          const result = []
          for (i = 1, x = i; i <= 10; i++, x = i) {
            result.push(evalsimple(`Atom.@rpc test(${x})`))
          }
          result
        })()
        Promise.all(remote).then(remote =>
          expect(remote).toEqual(
            (() => {
              const result1 = []
              for (x = 1; x <= 10; x++) {
                result1.push(Math.pow(x, 2))
              }
              result1
            })()
          )
        )
      })

      it("can retrieve promise values from the frontend", async function(done) {
        client.handle({
          test(x) {
            Promise.resolve(x)
          }
        })
        await evalsimple("Atom.@rpc test(2)").then(x => expect(x).toBe(2))
        done()
      })

      describe("when using callbacks", function() {
        let { cbs, workingSpy, doneSpy } = {}

        beforeEach(function() {
          client.onWorking((workingSpy = jasmine.createSpy("working")))
          client.onDone((doneSpy = jasmine.createSpy("done")))(
            (cbs = [1, 2, 3, 4, 5].map(i => evalsimple("peakflops(100)")))
          )
        })

        it("enters loading state", () => expect(client.isWorking()).toBe(true))

        // it "emits a working event", ->
        //   expect(workingSpy.calls.length).toBe(1)

        it("isn't done yet", () => expect(doneSpy).not.toHaveBeenCalled())

        describe("when they finish", function() {
          beforeEach(() => setTimeout(done => Promise.all(cbs).then(done)), 10 * 1000)

          it("stops loading after they are done", () => expect(client.isWorking()).toBe(false))

          it("emits a done event", () => expect(doneSpy.calls.length).toBe(1))
        })
      })

      it("can handle a large number of concurrent callbacks", async function() {
        const n = 100
        const cbs = __range__(0, n, false).map(i => evalsimple(`sleep(rand()); ${i}^2`))
        await Promise.all(cbs).then(xs => expect(xs).toEqual(__range__(0, n, false).map(x => Math.pow(x, 2))))
      })
    })

    it("handles shutdown correctly", function(done) {
      evalsimple("exit()").catch(() => done())
      expect(client.isWorking()).toBe(false)
      expect(clientStatus()).toEqual([false, false])
    })
  })

  function __range__(left, right, inclusive) {
    let range = []
    let ascending = left < right
    let end = !inclusive ? right : ascending ? right + 1 : right - 1
    for (let i = left; ascending ? i < end : i > end; ascending ? i++ : i--) {
      range.push(i)
    }
    range
  }
}
