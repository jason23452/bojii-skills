import test from "node:test"
import assert from "node:assert/strict"
import { mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { installRelease } from "../src/install.mjs"

async function fixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), "bojii-install-test-"))
  t.after(() => rm(root, { recursive: true, force: true }))
  const target = path.join(root, "target")
  const temporaryRoot = path.join(root, "temporary")
  await mkdir(target)
  await mkdir(temporaryRoot)
  const prepare = async (version, directory) => {
    await mkdir(path.join(directory, ".opencode", "skills"), { recursive: true })
    await writeFile(path.join(directory, "AGENTS.md"), "新版")
    await writeFile(path.join(directory, ".opencode", "skills", "example.md"), "技能")
    return { tag: "v1.0.0", directory, entries: ["AGENTS.md", ".opencode/skills/example.md"] }
  }
  return { target, temporaryRoot, prepare }
}

const options = { scope: "project", version: "latest", yes: false }

for (const scope of ["project", "global"]) {
  for (const overwrite of [false, true]) {
    test(`${scope} 合併 skills：${overwrite ? "覆寫衝突" : "新增技能"}時保留其他技能及額外檔案`, async (t) => {
      const dependencies = await fixture(t)
      const config = scope === "project" ? path.join(dependencies.target, ".opencode") : dependencies.target
      const custom = path.join(config, "skills", "my-skill", "SKILL.md")
      const managed = path.join(config, "skills", "grilling", "SKILL.md")
      const extra = path.join(config, "skills", "grilling", "notes.md")
      const settings = path.join(config, "opencode.json")
      await mkdir(path.dirname(custom), { recursive: true })
      await mkdir(path.dirname(managed), { recursive: true })
      await writeFile(custom, "自訂技能")
      await writeFile(extra, "使用者筆記")
      await writeFile(settings, "{}")
      if (overwrite) await writeFile(managed, "舊版技能")
      const preserved = [custom, extra, settings]
      const before = await Promise.all(preserved.map((file) => stat(file)))
      let confirmations = 0
      await installRelease({ ...options, scope, yes: overwrite }, {
        ...dependencies,
        prepare: async (version, directory) => {
          const entry = ".opencode/skills/grilling/SKILL.md"
          const source = path.join(directory, ...entry.split("/"))
          await mkdir(path.dirname(source), { recursive: true })
          await writeFile(source, "新版技能")
          return { tag: "v1.0.0", directory, entries: [entry] }
        },
        confirm: async (conflicts, yes) => {
          confirmations += 1
          assert.equal(yes, true)
          assert.deepEqual(conflicts, [path.relative(dependencies.target, managed)])
          return true
        },
      })
      assert.equal(confirmations, overwrite ? 1 : 0)
      assert.equal(await readFile(managed, "utf8"), "新版技能")
      assert.deepEqual(await Promise.all(preserved.map((file) => readFile(file, "utf8"))), ["自訂技能", "使用者筆記", "{}"])
      const after = await Promise.all(preserved.map((file) => stat(file)))
      assert.deepEqual(after.map((info) => info.mtimeMs), before.map((info) => info.mtimeMs))
    })
  }
}

test("取消覆寫不新增或修改檔案，並清理暫存目錄", async (t) => {
  const dependencies = await fixture(t)
  await writeFile(path.join(dependencies.target, "AGENTS.md"), "舊版")
  const result = await installRelease(options, {
    ...dependencies,
    confirm: async (conflicts) => {
      assert.deepEqual(conflicts, ["AGENTS.md"])
      return false
    },
  })
  assert.equal(result.cancelled, true)
  assert.equal(await readFile(path.join(dependencies.target, "AGENTS.md"), "utf8"), "舊版")
  assert.deepEqual(await readdir(dependencies.target), ["AGENTS.md"])
  assert.deepEqual(await readdir(dependencies.temporaryRoot), [])
})

test("全域安裝映射技能、保留舊檔案且相同內容不重寫", async (t) => {
  const dependencies = await fixture(t)
  const agent = path.join(dependencies.target, "AGENTS.md")
  await writeFile(agent, "新版")
  await writeFile(path.join(dependencies.target, "old.md"), "保留")
  const before = await stat(agent)
  await installRelease({ ...options, scope: "global" }, dependencies)
  assert.equal((await stat(agent)).mtimeMs, before.mtimeMs)
  assert.equal(await readFile(path.join(dependencies.target, "skills", "example.md"), "utf8"), "技能")
  assert.equal(await readFile(path.join(dependencies.target, "old.md"), "utf8"), "保留")
  assert.deepEqual(await readdir(dependencies.temporaryRoot), [])
})

test("確認後覆寫衝突檔案", async (t) => {
  const dependencies = await fixture(t)
  await writeFile(path.join(dependencies.target, "AGENTS.md"), "舊版")
  await installRelease(options, { ...dependencies, confirm: async () => true })
  assert.equal(await readFile(path.join(dependencies.target, "AGENTS.md"), "utf8"), "新版")
})

test("目的端類型錯誤在任何寫入前回報並清理暫存目錄", async (t) => {
  const dependencies = await fixture(t)
  await mkdir(path.join(dependencies.target, ".opencode"))
  await writeFile(path.join(dependencies.target, ".opencode", "skills"), "阻擋目錄")
  await assert.rejects(installRelease(options, dependencies), /父層不是目錄/)
  assert.deepEqual(await readdir(dependencies.target), [".opencode"])
  assert.deepEqual(await readdir(dependencies.temporaryRoot), [])
})

test("下載失敗仍清理暫存目錄", async (t) => {
  const dependencies = await fixture(t)
  await assert.rejects(installRelease(options, {
    ...dependencies,
    prepare: async () => { throw new Error("下載失敗") },
  }), /下載失敗/)
  assert.deepEqual(await readdir(dependencies.temporaryRoot), [])
})
