#!/usr/bin/env bun
import Pastel from "pastel";

const app = new Pastel({
  importMeta: import.meta,
  name: "leagues",
  description: "Query OSRS League progress for the user and configured players",
});

await app.run();
