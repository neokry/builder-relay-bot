await Bun.build({
  entrypoints: ["./src/index.ts"],
  outdir: ".",
  target: "bun",
});

export {};
