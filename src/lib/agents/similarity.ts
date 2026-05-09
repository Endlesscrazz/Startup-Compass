import { getCompanyEmbeddings, cosineSimilarity, type EmbeddedCompany } from "./embedCompanies";
import { embedText } from "@/lib/embed";

export async function searchCompanies(
  query: string,
  topK: number = 10,
  filterFn?: (company: EmbeddedCompany) => boolean
): Promise<EmbeddedCompany[]> {
  const queryVector = await embedText(query);
  const allEmbeddings = await getCompanyEmbeddings();
  
  let candidates = allEmbeddings;
  if (filterFn) {
    candidates = candidates.filter(filterFn);
  }

  // Calculate similarity scores
  const scored = candidates.map(c => ({
    company: c.company,
    vector: c.vector,
    score: cosineSimilarity(queryVector, c.vector)
  }));

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, topK);
}
