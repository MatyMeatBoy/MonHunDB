#!/usr/bin/env node

// Convert glTF materials that were exported as continuously transparent
// (BLEND) to binary cutout materials (MASK). MHFU textures use their alpha
// channel as an on/off visibility mask; BLEND causes depth-sorting artifacts
// when the model is viewed from different angles.

const fs = require("fs");
const path = require("path");

const GLB_MAGIC = 0x46546c67;
const JSON_CHUNK = 0x4e4f534a;

function pad4(buffer, byte) {
  const padding = (4 - (buffer.length % 4)) % 4;
  return padding ? Buffer.concat([buffer, Buffer.alloc(padding, byte)]) : buffer;
}

function fixAlphaMask(filePath) {
  const input = fs.readFileSync(filePath);
  if (input.readUInt32LE(0) !== GLB_MAGIC || input.readUInt32LE(4) !== 2) {
    throw new Error(`${filePath} is not a glTF 2.0 GLB file`);
  }

  const jsonLength = input.readUInt32LE(12);
  if (input.readUInt32LE(16) !== JSON_CHUNK) {
    throw new Error(`${filePath} does not start with a JSON chunk`);
  }

  const document = JSON.parse(input.subarray(20, 20 + jsonLength).toString("utf8").trim());
  const changed = [];

  for (const material of document.materials || []) {
    if (material.alphaMode !== "BLEND") continue;
    material.alphaMode = "MASK";
    material.alphaCutoff = 0.5;
    changed.push(material.name || "(unnamed material)");
  }

  if (!changed.length) {
    console.log(`${filePath}: no BLEND materials found`);
    return;
  }

  const json = pad4(Buffer.from(JSON.stringify(document)), 0x20);
  const remainingChunks = input.subarray(20 + jsonLength);
  const output = Buffer.alloc(20);
  output.writeUInt32LE(GLB_MAGIC, 0);
  output.writeUInt32LE(2, 4);
  output.writeUInt32LE(output.length + json.length + remainingChunks.length, 8);
  output.writeUInt32LE(json.length, 12);
  output.writeUInt32LE(JSON_CHUNK, 16);

  fs.writeFileSync(filePath, Buffer.concat([output, json, remainingChunks]));
  console.log(`${filePath}: BLEND -> MASK (${changed.join(", ")})`);
}

const files = process.argv.slice(2);
if (!files.length) {
  console.error(`Usage: node ${path.basename(process.argv[1])} <model.glb> [...]`);
  process.exit(1);
}

for (const file of files) fixAlphaMask(file);
