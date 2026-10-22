import { spawnSync } from "node:child_process"
import { copyFile, mkdir, mkdtemp, rm } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { ensureNoSymlinkPath, sha256File, statIfExists } from "./files.mjs"
import { destinationForEntry } from "./paths.mjs"
import { prepareRelease } from "./release.mjs"

export function resolveTarget(options) {
  if (options.scope === "global") return path.join(os.homedir(), ".config", "opencode")
  if (options.projectDir) return path.resolve(options.projectDir)
  const result = spawnSync("git", ["rev-parse", "--show-toplevel"], {
    cwd: process.cwd(), encoding: "utf8", windowsHide: true,
  })
  return result.status === 0 ? result.stdout.trim() : process.cwd()
}

export async function installRelease(options, {
  prepare = prepareRelease,
  confirm,
  target = resolveTarget(options),
  temporaryRoot = os.tmpdir(),
} = {}) {
  const temporary = await mkdtemp(path.join(temporaryRoot, "bojii-skills-"))
  try {
    const release = await prepare(options.version, temporary)
    const planned = []
    const conflicts = []
    const destinations = new Set()
    for (const entry of release.entries) {
      const source = path.join(release.directory, ...entry.split("/"))
      const destination = destinationForEntry(entry, target, options.scope)
      const key = process.platform === "win32" ? destination.toLowerCase() : destination
      if (destinations.has(key)) throw new Error(`release payload 包含重複安裝路徑：${destination}`)
      destinations.add(key)
      await ensureNoSymlinkPath(destination)
      const existing = await statIfExists(destination)
      if (existing && !existing.isFile()) throw new Error(`目的端不是一般檔案：${destination}`)
      if (existing) {
        const [before, after] = await Promise.all([sha256File(destination), sha256File(source)])
        if (before === after) continue
        conflicts.push(path.relative(target, destination))
      }
      planned.push({ source, destination })
    }
    if (conflicts.length && !(await confirm(conflicts, options.yes))) {
      return { cancelled: true, target, tag: release.tag }
    }
    for (const item of planned) {
      await ensureNoSymlinkPath(item.destination)
      await mkdir(path.dirname(item.destination), { recursive: true })
      await copyFile(item.source, item.destination)
    }
    return { cancelled: false, target, tag: release.tag }
  } finally {
    await rm(temporary, { recursive: true, force: true })
  }
}
