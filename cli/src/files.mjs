import { createHash } from "node:crypto"
import { createReadStream } from "node:fs"
import { lstat, readdir } from "node:fs/promises"
import path from "node:path"

export async function sha256File(filePath) {
  const hash = createHash("sha256")
  for await (const chunk of createReadStream(filePath)) hash.update(chunk)
  return hash.digest("hex")
}

export async function statIfExists(filePath) {
  try {
    return await lstat(filePath)
  } catch (error) {
    if (error.code === "ENOENT") return undefined
    throw error
  }
}

export async function ensureNoSymlinkPath(filePath) {
  const absolute = path.resolve(filePath)
  const root = path.parse(absolute).root
  let current = root
  for (const segment of absolute.slice(root.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, segment)
    const info = await statIfExists(current)
    if (info?.isSymbolicLink()) throw new Error(`拒絕透過 symbolic link 寫入：${current}`)
    if (info && current !== absolute && !info.isDirectory()) {
      throw new Error(`安裝路徑的父層不是目錄：${current}`)
    }
  }
}

export async function listFiles(directory, root = directory) {
  const files = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await listFiles(fullPath, root))
    else if (entry.isFile()) files.push(path.relative(root, fullPath).split(path.sep).join("/"))
    else throw new Error(`release payload 不允許連結或特殊檔案：${fullPath}`)
  }
  return files.sort()
}
