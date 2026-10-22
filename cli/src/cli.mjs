#!/usr/bin/env node

import { readFileSync, realpathSync } from "node:fs"
import { pathToFileURL } from "node:url"
import readline from "node:readline/promises"
import { stdin, stdout } from "node:process"
import { parseArgs } from "./arguments.mjs"
import { installRelease } from "./install.mjs"

function readPackageVersion() {
  return JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8")).version
}

function printHelp() {
  stdout.write(`bojii-skills ${readPackageVersion()}\n\n`)
  stdout.write("用法：\n")
  stdout.write("  bojii-skills install [--global | --project-dir <path>] [--version <tag>] [--yes]\n")
  stdout.write("  bojii-skills update  [--global | --project-dir <path>] [--version <tag>] [--yes]\n")
  stdout.write("  bojii-skills version\n\n")
  stdout.write("預設更新目前 Git 專案；--global 安裝到 ~/.config/opencode。\n")
  stdout.write("預設使用最新 GitHub Release/tag；可用 --version <tag> 指定版本。\n")
  stdout.write("更新會提示並覆寫目的端相同路徑的檔案；--yes 可略過確認。\n")
  stdout.write("以逐檔合併方式安裝；既有的其他 skills 與安裝包未包含的檔案會保留。\n")
}

async function confirmOverwrite(conflicts, yes) {
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

export async function main(args = process.argv.slice(2)) {
  const { command, options } = parseArgs(args)
  if (["help", "--help", "-h"].includes(command)) return printHelp()
  if (["version", "--version"].includes(command)) {
    stdout.write(`${readPackageVersion()}\n`)
    return
  }
  const result = await installRelease(options, { confirm: confirmOverwrite })
  if (result.cancelled) {
    stdout.write("已取消，未修改目的端檔案。\n")
    return
  }
  stdout.write(`已安裝 bojii-skills ${result.tag} 至 ${result.target}\n`)
  stdout.write("已逐檔合併；既有的其他 skills 與安裝包未包含的檔案皆保留。\n")
}

if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  main().catch((error) => {
    console.error(`bojii-skills: ${error.message}`)
    process.exitCode = 1
  })
}
