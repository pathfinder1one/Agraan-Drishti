"""
Training loop for multi-task severe weather model.
Weighted BCE loss across 3 heads, with early stopping and checkpointing.
"""
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
import numpy as np
import json
from pathlib import Path
import sys
import time

sys.path.insert(0, str(Path(__file__).parent.parent.parent))
from config import (
    BATCH_SIZE, LEARNING_RATE, WEIGHT_DECAY, NUM_EPOCHS,
    EARLY_STOP_PATIENCE, MODEL_DIR,
    LOSS_WEIGHT_THUNDERSTORM, LOSS_WEIGHT_CLOUDBURST, LOSS_WEIGHT_FLASHFLOOD,
)
from backend.model.network import SevereWeatherNet


class MultiTaskLoss(nn.Module):
    """Combined weighted BCE loss across thunderstorm, cloudburst, flash-flood heads."""

    def __init__(self):
        super().__init__()
        self.bce = nn.BCELoss(reduction="mean")
        self.weights = {
            "thunderstorm": LOSS_WEIGHT_THUNDERSTORM,
            "cloudburst": LOSS_WEIGHT_CLOUDBURST,
            "flash_flood": LOSS_WEIGHT_FLASHFLOOD,
        }

    def forward(self, predictions, targets):
        """
        Args:
            predictions: dict of {event_type: (B, H, W)}
            targets: (B, 3, H, W) — stacked labels
        """
        loss = 0
        losses = {}
        for i, (event_type, weight) in enumerate(self.weights.items()):
            pred = predictions[event_type]
            target = targets[:, i]
            l = self.bce(pred, target) * weight
            losses[event_type] = l.item()
            loss += l
        return loss, losses


def train_epoch(model, loader, optimizer, criterion, device):
    model.train()
    total_loss = 0
    n_batches = 0

    for X, y, terrain in loader:
        X, y, terrain = X.to(device), y.to(device), terrain.to(device)
        optimizer.zero_grad()
        preds = model(X, terrain)
        loss, _ = criterion(preds, y)
        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
        optimizer.step()
        total_loss += loss.item()
        n_batches += 1

    return total_loss / max(n_batches, 1)


@torch.no_grad()
def validate(model, loader, criterion, device):
    model.eval()
    total_loss = 0
    all_losses = {"thunderstorm": 0, "cloudburst": 0, "flash_flood": 0}
    n_batches = 0

    for X, y, terrain in loader:
        X, y, terrain = X.to(device), y.to(device), terrain.to(device)
        preds = model(X, terrain)
        loss, losses = criterion(preds, y)
        total_loss += loss.item()
        for k, v in losses.items():
            all_losses[k] += v
        n_batches += 1

    n = max(n_batches, 1)
    return total_loss / n, {k: v / n for k, v in all_losses.items()}


def train_model(train_dataset, val_dataset, device="cpu"):
    """Full training pipeline."""
    print(f"Training on {device}")

    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True, drop_last=True)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False)

    model = SevereWeatherNet().to(device)
    optimizer = torch.optim.Adam(model.parameters(), lr=LEARNING_RATE, weight_decay=WEIGHT_DECAY)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=NUM_EPOCHS)
    criterion = MultiTaskLoss()

    best_val_loss = float("inf")
    patience_counter = 0
    history = []

    for epoch in range(1, NUM_EPOCHS + 1):
        t0 = time.time()
        train_loss = train_epoch(model, train_loader, optimizer, criterion, device)
        val_loss, val_losses = validate(model, val_loader, criterion, device)
        scheduler.step()
        elapsed = time.time() - t0

        record = {
            "epoch": epoch, "train_loss": train_loss,
            "val_loss": val_loss, "val_losses": val_losses,
            "lr": optimizer.param_groups[0]["lr"], "time": elapsed,
        }
        history.append(record)

        print(f"Epoch {epoch:3d}/{NUM_EPOCHS} | "
              f"Train: {train_loss:.4f} | Val: {val_loss:.4f} | "
              f"TS: {val_losses['thunderstorm']:.4f} CB: {val_losses['cloudburst']:.4f} "
              f"FF: {val_losses['flash_flood']:.4f} | {elapsed:.1f}s")

        # Checkpointing
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            patience_counter = 0
            torch.save(model.state_dict(), MODEL_DIR / "best_model.pth")
            print(f"  ✓ Saved best model (val_loss={val_loss:.4f})")
        else:
            patience_counter += 1

        if patience_counter >= EARLY_STOP_PATIENCE:
            print(f"Early stopping at epoch {epoch}")
            break

    # Save training history
    with open(MODEL_DIR / "training_history.json", "w") as f:
        json.dump(history, f, indent=2)

    # Load best model
    model.load_state_dict(torch.load(MODEL_DIR / "best_model.pth", weights_only=True))
    return model, history
