export function parseArgs(args) {
  const command = args[0] ?? "help"
  const options = { scope: "project", yes: false, version: "latest", projectDir: undefined }
  if (!["install", "update", "help", "--help", "-h", "version", "--version"].includes(command)) {
    throw new Error(`未知命令：${command}`)
  }
  for (let index = 1; index < args.length; index += 1) {
    const arg = args[index]
    if (arg === "--global") options.scope = "global"
    else if (arg === "--yes" || arg === "-y") options.yes = true
    else if (arg === "--project-dir" || arg === "--version") {
      const value = args[index + 1]
      if (!value || value.startsWith("-")) {
        throw new Error(`${arg} 需要指定${arg === "--version" ? " tag" : "路徑"}`)
      }
      options[arg === "--version" ? "version" : "projectDir"] = value
      index += 1
    } else throw new Error(`未知參數：${arg}`)
  }
  if (options.scope === "global" && options.projectDir) {
    throw new Error("--global 與 --project-dir 不能同時使用")
  }
  return { command, options }
}
