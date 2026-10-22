import path from "node:path"

const ALLOWED_ROOTS = new Set(["AGENTS.md", "docs", ".opencode"])

export function validateArchiveEntries(entries) {
  return entries.map((entry) => {
    const normalized = entry.replace(/^\.\//, "").replace(/\/$/, "")
    if (!normalized || normalized.includes("\\") || path.posix.isAbsolute(normalized)) {
      throw new Error(`不安全的 release archive 路徑：${entry}`)
    }

    const parts = normalized.split("/")
    if (parts.some((part) => part === ".." || part === ".")) {
      throw new Error(`不安全的 release archive 路徑：${entry}`)
    }
    if (!ALLOWED_ROOTS.has(parts[0])) {
      throw new Error(`release archive 含有不允許的路徑：${entry}`)
    }

    return normalized
  })
}

export function destinationForEntry(entry, target, scope) {
  const parts = entry.split("/")
  const mapped = scope === "global" && parts[0] === ".opencode" ? parts.slice(1) : parts
  const destination = path.resolve(target, ...mapped)
  const relative = path.relative(path.resolve(target), destination)
  if (relative.startsWith(`..${path.sep}`) || relative === ".." || path.isAbsolute(relative)) {
    throw new Error(`安裝路徑超出目標目錄：${entry}`)
  }
  return destination
}

export function destinationForDirectory(directory, target, scope) {
  const parts = directory.split("/")
  const mapped = scope === "global" && parts[0] === ".opencode" ? parts.slice(1) : parts
  return path.resolve(target, ...mapped)
}
