---
title: "Legal RAG: citations before answers"
description: "In legal retrieval, fluent text is not the product. The product is traceability. This is why I inverted the usual RAG contract and made retrieval quality the gate."
date: "2026-08-09"
tags: ["RAG", "LLMs", "Legal Tech", "AI Systems"]
category: "Engineering"
featured: false
image: "/projects/legal-rag-tile.jpg"
draft: false
---

Most RAG demos optimize for the wrong applause line.

They answer quickly, sound fluent, and make the model feel confident. In legal work, that is not enough. A legal answer without a source somebody can inspect is not useful just because it reads well. It is often worse than no answer, because it invites trust without giving the reader any way to verify the claim.

That was the starting constraint for this project: the answer is not the product unless the citation holds up.

## Why I inverted the usual RAG contract

The default RAG pattern is straightforward: retrieve some chunks, hand them to the model, and ask for a summary. The failure mode is straightforward too. If retrieval is weak, the model smooths over the gaps and produces something that sounds coherent anyway.

That is tolerable in some domains. It is not tolerable here.

So I flipped the contract. Instead of "answer if you can," the system behaves more like "retrieve first, answer only from what retrieval can support, and refuse when the evidence is weak." That is a less magical user experience on the surface, but it is a much better trust contract.

The goal was never to make the model feel smart. The goal was to make the system auditable.

## Structural chunking mattered more than model choice

One of the earliest design choices was to chunk legal documents on structural boundaries instead of fixed token windows.

Fixed windows are easy to implement and usually wrong for this kind of material. Clauses get split in the middle, headings detach from the text they govern, and the citation lands on a fragment that cannot stand on its own. The retrieval score may look acceptable while the evidence is still unusable.

Chunking by sections, clauses, and other document boundaries costs more preprocessing work, but it pays back in the only place that matters: when a reader opens the cited span, it reads like a real unit of meaning instead of a clipped excerpt.

That single choice improved answer quality more than swapping models did.

## Retrieval quality is the whole product

This project reinforced something I keep running into with LLM systems: many "generation" problems are retrieval problems in disguise.

If the wrong chunk comes back, the answer is doomed before the prompt even starts. If the right chunks come back but in the wrong order, the answer drifts. If two relevant passages disagree and the system hides the disagreement, the model looks smoother while the product gets less trustworthy.

So most of the real work ended up in the layers before generation:

- better chunk boundaries
- ranking that respected document structure
- metadata filters for narrowing by document and jurisdiction
- a response contract that forbids unsupported claims

Once those pieces were right, the model had a fair chance to behave. Before that, it was just papering over retrieval mistakes.

## Refusal is a feature, not a fallback

One decision I feel strongly about is refusal under weak retrieval.

People sometimes see refusal as a sign that the system is failing. In legal contexts it is often the system behaving correctly. If the evidence is thin, approximate confidence is the dangerous outcome. A refusal that says, in effect, "I do not have enough support for this answer" is much closer to what a careful human would do.

That makes the product less theatrical and more dependable.

It also changes how the interface should feel. A good legal assistant is not trying to hide uncertainty. It is trying to surface the boundary between what the source supports and what the model is tempted to infer.

## What this project changed in how I think about RAG

The main shift for me was seeing retrieval not as plumbing around the model, but as the system's actual core logic.

Improving chunking, ranking, and refusal behavior moved output quality far more than changing the model did. The answer contract only works if the retrieval layer deserves that power.

If I extended this system further, I would keep pushing in the same direction: stronger handling of contradictory passages, better provenance on every claim, and more explicit UI around what came from source text versus what came from synthesis.

That is the version of RAG I trust most now. Not the version that tries hardest to answer, but the one that makes it hardest to answer casually.
