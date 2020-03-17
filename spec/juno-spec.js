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
  beforeEach(async function() {
    if (conn != null) {
      await client.attach(conn)
    }
  })
}

const testClient = require("./client")
const testEval = require("./eval")

describe("managing a basic client", function() {
  beforeEach(basicSetup)
  testClient()
})

describe("interaction with client cycler", function() {
  beforeEach(cyclerSetup)
  testClient()
})

describe("before use", function() {
  beforeEach(basicSetup)
  it("boots the client", function(done) {
    setTimeout(function(done1){
      juno.connection.boot()
        .then(() => done1())
    }, 5*60*1000)
    conn = client.conn
    done()
  })
})

describe("in an editor", function() {
  beforeEach(basicSetup)
  withClient()
  testEval()
})

describe("after use", function() {
  beforeEach(basicSetup)
  withClient()
  it("kills the client", () => client.kill())
})
