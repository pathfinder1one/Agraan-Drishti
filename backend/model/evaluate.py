"""
Evaluation metrics: POD, FAR, lead time, IoU.
"""
import torch
import numpy as np
from typing import List, Dict
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))
from config import EVENT_TYPES


@torch.no_grad()
def compute_metrics(predictions: dict, targets: torch.Tensor, threshold: float = 0.5) -> dict:
    """
    Compute POD, FAR, and IoU per event type.

    Args:
        predictions: {event_type: (B, H, W) probabilities}
        targets: (B, 3, H, W) binary labels
        threshold: probability threshold for detection
    """
    metrics = {}
    for i, etype in enumerate(EVENT_TYPES):
        pred_binary = (predictions[etype] > threshold).float()
        target = targets[:, i]

        tp = (pred_binary * target).sum().item()
        fp = (pred_binary * (1 - target)).sum().item()
        fn = ((1 - pred_binary) * target).sum().item()

        pod = tp / (tp + fn + 1e-10)  # Probability of Detection
        far = fp / (tp + fp + 1e-10)  # False Alarm Rate
        iou = tp / (tp + fp + fn + 1e-10)  # Intersection over Union

        metrics[etype] = {"POD": pod, "FAR": far, "IoU": iou}

    return metrics


def evaluate_events(model, dataset, device="cpu") -> List[Dict]:
    """Evaluate model on each event individually."""
    model.eval()
    results = []

    for idx in range(len(dataset)):
        sample = dataset.samples[idx]
        if not sample["is_positive"]:
            continue

        X, y, terrain = dataset[idx]
        X = X.unsqueeze(0).to(device)
        y = y.unsqueeze(0).to(device)
        terrain = terrain.unsqueeze(0).to(device)

        with torch.no_grad():
            preds = model(X, terrain)

        metrics = compute_metrics(preds, y)
        event = sample["event"]
        results.append({
            "event_id": event.event_id,
            "date": event.date,
            "type": event.event_type,
            "description": event.description,
            "metrics": metrics,
            "max_prob": {k: float(v.max()) for k, v in preds.items()},
        })

    return results


def print_evaluation_report(results: List[Dict]):
    """Pretty-print evaluation results."""
    print("\n" + "=" * 80)
    print("EVALUATION REPORT")
    print("=" * 80)

    for r in results:
        m = r["metrics"][r["type"]]
        print(f"\n{r['event_id']} | {r['date']} | {r['type']}")
        print(f"  {r['description']}")
        print(f"  POD: {m['POD']:.3f} | FAR: {m['FAR']:.3f} | IoU: {m['IoU']:.3f}")
        print(f"  Max prob: {r['max_prob'][r['type']]:.3f}")

    # Aggregate
    print("\n" + "-" * 40)
    print("AGGREGATE:")
    for etype in EVENT_TYPES:
        events_of_type = [r for r in results if r["type"] == etype]
        if not events_of_type:
            continue
        avg_pod = np.mean([r["metrics"][etype]["POD"] for r in events_of_type])
        avg_far = np.mean([r["metrics"][etype]["FAR"] for r in events_of_type])
        print(f"  {etype:15s} | POD: {avg_pod:.3f} | FAR: {avg_far:.3f} | N={len(events_of_type)}")
