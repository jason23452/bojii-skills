#!/usr/bin/env node

import { createHash } from "node:crypto"
import { spawnSync } from "node:child_process"
import { createReadStream, readFileSync } from "node:fs"
import { copyFile, lstat, mkdir, mkdtemp, readFile, readdir, rm } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import readline from "node:readline/promises"
import { stdin, stdout } from "node:process"
import { destinationForEntry, validateArchiveEntries } from "./paths.mjs"

const OWNER = "jason23452"
const REPOSITORY = "bojii-skills"
const PACK_ASSET = "bojii-skills-pack.tar.gz"
const CHECKSUM_ASSET = "SHA256SUMS.txt"
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")

function printHelp() {
  stdout.write(`bojii-skills ${readPackageVersion()}\n\n`)
  stdout.write("用法：\n")
  stdout.write("  node cli.mjs install [--global | --project-dir <path>] [--version <tag>] [--yes]\n")
  stdout.write("  node cli.mjs update  [--global | --project-dir <path>] [--version <tag>] [--yes]\n")
  stdout.write("  node cli.mjs version\n\n")
  stdout.write("預設更新目前 Git 專案；--global 安裝到 ~/.config/opencode。\n")
  stdout.write("預設使用最新 GitHub Release/tag；可用 --version <tag> 指定版本。\n")
  stdout.write("更新會提示並覆寫目的端相同路徑的檔案；--yes 可略過確認。\n")
}

function readPackageVersion() {
  try {
    const pkg = JSON.parse(requirePackageJson())
    return pkg.version
  } catch {
    return "development"
  }
}

function requirePackageJson() {
  return readFileSync(path.join(ROOT, "package.json"), "utf8")
}

function parseArgs(args) {
  const command = args[0]
  const options = { scope: "project", yes: false, version: "latest", projectDir: undefined }
  for (let index = 1; index < args.length; index += 1) {
    const arg = args[index]
    if (arg === "--global") options.scope = "global"
    else if (arg === "--project-dir") {
      options.projectDir = args[index + 1]
      if (!options.projectDir) throw new Error("--project-dir 需要指定路徑")
      index += 1
    } else if (arg === "--version") {
      options.version = args[index + 1]
      if (!options.version) throw new Error("--version 需要指定 tag")
      index += 1
    } else if (arg === "--yes" || arg === "-y") options.yes = true
    else throw new Error(`未知參數：${arg}`)
  }
  if (options.scope === "global" && options.projectDir) {
    throw new Error("--global 與 --project-dir 不能同時使用")
  }
  return { command, options }
}

function resolveTarget(options) {
  if (options.scope === "global") {
    return path.join(os.homedir(), ".config", "opencode")
  }
  if (options.projectDir) return path.resolve(options.projectDir)

  const result = spawnSync("git", ["rev-parse", "--show-toplevel"], {
    cwd: process.cwd(),
    encoding: "utf8",
    windowsHide: true,
  })
  if (result.status === 0) return result.stdout.trim()
  return process.cwd()
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "bojii-skills-cli",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  })
  if (!response.ok) {
    throw new Error(`GitHub API 回應 ${response.status}：${await response.text()}`)
  }
  return response.json()
}

async function fetchRelease(version) {
  const base = `https://api.github.com/repos/${OWNER}/${REPOSITORY}/releases`
  const url = version === "latest" ? `${base}/latest` : `${base}/tags/${encodeURIComponent(version)}`
  return fetchJson(url)
}

async function download(url, destination) {
  const response = await fetch(url, {
    headers: { "User-Agent": "bojii-skills-cli", Accept: "application/octet-stream" },
    redirect: "follow",
  })
  if (!response.ok) throw new Error(`下載失敗 (${response.status})：${url}`)
  await mkdir(path.dirname(destination), { recursive: true })
  const bytes = Buffer.from(await response.arrayBuffer())
  await import("node:fs/promises").then(({ writeFile }) => writeFile(destination, bytes))
  return bytes
}

async function sha256File(filePath) {
  const hash = createHash("sha256")
  for await (const chunk of createReadStream(filePath)) hash.update(chunk)
  return hash.digest("hex")
}

function runTar(args) {
  const result = spawnSync("tar", args, { encoding: "utf8", windowsHide: true })
  if (result.error) throw new Error(`無法執行 tar：${result.error.message}`)
  if (result.status !== 0) throw new Error(`tar 失敗：${result.stderr || result.stdout}`)
  return result.stdout
}

async function listFiles(directory, root = directory) {
  const files = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name)
    if (entry.isSymbolicLink()) throw new Error(`release payload 不允許 symbolic link：${fullPath}`)
    if (entry.isDirectory()) files.push(...await listFiles(fullPath, root))
    else if (entry.isFile()) files.push(path.relative(root, fullPath).split(path.sep).join("/"))
  }
  return files
}

