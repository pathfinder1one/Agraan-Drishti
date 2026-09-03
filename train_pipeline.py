"""
Training Pipeline for Severe Weather Net.
Loads the pre-mined 20,000 samples and trains the model via FP16.
"""
import sys
import torch
from torch.utils.data import TensorDataset, DataLoader
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from config import DATA_DIR, BATCH_SIZE
from backend.model.train import train_model

def main():
    print("Loading pre-mined 20,000 samples...")
    out_dir = DATA_DIR / "mined_tensors"
    
    if not (out_dir / "X_train.pt").exists():
        print("Error: Tensors not found! Run precompute_dataset.py first!")
        return
        
    X_train = torch.load(out_dir / "X_train.pt", weights_only=True).float()
    X_train = torch.nan_to_num(X_train, nan=0.0, posinf=0.0, neginf=0.0).clamp(-10.0, 10.0)
    
    y_train = torch.load(out_dir / "y_train.pt", weights_only=True).float()
    y_train = torch.nan_to_num(y_train, nan=0.0, posinf=1.0, neginf=0.0).clamp(0.0, 1.0)
    terrain_train = torch.load(out_dir / "terrain_train.pt", weights_only=True).float()
    terrain_train = torch.nan_to_num(terrain_train, nan=0.0, posinf=0.0, neginf=0.0)
    
    print(f"Loaded successfully! X shape: {X_train.shape}")
    print(f"Disaster ratio in Y: {(y_train[:, 0].sum() > 0).sum().item()} disasters.")
    
    # Validation split (80-20)
    total_samples = len(X_train)
    val_size = int(total_samples * 0.2)
    train_size = total_samples - val_size
    
    dataset = TensorDataset(X_train, y_train, terrain_train)
    train_ds, val_ds = torch.utils.data.random_split(dataset, [train_size, val_size])
    
    # 0 workers is MANDATORY for Windows laptops to prevent OS crashing/freezing
    train_loader = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True, drop_last=True, num_workers=0, pin_memory=False)
    val_loader = DataLoader(val_ds, batch_size=BATCH_SIZE, shuffle=False, drop_last=True, num_workers=0, pin_memory=False)
    
    device = "cuda" if torch.cuda.is_available() else "cpu"
    
    print("\n======================================")
    print("Starting Lightning-Fast FP16 Training")
    print("======================================")
    
    train_model(train_loader, val_loader, device=device)

if __name__ == "__main__":
    main()
