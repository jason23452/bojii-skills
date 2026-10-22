import test from "node:test"
import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { spawnSync } from "node:child_process"
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { prepareRelease } from "../src/release.mjs"

async function fixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), "bojii-release-test-"))
  t.after(() => rm(root, { recursive: true, force: true }))
  const source = path.join(root, "source")
  const temporary = path.join(root, "temporary")
  await mkdir(source)
  await mkdir(temporary)
  await writeFile(path.join(source, "AGENTS.md"), "專案指引")
  const archive = path.join(root, "pack.tar.gz")
  const result = spawnSync("tar", ["-czf", archive, "-C", source, "AGENTS.md"], { encoding: "utf8" })
  assert.equal(result.status, 0, result.error?.message ?? result.stderr)
  const bytes = await readFile(archive)
  const checksum = createHash("sha256").update(bytes).digest("hex")
  const requests = []
  const fetchImpl = async (url) => {
    requests.push(url)
    if (url === "https://example.test/pack") return new Response(bytes)
    if (url === "https://example.test/checksum") return new Response(`${checksum}  bojii-skills-pack.tar.gz\n`)
    return Response.json({ tag_name: "v1.0.0", assets: [
      { name: "bojii-skills-pack.tar.gz", browser_download_url: "https://example.test/pack" },
      { name: "SHA256SUMS.txt", browser_download_url: "https://example.test/checksum" },
    ] })
  }
  return { temporary, fetchImpl, requests }
}

test("下載、驗證 checksum 並解壓指定 Release", async (t) => {
  const context = await fixture(t)
  const release = await prepareRelease("v1.0.0", context.temporary, context)
  assert.equal(release.tag, "v1.0.0")
  assert.deepEqual(release.entries, ["AGENTS.md"])
  assert.equal(await readFile(path.join(release.directory, "AGENTS.md"), "utf8"), "專案指引")
  assert.match(context.requests[0], /\/tags\/v1\.0\.0$/)
})

test("checksum 不符時拒絕解壓", async (t) => {
  const context = await fixture(t)
  await assert.rejects(prepareRelease("latest", context.temporary, {
    fetchImpl: (url) => url.endsWith("/checksum")
      ? new Response(`${"0".repeat(64)}  bojii-skills-pack.tar.gz\n`)
      : context.fetchImpl(url),
  }), /checksum 驗證失敗/)
  await assert.rejects(readFile(path.join(context.temporary, "payload", "AGENTS.md")), { code: "ENOENT" })
})

test("下載失敗會等待其他下載結束才回報錯誤", async (t) => {
  const context = await fixture(t)
  let finish
  const completed = new Promise((resolve) => { finish = resolve })
  let checksumStarted
  const started = new Promise((resolve) => { checksumStarted = resolve })
  let settled = false
  const operation = prepareRelease("latest", context.temporary, {
    fetchImpl: async (url) => {
      if (url.endsWith("/pack")) return new Response("失敗", { status: 500 })
      if (url.endsWith("/checksum")) {
        checksumStarted()
        await completed
      }
      return context.fetchImpl(url)
    },
  })
  const checked = assert.rejects(operation, /500/).then(() => { settled = true })
  await started
  assert.equal(settled, false)
  finish()
  await checked
})
