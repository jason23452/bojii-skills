import { spawnSync } from "node:child_process"
import { createWriteStream } from "node:fs"
import { mkdir, readFile } from "node:fs/promises"
import path from "node:path"
import { Readable } from "node:stream"
import { pipeline } from "node:stream/promises"
import { listFiles, sha256File } from "./files.mjs"
import { validateArchiveEntries } from "./paths.mjs"

const PACK_ASSET = "bojii-skills-pack.tar.gz"
const CHECKSUM_ASSET = "SHA256SUMS.txt"
const RELEASE_URL = "https://api.github.com/repos/jason23452/bojii-skills/releases"

async function request(url, accept, fetchImpl) {
  let response
  try {
    response = await fetchImpl(url, {
      headers: {
        Accept: accept,
        "User-Agent": "bojii-skills-cli",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(120_000),
    })
  } catch (error) {
    throw new Error(`無法連線至 ${url}：${error.message}`, { cause: error })
  }
  if (!response.ok) {
    await response.body?.cancel()
    throw new Error(`下載失敗 (${response.status})：${url}`)
  }
  return response
}

async function download(url, destination, fetchImpl) {
  const response = await request(url, "application/octet-stream", fetchImpl)
  if (!response.body) throw new Error(`下載內容為空：${url}`)
  await pipeline(Readable.fromWeb(response.body), createWriteStream(destination))
}

function runTar(args) {
  const result = spawnSync("tar", args, { encoding: "utf8", windowsHide: true })
  if (result.error) throw new Error(`無法執行 tar：${result.error.message}`)
  if (result.status !== 0) throw new Error(`tar 失敗：${result.stderr || result.stdout}`)
  return result.stdout
}

export async function prepareRelease(version, temporary, { fetchImpl = fetch } = {}) {
  const url = version === "latest" ? `${RELEASE_URL}/latest` : `${RELEASE_URL}/tags/${encodeURIComponent(version)}`
  const response = await request(url, "application/vnd.github+json", fetchImpl)
  const release = await response.json()
  if (!release.tag_name || !Array.isArray(release.assets)) throw new Error("GitHub Release 資料格式不正確")
  const assets = new Map(release.assets.map((asset) => [asset.name, asset.browser_download_url]))
  if (!assets.get(PACK_ASSET) || !assets.get(CHECKSUM_ASSET)) {
    throw new Error(`Release ${release.tag_name} 缺少 payload 或 checksum asset`)
  }
  const archive = path.join(temporary, PACK_ASSET)
  const checksum = path.join(temporary, CHECKSUM_ASSET)
  // 所有下載結束後才回報錯誤，避免暫存清理與仍在寫入的下載競爭。
  const downloads = await Promise.allSettled([
    download(assets.get(PACK_ASSET), archive, fetchImpl),
    download(assets.get(CHECKSUM_ASSET), checksum, fetchImpl),
  ])
  const failure = downloads.find((result) => result.status === "rejected")
  if (failure) throw failure.reason
  const checksums = await readFile(checksum, "utf8")
  const expected = checksums.split(/\r?\n/)
    .map((line) => /^([a-f\d]{64})\s+\*?(.+)$/.exec(line.trim()))
    .find((match) => match?.[2] === PACK_ASSET)?.[1]
  if (!expected || await sha256File(archive) !== expected) {
    throw new Error("payload checksum 驗證失敗，已中止安裝")
  }
  validateArchiveEntries(runTar(["-tzf", archive]).split(/\r?\n/).filter(Boolean))
  const directory = path.join(temporary, "payload")
  await mkdir(directory)
  runTar(["-xzf", archive, "-C", directory])
  const entries = validateArchiveEntries(await listFiles(directory))
  if (entries.length === 0) throw new Error("release payload 沒有可安裝檔案")
  return { tag: release.tag_name, directory, entries }
}
