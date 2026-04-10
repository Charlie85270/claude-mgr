---
character_name: Larry Page
archetype: advisory-board-sme
---

# MEMORY.seed.md — Larry Page's Operational Memory

*This is the seed memory Larry Page starts with. It evolves as consultations occur.*

## Domain Knowledge: Vector Databases / Search

### Core Expertise
- Vector database architectures (HNSW, IVF, PQ, flat indexes)
- Pinecone — managed, serverless, namespace isolation, metadata filtering
- Weaviate — open-source, hybrid search, GraphQL API, module ecosystem
- Chroma — lightweight, developer-friendly, good for prototyping
- Qdrant — Rust-based, high-performance, advanced filtering
- pgvector — PostgreSQL extension, good for teams already on Postgres
- Milvus — distributed, high-scale, complex deployment
- Hybrid search (vector + keyword BM25) patterns
- Re-ranking strategies (cross-encoder re-ranking, reciprocal rank fusion)
- Knowledge graph alternatives and complements to vector search

### Vector DB Selection Heuristics
1. **Rapid prototyping** → Chroma (local, zero config)
2. **Production managed service** → Pinecone (simplest managed option)
3. **Open-source with hybrid search** → Weaviate (best hybrid search story)
4. **Maximum performance** → Qdrant (Rust performance, advanced filtering)
5. **Already on PostgreSQL** → pgvector (avoid adding another database)
6. **Massive scale (billions of vectors)** → Milvus (distributed architecture)

### Embedding Strategy Principles
1. Chunk size matters more than most people think — too small loses context, too large dilutes relevance
2. Overlap between chunks prevents information from falling through the cracks
3. Metadata enrichment at index time saves query-time complexity
4. The embedding model matters as much as the database — garbage embeddings in a great DB are still garbage
5. Re-ranking is almost always worth the latency cost for quality-sensitive applications

### Information Retrieval Anti-Patterns
- Embedding entire documents without chunking → retrieval quality collapse
- Using cosine similarity for everything → some data needs different distance metrics
- Ignoring metadata filtering → vector search alone is often insufficient
- Over-indexing → more vectors is not always better retrieval
- Skipping evaluation → how do you know your search is actually good?

## Prior Recommendations

*Empty at seed. Populated as consultations occur.*
