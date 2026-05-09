import { COMPANIES, type Company } from "@/lib/map-config";
import { embedText } from "@/lib/embed";

export interface EmbeddedCompany {
  company: Company;
  vector: Float32Array;
}

let cachedEmbeddings: EmbeddedCompany[] | null = null;
let isGenerating = false;

// We process in small chunks to avoid rate limits
async function computeAllEmbeddings(): Promise<EmbeddedCompany[]> {
  const results: EmbeddedCompany[] = [];
  const chunkSize = 10;
  
  for (let i = 0; i < COMPANIES.length; i += chunkSize) {
    const chunk = COMPANIES.slice(i, i + chunkSize);
    const chunkPromises = chunk.map(async (company) => {
      // Build a comprehensive profile string for the company
      const profileStr = [
        company.name,
        company.sector,
        company.stage,
        company.description || "",
        company.city,
        company.hiringStatus === "hiring" ? "hiring now" : "",
        company.remotePolicy ? `remote policy: ${company.remotePolicy}` : "",
        company.founderNeeds ? `founder needs: ${company.founderNeeds.join(", ")}` : "",
      ].filter(Boolean).join(" | ");

      try {
        const vector = await embedText(profileStr);
        return { company, vector };
      } catch (err) {
        console.warn(`Failed to embed company ${company.name}:`, err);
        return null;
      }
    });

    const chunkResults = await Promise.all(chunkPromises);
    for (const res of chunkResults) {
      if (res) results.push(res);
    }
    
    // Slight delay to respect rate limits
    if (i + chunkSize < COMPANIES.length) {
      await new Promise(r => setTimeout(r, 200));
    }
  }
  return results;
}

export async function getCompanyEmbeddings(): Promise<EmbeddedCompany[]> {
  if (cachedEmbeddings) {
    return cachedEmbeddings;
  }
  
  if (isGenerating) {
    // Wait for the generation to finish
    while (isGenerating) {
      await new Promise(r => setTimeout(r, 500));
    }
    return cachedEmbeddings || [];
  }

  isGenerating = true;
  console.log("Generating embeddings for companies...");
  cachedEmbeddings = await computeAllEmbeddings();
  console.log(`Generated ${cachedEmbeddings.length} company embeddings.`);
  isGenerating = false;
  return cachedEmbeddings;
}

export function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
