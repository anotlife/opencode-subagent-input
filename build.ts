import { fileURLToPath, URL } from "node:url"
import { mkdir, rm } from "node:fs/promises"
import solidPlugin from "@opentui/solid/bun-plugin"

const entry = fileURLToPath(new URL("./src/tui.tsx", import.meta.url))
const outdir = fileURLToPath(new URL("./dist", import.meta.url))

await rm(outdir, { recursive: true, force: true })
await mkdir(outdir, { recursive: true })

const result = await Bun.build({
  entrypoints: [entry],
  outdir,
  format: "esm",
  target: "bun",
  splitting: false,
  packages: "external",
  external: ["solid-js"],
  plugins: [solidPlugin],
})

if (!result.success) {
  for (const item of result.logs) console.error(item)
  process.exit(1)
}

console.log("built ->", outdir)
