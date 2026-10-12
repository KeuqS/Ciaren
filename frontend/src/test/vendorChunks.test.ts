// @vitest-environment node

import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";
import { expect, test } from "vitest";

test("production config keeps vendor libraries in their named chunks", async () => {
  const root = fileURLToPath(new URL("../../", import.meta.url));
  const entry = resolve(root, "__react-flow-query_contract__.js").replace(
    /\\/g,
    "/",
  );
  const bundle = await build({
    root,
    configFile: resolve(root, "vite.config.ts"),
    logLevel: "silent",
    plugins: [
      {
        name: "vendor-contract-entry",
        resolveId(id) {
          return id === "ciaren-vendor-contract" ? entry : null;
        },
        load(id) {
          return id === entry
            ? `
          import * as React from 'react';
          import * as ReactDOM from 'react-dom/client';
          import * as Router from 'react-router-dom';
          import * as Flow from '@xyflow/react';
          import * as Query from '@tanstack/react-query';
          console.log(React, ReactDOM, Router, Flow, Query);
        `
            : null;
        },
      },
    ],
    build: {
      write: false,
      minify: false,
      rolldownOptions: { input: "ciaren-vendor-contract" },
    },
  });
  if (Array.isArray(bundle) || !("output" in bundle)) {
    throw new Error("Expected one finite production bundle");
  }
  const chunks = bundle.output.filter((output) => output.type === "chunk");
  const entryChunk = chunks.find((chunk) => chunk.isEntry);
  expect(entryChunk?.moduleIds).toContain(entry);
  expect(["react", "flow", "query"]).not.toContain(entryChunk?.name);
  for (const [name, packages] of [
    ["react", ["react", "react-dom", "react-router-dom"]],
    ["flow", ["@xyflow/react"]],
    ["query", ["@tanstack/react-query"]],
  ] as const) {
    const chunk = chunks.find((candidate) => candidate.name === name);
    expect(chunk, `${name} vendor chunk`).toBeDefined();
    for (const packageName of packages) {
      expect(
        chunk!.moduleIds.some((id) =>
          id.replace(/\\/g, "/").includes(`/node_modules/${packageName}/`),
        ),
        `${packageName} belongs to ${name}`,
      ).toBe(true);
    }
  }
}, 30_000);
