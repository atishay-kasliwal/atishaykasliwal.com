---
title: "MRI Tumor Viewer: ship the model to the browser"
description: "The biggest gain in this viewer did not come from another point of accuracy. It came from moving inference to the reviewer’s machine and removing the upload step."
date: "2026-08-07"
tags: ["Machine Learning", "Healthcare", "TensorFlow.js", "Privacy"]
category: "Engineering"
featured: false
image: "/projects/mri-tumor-viewer-tile.jpg"
draft: false
---

The most important choice in this project was not the model architecture. It was where the model ran.

In medical imaging, people tend to focus first on raw accuracy. That matters, of course. But in practice a workflow can still be slow, awkward, and hard to trust even with a strong model if it adds friction in the wrong place. What delayed value here was not only classification quality. It was time-to-first-read.

That pushed me toward a less common deployment target: the browser.

## The queue matters more than the headline metric

Reviewing scans is a throughput problem as much as an ML problem.

If clinicians wait on uploads, remote inference, or tool-switching before they can even inspect a result, the model may be technically accurate and operationally unhelpful. A smaller improvement that fits the workflow cleanly can matter more than another benchmark win that arrives late.

That is why I treated the viewer as part of the model, not as a shell around it. The product needed to shorten the path from opening a scan to seeing something useful.

## Why the browser was the right deployment target

Running inference client-side solved two problems at once.

First, it reduced privacy exposure. MRI data is not the kind of thing you casually move around just because a hosted endpoint is easier to maintain. Keeping pixels on the reviewer's machine removes an entire category of risk and compliance overhead.

Second, it cut latency in the workflow. There is no upload wait and no server round-trip before the reviewer can start interacting with the scan. That matters when the alternative is sending large volumes to a service first and only then rendering the result.

The core path became:

- train offline on GCP
- export and quantize for TensorFlow.js
- run inference in the browser
- render slice-by-slice overlays the reviewer can inspect immediately

That design choice is what turned the system into a practical tool instead of only a research artifact.

## Quantization was a product decision

Getting the model into the browser was not a mechanical export step. It was a trade study.

A model that is too large to load or too slow to run interactively is functionally unavailable, even if it is more accurate on paper. Quantization was therefore not just an optimization task. It was part of product design: decide how much model complexity the real workflow can afford.

This is where a lot of ML projects quietly fall apart. They treat deployment as a packaging problem after the "real work" is done. In reality, the deployment target changes what counts as a good model.

For this viewer, a slightly leaner model that loads reliably and responds quickly is often the better clinical experience than a heavier model that wins the metric table but loses the room.

## Accuracy needed the right framing

The reported classification accuracy is useful, but it is not enough on its own.

Tumor voxels are a small fraction of any given volume, which means naive aggregate accuracy can flatter a model that mostly predicts background correctly. That is why the evaluation had to care about recall and segmentation behavior, not just a broad percentage.

The viewer design also reflects that mindset. The segmentation appears as an overlay, not a replacement for the original scan. The scan stays authoritative. The model assists interpretation; it does not pretend to become the image.

That is a small interface detail with a big implication: the system is built to support clinical judgment, not to obscure it.

## What this project changed for me

This was one of the clearest examples I have seen of workflow placement beating raw model glamour.

The throughput gain came from meeting the clinician where the work actually happens. Reducing the path from scan to first useful visual mattered more than squeezing for an extra talking point in evaluation.

If I pushed this further, I would keep working on browser-side performance and richer interaction around overlays, but I would protect the same core principle: the most valuable model is the one that arrives early enough, privately enough, and clearly enough to fit the real workflow.

That is the version that turns ML from a result into a tool.
