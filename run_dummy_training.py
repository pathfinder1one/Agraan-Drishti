import torch
from torch.utils.data import DataLoader, TensorDataset
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent))

from backend.model.network import SevereWeatherNet
from backend.model.train import train_epoch, validate, MultiTaskLoss, MODEL_DIR
import torch.optim as optim
import json
import time

def generate_dummy_dataloader(num_samples=100, batch_size=8):
    """Generate dummy data of shape (B, T, C, H, W) for training simulation."""
    X = torch.randn(num_samples, 6, 10, 32, 32)
    # y shape: (B, 3, H, W) -> 3 classes: thunderstorm, cloudburst, flash_flood
    y = torch.rand(num_samples, 3, 32, 32) 
    # terrain shape: (B, 1, 32, 32)
    terrain = torch.rand(num_samples, 1, 32, 32)
    
    dataset = TensorDataset(X, y, terrain)
    return DataLoader(dataset, batch_size=batch_size, shuffle=True)

if __name__ == "__main__":
    print("Initializing SevereWeatherNet Architecture...")
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = SevereWeatherNet().to(device)
    
    print("Generating synthetic meteorological tensor dataset (10 channels)...")
    train_loader = generate_dummy_dataloader(num_samples=80)
    val_loader = generate_dummy_dataloader(num_samples=20)
    
    optimizer = optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-4)
    criterion = MultiTaskLoss()
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=10)
    
    MODEL_DIR.mkdir(exist_ok=True)
    best_val_loss = float("inf")
    history = []
    
    print("\nStarting Training Loop on CPU/GPU (Simulation)...\n")
    
    for epoch in range(1, 11):
        t0 = time.time()
        
        # Train
        model.train()
        train_loss = 0
        for X, y, terrain in train_loader:
            X, y, terrain = X.to(device), y.to(device), terrain.to(device)
            optimizer.zero_grad()
            preds = model(X, terrain)
            loss, _ = criterion(preds, y)
            loss.backward()
            optimizer.step()
            train_loss += loss.item()
        train_loss /= len(train_loader)
        
        # Validate
        val_loss, val_losses = validate(model, val_loader, criterion, device)
        scheduler.step()
        elapsed = time.time() - t0
        
        print(f"Epoch {epoch:2d}/10 | Train: {train_loss:.4f} | Val: {val_loss:.4f} | "
              f"TS: {val_losses['thunderstorm']:.4f} CB: {val_losses['cloudburst']:.4f} "
              f"FF: {val_losses['flash_flood']:.4f} | {elapsed:.1f}s")
        
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            torch.save(model.state_dict(), MODEL_DIR / "best_model.pth")
            print(f"  [+] Saved checkpoint -> best_model.pth")
            
    print("\nTraining Complete! Checkpoints saved to /checkpoints/best_model.pth")
