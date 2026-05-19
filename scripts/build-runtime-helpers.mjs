import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { build } from "esbuild";

const entry = resolve("src/runtime/supabase-runtime-helpers.ts");
const outfile = resolve("js/generated/supabase-runtime-helpers.generated.js");

await mkdir(dirname(outfile), { recursive: true });

await build({
  entryPoints: [entry],
  outfile,
  bundle: true,
  format: "iife",
  platform: "browser",
  target: ["es2020"],
  sourcemap: false,
  minify: false,
  legalComments: "none",
  charset: "utf8",
  banner: {
    js: "/* Generated from src/runtime/supabase-runtime-helpers.ts. Do not edit manually. */",
  },
});

console.log(`Generated ${outfile}`);
