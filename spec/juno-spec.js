/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

const juno = require("../lib/julia-client")
const { client } = juno.connection

if (process.platform === "darwin") {
  process.env.PATH += ":/usr/local/bin"
}

async function basicSetup() {
  jasmine.attachToDOM(atom.views.getView(atom.workspace))
  await atom.packages.activatePackage("language-julia")
  await atom.packages.activatePackage("ink")
  await atom.packages.activatePackage("julia-client")
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
  })
}

async function cyclerSetup() {
  await basicSetup()
  await atom.config.set("julia-client.juliaOptions.bootMode", "Cycler")
}

let conn = null

async function withClient() {
  beforeEach(async () => {
    if (conn != null) {
      await client.attach(conn)
    }
  })
}

const testClient = require("./client")
const testEval = require("./eval")

describe("managing a basic client", () => {
  beforeEach(basicSetup)
  testClient()
})

describe("interaction with client cycler", () => {
  beforeEach(cyclerSetup)
  testClient()
})

describe("before use", () => {
  beforeEach(basicSetup)
  it("boots the client", async () => {
    await juno.connection.boot()
    conn = client.conn
  }, 5*60*1000)
})

describe("in an editor", () => {
  beforeEach(basicSetup)
  withClient()
  testEval()
})

describe("after use", () => {
  beforeEach(basicSetup)
  withClient()
  it("kills the client", () => client.kill())
})
