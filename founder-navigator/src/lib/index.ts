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
