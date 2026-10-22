import test from "node:test"
import assert from "node:assert/strict"
import path from "node:path"
import { destinationForEntry, validateArchiveEntries } from "../src/paths.mjs"

test("project installation preserves repository-relative paths", () => {
  assert.equal(
    destinationForEntry(".opencode/skills/grilling/SKILL.md", "C:/project", "project"),
    path.resolve("C:/project/.opencode/skills/grilling/SKILL.md"),
  )
  assert.equal(
    destinationForEntry("AGENTS.md", "C:/project", "project"),
    path.resolve("C:/project/AGENTS.md"),
  )
})

test("global installation maps project .opencode contents into OpenCode config root", () => {
  assert.equal(
    destinationForEntry(".opencode/skills/grilling/SKILL.md", "C:/home/.config/opencode", "global"),
    path.resolve("C:/home/.config/opencode/skills/grilling/SKILL.md"),
  )
  assert.equal(
    destinationForEntry("docs/agents/grilling.md", "C:/home/.config/opencode", "global"),
    path.resolve("C:/home/.config/opencode/docs/agents/grilling.md"),
  )
})

test("archive validation rejects traversal and paths outside the managed payload", () => {
  assert.deepEqual(validateArchiveEntries(["AGENTS.md", "docs/agents/domain.md"]), [
    "AGENTS.md",
    "docs/agents/domain.md",
  ])
  assert.throws(() => validateArchiveEntries(["../../outside.txt"]), /不安全/)
  assert.throws(() => validateArchiveEntries([".git/config"]), /不允許/)
})
