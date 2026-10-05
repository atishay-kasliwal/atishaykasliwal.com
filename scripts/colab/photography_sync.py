"""Tags pending photographs for the portfolio archive. Run in Google Colab (GPU optional).

Setup in Colab, once per session:
    !pip install -q transformers torch pillow requests
    import os, getpass
    os.environ["SITE_URL"] = "https://atishaykasliwal.com"
    os.environ["INGEST_SECRET"] = getpass.getpass("Ingest secret: ")

The secret is read from the environment and is never written to disk or to this repository.
Running the script twice is safe: the server replaces each photo's tag set and records runs
idempotently, so a repeated sync does not duplicate tags or captions.
"""

import io
import os
import uuid

import requests
import torch
from PIL import Image
from transformers import CLIPModel, CLIPProcessor

SITE_URL = os.environ["SITE_URL"].rstrip("/")
SECRET = os.environ["INGEST_SECRET"]
MODEL_ID = "openai/clip-vit-base-patch32"
THRESHOLD = 0.12  # Minimum CLIP softmax share for a tag to apply.
TOP_TAGS = 6

headers = {"Authorization": f"Bearer {SECRET}"}


def load_model():
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model = CLIPModel.from_pretrained(MODEL_ID).to(device).eval()
    processor = CLIPProcessor.from_pretrained(MODEL_ID)
    return model, processor, device


def pending_photos():
    response = requests.get(f"{SITE_URL}/api/photography/ingest", headers=headers, timeout=30)
    response.raise_for_status()
    return response.json()


def tag_image(image, vocabulary, model, processor, device):
    prompts = [f"a photo of {term}" for term in vocabulary]
    inputs = processor(text=prompts, images=image, return_tensors="pt", padding=True).to(device)
    with torch.no_grad():
        logits = model(**inputs).logits_per_image[0]
    shares = logits.softmax(dim=0).cpu().tolist()
    ranked = sorted(zip(vocabulary, shares), key=lambda pair: pair[1], reverse=True)
    tags = [term for term, share in ranked[:TOP_TAGS] if share >= THRESHOLD]
    caption = ", ".join(tags[:3]) if tags else ""
    return tags, caption


def main():
    model, processor, device = load_model()
    payload = pending_photos()
    vocabulary = payload["vocabulary"]
    items = []
    for photo in payload["pending"]:
        try:
            raw = requests.get(photo["src"], timeout=60)
            raw.raise_for_status()
            image = Image.open(io.BytesIO(raw.content)).convert("RGB")
            tags, caption = tag_image(image, vocabulary, model, processor, device)
            items.append({"id": photo["id"], "tags": tags, "caption": caption})
        except Exception as error:  # One failed image must not stop the batch.
            print(f"skipped {photo['id']}: {error}")
    if not items:
        print("nothing to sync")
        return
    run_id = f"run-{uuid.uuid4().hex[:12]}"
    response = requests.post(
        f"{SITE_URL}/api/photography/ingest",
        headers={**headers, "Content-Type": "application/json"},
        json={"runId": run_id, "photos": items},
        timeout=120,
    )
    response.raise_for_status()
    result = response.json()
    print(f"run {result['runId']}: tagged {len(result['applied'])}, skipped {len(result['skipped'])}")


if __name__ == "__main__":
    main()
