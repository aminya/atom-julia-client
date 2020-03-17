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

  describe("before booting", () => {
    const checkPath = p => juno.misc.paths.getVersion(p)

    it("can invalidate a non-existant julia binary", () => checkPath(path.join(__dirname, "foobar")).then(fail, () => {}))

    it("can validate a julia command", () => checkPath("julia"))

    it("can invalidate a non-existant julia command", () => checkPath("nojulia").then(fail, () => {}))
  })

  let conn = null
  beforeEach(() => {
    if (conn != null) {
      client.attach(conn)
    }
  })

  describe("when booting the client", () => {
    it("recognises the client's state before boot", () => {
      expect(clientStatus()).toEqual([false, false])
    })

    it("initiates the boot", async () => {
      await juno.connection.local.start()
      conn = client.conn
    })

    it("waits for the boot to complete", () => {
      const pong = client.import("ping")()
      expect(clientStatus()).toEqual([true, true])

      return pong.then(pong => {
        expect(pong).toBe("pong")
      })
    }, 5 * 60 * 1000)

    // it("recognises the client's state after boot", () => {
    //   expect(clientStatus()).toEqual([true, false])
    // }

    describe("while the client is active", () => {
      it("can send and receive nested objects, strings and arrays", () => {
        const msg = { x: 1, y: [1, 2, 3], z: "foo" }
        return echo(msg).then(response => {
          expect(response).toEqual(msg)
        })
      })

      it("can evaluate code and return the result", () => {
        const remote = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(x => evalsimple(`${x}^2`))
        return Promise.all(remote).then(remote =>
            expect(remote).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(x => Math.pow(x, 2))
        ))
      })

      it("can rpc into the frontend", () => {
        let x
        client.handle({
          test: (x) => Math.pow(x, 2)
        })
        const result = []
        for (let i = 1; i <= 10; i++) {
          result.push(evalsimple(`Atom.@rpc test(${i})`))
        }

        return Promise.all(result).then(remote => {
          const result1 = []
          for (let i = 1; i <= 10; i++) {
            result1.push(Math.pow(x, 2))
          }
          expect(remote).toEqual(result1)
        })
      })

      it("can retrieve promise values from the frontend", async () => {
        client.handle({
          test: (x) => Promise.resolve(x)
        })
        await evalsimple("Atom.@rpc test(2)").then(x => {
          expect(x).toBe(2)
        })
      })

      describe("when using callbacks", () => {
        let { cbs, workingSpy, doneSpy } = {}

        beforeEach(() => {
          workingSpy = jasmine.createSpy("working")
          doneSpy = jasmine.createSpy("done")
          cbs = [1, 2, 3, 4, 5].map(() => evalsimple("peakflops(100)"))
          client.onWorking(workingSpy)
          client.onDone(doneSpy)
        })

        it("enters loading state", () => {
          expect(client.isWorking()).toBe(true)
        })

        // it("emits a working event", () => {
        //   expect(workingSpy.calls.length).toBe(1)
        // })

        it("isn't done yet", () => {
          expect(doneSpy).not.toHaveBeenCalled()
        })

        describe("when they finish", () => {
          beforeEach(() => Promise.all(cbs))

          it("stops loading after they are done", () => {
            expect(client.isWorking()).toBe(false)
          })

          it("emits a done event", () => {
            expect(doneSpy.calls.length).toBe(1)
          })
        })
      })

      it("can handle a large number of concurrent callbacks", async () => {
        const range = Array(100).fill(0).map((n, i) => i)
        const cbs = range.map(i => evalsimple(`sleep(rand()); ${i}^2`))
        await Promise.all(cbs).then(xs => {
          expect(xs).toEqual(range.map(x => Math.pow(x, 2)))
        })
      })
    })

    it("handles shutdown correctly", async () => {
      await evalsimple("exit()").catch(() => {})
      expect(client.isWorking()).toBe(false)
      expect(clientStatus()).toEqual([false, false])
    })
  })
}
