import path from "path";
import fs from "fs";

export const EMBEDDING_DIM = 3072;

export interface Resource {
  id: number;
  title: string;
  description: string;
  communities: string[];
  industries: string[];
  locations: string[];
  topics: string[];
  link: string | null;
  email: string | null;
}

export interface IndexEntry extends Resource {
  embedding: Float32Array;
}

// Module-level singleton — survives across requests in the same serverless instance
let _index: IndexEntry[] | null = null;

export function reloadIndex(): IndexEntry[] {
  _index = null;
  return getIndex();
}

export function getNextId(): number {
  const index = getIndex();
  if (index.length === 0) return 1;
  return Math.max(...index.map((e) => e.id)) + 1;
}

export function addToIndex(resource: Resource, embedding: Float32Array): IndexEntry {
  const index = getIndex();
  const entry: IndexEntry = { ...resource, embedding };
  index.push(entry);
  return entry;
}

export function updateInIndex(
  id: number,
  updates: Partial<Resource>,
  embedding?: Float32Array,
): IndexEntry {
  const index = getIndex();
  const i = index.findIndex((e) => e.id === id);
  if (i === -1) throw new Error(`Resource id=${id} not found`);
  const updated: IndexEntry = {
    ...index[i],
    ...updates,
    ...(embedding ? { embedding } : {}),
  };
  index[i] = updated;
  return updated;
}

export function deleteFromIndex(id: number): void {
  const index = getIndex();
  const i = index.findIndex((e) => e.id === id);
  if (i === -1) throw new Error(`Resource id=${id} not found`);
  index.splice(i, 1);
}

export function getIndex(): IndexEntry[] {
  if (_index) return _index;

  const dataDir = path.join(process.cwd(), "data");
  const resources: Resource[] = JSON.parse(
    fs.readFileSync(path.join(dataDir, "resources.json"), "utf-8")
  );
  const embeddingsRaw: { id: number; embedding: number[] }[] = JSON.parse(
    fs.readFileSync(path.join(dataDir, "embeddings.json"), "utf-8")
  );

  const embeddingMap = new Map(
    embeddingsRaw.map((e) => [e.id, new Float32Array(e.embedding)])
  );

  _index = resources.map((r) => {
    const emb = embeddingMap.get(r.id);
    if (!emb) throw new Error(`Missing embedding for resource id=${r.id}`);
    if (emb.length !== EMBEDDING_DIM)
      throw new Error(`Wrong dim for id=${r.id}: got ${emb.length}`);
    return { ...r, embedding: emb };
  });

  return _index;
}