async function isFile(filePath) {
  try {
    return (await lstat(filePath)).isFile()
  } catch {
    return false
  }
}

async function ensureNoSymlinkPath(filePath) {
  const absolute = path.resolve(filePath)
  const root = path.parse(absolute).root
  let current = root
  for (const segment of absolute.slice(root.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, segment)
    try {
      const info = await lstat(current)
      if (info.isSymbolicLink()) throw new Error(`拒絕透過 symbolic link 寫入：${current}`)
    } catch (error) {
      if (error.code === "ENOENT") continue
      throw error
    }
  }
}

async function confirmOverwrite(conflicts, yes) {
  if (conflicts.length === 0) return true
  stdout.write("以下目的端檔案將被 release 版本覆寫：\n")
  for (const file of conflicts) stdout.write(`  - ${file}\n`)
  if (yes) return true
  if (!stdin.isTTY || !stdout.isTTY) {
    throw new Error("非互動終端需要加上 --yes 才能覆寫既有檔案")
  }
  const prompt = readline.createInterface({ input: stdin, output: stdout })
  try {
    const answer = await prompt.question("要繼續覆寫嗎？[y/N] ")
    return ["y", "yes"].includes(answer.trim().toLowerCase())
  } finally {
    prompt.close()
  }
}

async function installRelease(options) {
  const release = await fetchRelease(options.version)
  const assets = new Map(release.assets.map((asset) => [asset.name, asset.browser_download_url]))
  if (!assets.has(PACK_ASSET) || !assets.has(CHECKSUM_ASSET)) {
    throw new Error(`Release ${release.tag_name} 缺少 payload 或 checksum asset`)
  }

  const temporary = await mkdtemp(path.join(os.tmpdir(), "bojii-skills-"))
  try {
    const archivePath = path.join(temporary, PACK_ASSET)
    const checksumPath = path.join(temporary, CHECKSUM_ASSET)
    await Promise.all([
      download(assets.get(PACK_ASSET), archivePath),
      download(assets.get(CHECKSUM_ASSET), checksumPath),
    ])

    const checksums = await readFile(checksumPath, "utf8")
    const expected = checksums.split(/\r?\n/).map((line) => line.trim().split(/\s+/)).find((parts) => parts.at(-1) === PACK_ASSET)?.[0]
    if (!expected || (await sha256File(archivePath)) !== expected) {
      throw new Error("payload checksum 驗證失敗，已中止安裝")
    }

    const entries = validateArchiveEntries(runTar(["-tzf", archivePath]).split(/\r?\n/).filter(Boolean))
    const extracted = path.join(temporary, "payload")
    await mkdir(extracted)
    runTar(["-xzf", archivePath, "-C", extracted])

    const target = resolveTarget(options)
    const planned = []
    for (const entry of entries) {
      const source = path.join(extracted, ...entry.split("/"))
      if (!(await isFile(source))) continue
      const destination = destinationForEntry(entry, target, options.scope)
      planned.push({ entry, source, destination })
    }
    if (planned.length === 0) throw new Error("release payload 沒有可安裝檔案")

    const conflicts = []
    for (const item of planned) {
      await ensureNoSymlinkPath(item.destination)
      if (await isFile(item.destination)) {
        const [existing, incoming] = await Promise.all([
          readFile(item.destination),
          readFile(item.source),
        ])
        if (!existing.equals(incoming)) conflicts.push(path.relative(target, item.destination))
      }
    }

    if (!(await confirmOverwrite(conflicts, options.yes))) {
      stdout.write("已取消，未修改目的端檔案。\n")
      return
    }

    for (const item of planned) {
      await mkdir(path.dirname(item.destination), { recursive: true })
      const existing = await isFile(item.destination)
        ? await readFile(item.destination)
        : undefined
      const incoming = await readFile(item.source)
      if (existing?.equals(incoming)) continue
      await copyFile(item.source, item.destination)
    }
    stdout.write(`已安裝 bojii-skills ${release.tag_name} 至 ${target}\n`)
    stdout.write("注意：相同路徑的檔案已覆寫；release 中已移除的舊檔案不會自動刪除。\n")
  } finally {
    await rm(temporary, { recursive: true, force: true })
  }
}

export async function main(args = process.argv.slice(2)) {
  const { command, options } = parseArgs(args)
  if (!command || command === "help" || command === "--help" || command === "-h") {
    printHelp()
    return
  }
  if (command === "version" || command === "--version") {
    stdout.write(`${readPackageVersion()}\n`)
    return
  }
  if (command !== "install" && command !== "update") {
    throw new Error(`未知命令：${command}`)
  }
  await installRelease(options)
}

main().catch((error) => {
  console.error(`bojii-skills: ${error.message}`)
  process.exitCode = 1
})
