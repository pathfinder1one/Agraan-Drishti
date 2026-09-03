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
from contextlib import nullcontext

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
        
        # Disable autocast and cast to float32 to safely use BCELoss
        with torch.amp.autocast(device_type="cuda" if "cuda" in str(targets.device) else "cpu", enabled=False):
            for i, (event_type, weight) in enumerate(self.weights.items()):
                # Cast predictions and targets to float32 specifically for BCELoss
                pred = predictions[event_type].to(torch.float32)
                target = targets[:, i].to(torch.float32)
                
                if not torch.isfinite(pred).all():
                    raise FloatingPointError(f"Non-finite {event_type} prediction before loss calculation")
                if not torch.isfinite(target).all():
                    raise FloatingPointError(f"Non-finite {event_type} target before loss calculation")
                pred = torch.clamp(pred, min=0.0, max=1.0)
                
                l = self.bce(pred, target) * weight
                losses[event_type] = l.item()
                loss += l
                
        return loss, losses


def train_epoch(model, loader, optimizer, criterion, device, scaler):
    model.train()
    total_loss = 0
    n_batches = 0

    for X, y, terrain in loader:
        X, y, terrain = X.to(device), y.to(device), terrain.to(device)
        optimizer.zero_grad()
        
        use_amp = str(device).startswith("cuda")
        # Mixed precision is useful on CUDA, but CPU autocast can introduce
        # avoidable numerical differences in this ConvLSTM pipeline.
        amp_context = torch.amp.autocast(device_type="cuda") if use_amp else nullcontext()
        with amp_context:
            preds = model(X, terrain)
            loss, _ = criterion(preds, y)

        if not torch.isfinite(loss):
            raise FloatingPointError("Non-finite training loss; refusing to update the model")
        
        # Scaled Backward Pass
        scaler.scale(loss).backward()
        
        # Unscale gradients before clipping
        scaler.unscale_(optimizer)
        torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
        
        # Step optimizer and update scaler
        scaler.step(optimizer)
        scaler.update()
        
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
        
        use_amp = str(device).startswith("cuda")
        amp_context = torch.amp.autocast(device_type="cuda") if use_amp else nullcontext()
        with amp_context:
            preds = model(X, terrain)
            loss, losses = criterion(preds, y)
            
        total_loss += loss.item()
        for k, v in losses.items():
            all_losses[k] += v
        n_batches += 1

    n = max(n_batches, 1)
    return total_loss / n, {k: v / n for k, v in all_losses.items()}


def train_model(train_loader, val_loader, device="cpu"):
    """Full training pipeline."""
    print(f"Training on {device}")

    model = SevereWeatherNet().to(device)
    optimizer = torch.optim.Adam(model.parameters(), lr=LEARNING_RATE, weight_decay=WEIGHT_DECAY)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=NUM_EPOCHS)
    criterion = MultiTaskLoss()
    
    # Initialize Gradient Scaler for FP16
    scaler = torch.amp.GradScaler(enabled=("cuda" in str(device)))

    best_val_loss = float("inf")
    patience_counter = 0
    history = []

    for epoch in range(1, NUM_EPOCHS + 1):
        t0 = time.time()
        train_loss = train_epoch(model, train_loader, optimizer, criterion, device, scaler)
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
        state_is_finite = all(torch.isfinite(value).all().item() for value in model.state_dict().values() if torch.is_tensor(value))
        if not state_is_finite:
            raise FloatingPointError("Non-finite model state; refusing to save checkpoint")

        if val_loss < best_val_loss:
            best_val_loss = val_loss
            patience_counter = 0
            torch.save(model.state_dict(), MODEL_DIR / "best_model.pth")
            print(f"  [OK] Saved best model (val_loss={val_loss:.4f})")
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

if __name__ == "__main__":
    from backend.model.dataset import get_balanced_dataloader
    from config import PROJECT_ROOT
    
    device = "cuda" if torch.cuda.is_available() else "cpu"
    nc_file = str(PROJECT_ROOT / "dataset_weather" / "IMDAA_merged_1.08_1990_2020.nc")
    
    print("Initializing Balanced DataLoader (1:4 Ratio)...")
    train_dataset, train_loader = get_balanced_dataloader(nc_file, is_train=True)
    val_dataset, val_loader = get_balanced_dataloader(nc_file, is_train=False) # Simplified for demo
    
    print("Starting Training Process...")
    train_model(train_loader, val_loader, device=device)
    print("Training Complete! Models saved in checkpoints/")
