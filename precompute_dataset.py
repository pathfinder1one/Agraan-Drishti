"""
Master script to automatically mine 20,000 high-quality samples from the 30-year dataset.
Extracts 4,000 Disaster patches and 16,000 Normal patches.
Saves them as ready-to-train PyTorch tensors to prevent RAM crashes during training.
"""
import sys
import os
import torch
import numpy as np
import xarray as xr
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from config import GRID_SIZE, SEQ_LEN, FEATURE_CHANNELS, YEAR_START, YEAR_END, DATA_DIR
from data.loader import load_full_dataset
from data.features import compute_all_features, normalize_features

def main():
    print("Starting Automatic Disaster Mining (4000 Disasters / 16000 Normal)...")
    
    out_dir = DATA_DIR / "mined_tensors"
    out_dir.mkdir(exist_ok=True)
    
    # We will mine a proportionate amount of samples from each year
    years = list(range(YEAR_START, YEAR_END + 1))
    disasters_per_year = 4000 // len(years) # ~129
    normal_per_year = 16000 // len(years)   # ~516
    
    all_X = []
    all_y = []
    all_terrain = []
    
    total_disasters_found = 0
    total_normals_found = 0
    
    for year in years:
        print(f"\n======================================")
        print(f"Mining Year: {year}")
        print(f"======================================")
        
        try:
            # 1. Load Raw Data
            print("  Loading Raw NetCDF files...")
            data_dict = load_full_dataset(years=[year])
            
            # Slice surface variables to exactly the current year
            time_slice = slice(f"{year}-01-01", f"{year}-12-31")
            for k in data_dict["surface"]:
                data_dict["surface"][k] = data_dict["surface"][k].sel(time=time_slice)
                
            # 2. Compute the 10 Advanced Features
            print("  Computing CAPE, CIN, Wind Shear, etc...")
            features_ds = compute_all_features(data_dict)
            
            # 3. Normalize Features
            print("  Loading features into RAM (computing Dask graphs)...")
            features_ds = features_ds.compute()
            print("  Normalizing Features...")
            normed_ds, _ = normalize_features(features_ds)
            
            # Convert to numpy for ultra-fast slicing
            apcp = data_dict["surface"]["APCP"].values # Raw precipitation for targeting
            terrain = data_dict["terrain"].values
            
            # Build feature array of shape (T, C, H, W)
            T, H, W = apcp.shape
            C = len(FEATURE_CHANNELS)
            feat_arr = np.zeros((T, C, H, W), dtype=np.float32)
            for i, ch in enumerate(FEATURE_CHANNELS):
                if ch in normed_ds:
                    # Universally guarantee correct dimension order
                    val = normed_ds[ch].transpose("time", "latitude", "longitude").values
                    feat_arr[:, i, :, :] = val
                else:
                    print(f"  Warning: Missing feature {ch}")
                    
            print("  Searching for Disasters...")
            # Frame-level disaster logic: Does this frame have extreme rainfall anywhere on the 32x32 map?
            # Max precipitation per frame
            frame_max_apcp = apcp.max(axis=(1, 2))
            
            # Threshold based on non-zero frame maximums
            threshold = np.percentile(frame_max_apcp[frame_max_apcp > 0], 95)
            
            disaster_candidates = np.argwhere(frame_max_apcp > threshold).flatten()
            np.random.seed(year)
            np.random.shuffle(disaster_candidates)
            
            disasters_mined = 0
            normals_mined = 0
            
            # Extract Disasters
            for t in disaster_candidates:
                if disasters_mined >= disasters_per_year:
                    break
                if t < SEQ_LEN: continue
                
                # Extract sequence for the whole map
                X_patch = feat_arr[t - SEQ_LEN:t, :, :, :].astype(np.float32)
                
                # Target Labels
                target_precip = apcp[t, :, :]
                y_cb = (target_precip > threshold)
                y_ts = (target_precip > threshold * 0.7)
                y_ff = (target_precip > threshold * 1.5)
                y_patch = np.stack([y_ts, y_cb, y_ff], axis=0).astype(np.uint8)
                
                terr_patch = terrain[np.newaxis, ...].astype(np.float32)
                
                all_X.append(X_patch)
                all_y.append(y_patch)
                all_terrain.append(terr_patch)
                disasters_mined += 1
                
            # Extract Normals (Random frames that are NOT disasters)
            all_frames = np.arange(len(frame_max_apcp))
            normal_candidates = np.setdiff1d(all_frames, disaster_candidates)
            np.random.shuffle(normal_candidates)
            
            for t in normal_candidates:
                if normals_mined >= normal_per_year:
                    break
                if t < SEQ_LEN: continue
                
                X_patch = feat_arr[t - SEQ_LEN:t, :, :, :].astype(np.float32)
                y_patch = np.zeros((3, H, W), dtype=np.float32).astype(np.uint8)
                terr_patch = terrain[np.newaxis, ...].astype(np.float32)
                
                all_X.append(X_patch)
                all_y.append(y_patch)
                all_terrain.append(terr_patch)
                normals_mined += 1
                
            print(f"  [OK] Extracted {disasters_mined} Disasters, {normals_mined} Normals.")
            total_disasters_found += disasters_mined
            total_normals_found += normals_mined
            
        except Exception as e:
            print(f"  Failed for year {year}: {e}")
            
    print(f"\n======================================")
    print(f"Mining Complete!")
    print(f"Total Disasters: {total_disasters_found}")
    print(f"Total Normals: {total_normals_found}")
    print(f"Total Samples: {len(all_X)}")
    
    # Save giant tensors
    print("Saving to PyTorch Tensors (compressed datatypes)...")
    torch.save(torch.tensor(np.stack(all_X)), out_dir / "X_train.pt")
    torch.save(torch.tensor(np.stack(all_y)), out_dir / "y_train.pt")
    torch.save(torch.tensor(np.stack(all_terrain)), out_dir / "terrain_train.pt")
    
    print(f"Saved successfully to {out_dir}/!")
    print("You can now run train_pipeline.py!")

if __name__ == "__main__":
    main()
