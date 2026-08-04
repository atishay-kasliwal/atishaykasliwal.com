---
title: "Your backtest is lying to you"
description: "Point-in-time correctness is the difference between a financial ML pipeline that works and one that only appears to. Here is where the leaks hide and how to design them out."
date: "2026-07-14"
tags: ["Machine Learning", "Data Engineering", "NLP", "Finance"]
category: "Engineering"
featured: true
draft: false
---

The first version of my FOMC pipeline returned 27% in backtest. I spent an afternoon feeling clever, and then most of a week finding the leak.

There was no bug in the model. There was a bug in *time*.

## The shape of the problem

The pipeline ingests Federal Reserve communications — statements, minutes, speeches — extracts a stance signal from each, and aligns that signal against market data to see whether the language moves anything. Standard applied NLP, structurally.

The trouble is that every one of those inputs has two timestamps, and it is very easy to use the wrong one:

- **Event time** — when the thing happened. A meeting concluded on March 19.
- **Publication time** — when you could actually have known about it. Minutes from that meeting are released three weeks later.

Join on event time and you have built a machine that trades on documents from the future. It will look extraordinary.

## Where the leaks actually hide

Look-ahead bias is not one bug you fix once. It is a category, and it reappears anywhere the pipeline touches time.

**Revised data.** Macroeconomic series get restated after initial publication. Pull GDP for Q1 2024 today and you get the revised figure, not the one that was on the screen in Q1 2024. Your model trains on numbers nobody had.

**Survivorship in the document set.** Scraping the Fed's current site gives you documents that still exist. Anything moved, superseded, or quietly re-filed is gone. The archive you get is the one that survived, which is not the one a contemporaneous reader saw.

**Normalization across the whole set.** This is the subtle one. Fitting a scaler, computing a mean, or building a vocabulary across the *entire* corpus bakes global statistics into every individual sample. Standardizing sentiment scores against the full-period mean tells each training row something about the distribution of a period that had not happened yet. No single row looks wrong. The aggregate is poisoned.

**Model artifacts.** Embeddings from a model trained on text through 2025, applied to documents from 2021, means the representation itself encodes four years of subsequent language. The leak is inside the weights.

## The fix is architectural, not analytical

You cannot test your way out of this reliably, because a leak produces results that look *better*, and nobody debugs a good number. The constraint has to be structural — the pipeline should make the wrong join awkward to express.

Three things did most of the work:

**1. Every record carries `available_at`.**

Not `date`. Not `timestamp`. An explicit field meaning: the earliest wall-clock moment this row could have been known. Ingestion computes it once, at the boundary, and it is never derived later.

```python
@dataclass(frozen=True)
class Document:
    content: str
    event_time: datetime      # when it happened
    available_at: datetime    # when it was knowable — the only one joins may use
    source: str
    revision: int = 0
```

Making it `frozen` matters more than it looks. A mutable timestamp is a timestamp somebody will quietly overwrite three transformations downstream.

**2. Feature lookups take an `as_of` argument, and it is required.**

```python
def features_as_of(self, as_of: datetime) -> pd.DataFrame:
    """Every feature knowable at `as_of`. Nothing else, by construction."""
    visible = self._store[self._store.available_at <= as_of]
    return (
        visible
        .sort_values("available_at")
        .groupby("feature_key")
        .last()
    )
```

No default value. A caller who has not thought about what time it is cannot get data out. That single design choice caught more mistakes than any test I wrote.

**3. Append-only storage with revisions.**

Restatements insert a new row with a later `available_at` rather than updating the old one. The original stays queryable, because reconstructing what was known on a given date is the entire job. Updating in place destroys exactly the history you need.

## What happened to the 27%

It got much smaller, and it became real.

The signal that survived was narrower than the one I started with: not "the Fed sounded hawkish" but "the Fed sounded *more* hawkish than in its previous statement, and the change was concentrated in the forward-guidance paragraph." Absolute sentiment on central bank prose is almost constant — it is engineered to be. Nearly all the information is in the delta.

That is a less exciting finding. It is also one I believe, which the first number was not.

## What I would tell myself at the start

Treat any backtest result that surprises you as a bug report against your data pipeline, not as a discovery. The prior should be overwhelming: you have made a mistake with time. Financial data is adversarial toward the careless in a way that most ML data is not, because the errors flatter you.

The modeling was maybe a fifth of this project. Correct time handling was the rest, and it was where all the risk lived.

---

*The FOMC Intelligence pipeline is research work at Stony Brook University. Reported figures describe a simulation, not a trading record.*
