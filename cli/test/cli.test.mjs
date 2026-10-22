import test from "node:test"
import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import { parseArgs } from "../src/arguments.mjs"

const cli = fileURLToPath(new URL("../src/cli.mjs", import.meta.url))

test("保留指令、預設值及安裝參數", () => {
  assert.equal(parseArgs([]).command, "help")
  assert.equal(parseArgs(["install"]).options.version, "latest")
  assert.deepEqual(parseArgs(["update", "--global", "--version", "v1.2.3", "-y"]).options, {
    scope: "global", version: "v1.2.3", yes: true, projectDir: undefined,
  })
  assert.throws(() => parseArgs(["install", "--version", "--yes"]), /需要指定/)
  assert.throws(() => parseArgs(["install", "--project-dir"]), /需要指定/)
  assert.throws(() => parseArgs(["install", "--global", "--project-dir", "project"]), /不能同時/)
})

test("執行入口顯示版本、說明及非零錯誤碼", () => {
  const version = spawnSync(process.execPath, [cli, "version"], { encoding: "utf8" })
  assert.equal(version.status, 0)
  assert.match(version.stdout, /^\d+\.\d+\.\d+/)
  const help = spawnSync(process.execPath, [cli, "--help"], { encoding: "utf8" })
  assert.equal(help.status, 0)
  assert.match(help.stdout, /用法/)
  const invalid = spawnSync(process.execPath, [cli, "update", "--version", "--yes"], { encoding: "utf8" })
  assert.equal(invalid.status, 1)
  assert.match(invalid.stderr, /需要指定 tag/)
})

test("匯入入口不會執行 CLI", () => {
  const url = new URL("../src/cli.mjs", import.meta.url).href
  const result = spawnSync(process.execPath, ["--input-type=module", "-e", `await import(${JSON.stringify(url)})`], { encoding: "utf8" })
  assert.equal(result.status, 0)
  assert.equal(result.stdout, "")
})
