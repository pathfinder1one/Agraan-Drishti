import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

import xarray as xr
import torch
import numpy as np
import os
import pandas as pd

from config import GRID_SIZE, NUM_FEATURES
from data.labels import get_event_by_id, HISTORICAL_EVENTS, latlon_to_grid
from data.loader import load_full_dataset, load_atmospheric_variable, load_surface_variable, load_constants
from data.features import compute_all_features, normalize_features

# The events in the UI
EVENT_IDS = ["evt_001", "evt_002", "evt_003", "evt_004", "evt_007", "evt_009", "evt_015", "evt_016"]

def extract_6h_slice(ds_features: xr.Dataset, event_date_str: str, center_lat: float, center_lon: float):
    event_time = pd.to_datetime(event_date_str) + pd.Timedelta(hours=12)
    
    try:
        ds_time = ds_features.sel(time=slice(event_time - pd.Timedelta(days=2), event_time + pd.Timedelta(days=1)))
        if len(ds_time.time) < 6:
             ds_time = ds_features.isel(time=slice(0, 6)) # Fallback
        else:
             ds_time = ds_time.isel(time=slice(0, 6))
    except Exception as e:
        print(f"Time slice error: {e}")
        ds_time = ds_features.isel(time=slice(0, 6))

    lats = ds_features.latitude.values
    lons = ds_features.longitude.values
    
    lat_idx = np.abs(lats - center_lat).argmin()
    lon_idx = np.abs(lons - center_lon).argmin()
    
    half_grid = GRID_SIZE // 2
    
    lat_start = max(0, lat_idx - half_grid)
    lat_end = lat_start + GRID_SIZE
    if lat_end > len(lats):
        lat_end = len(lats)
        lat_start = lat_end - GRID_SIZE
        
    lon_start = max(0, lon_idx - half_grid)
    lon_end = lon_start + GRID_SIZE
    if lon_end > len(lons):
        lon_end = len(lons)
        lon_start = lon_end - GRID_SIZE
        
    ds_spatial = ds_time.isel(latitude=slice(lat_start, lat_end), longitude=slice(lon_start, lon_end))
    
    feature_names = ["cape", "cin", "iwv", "iwv_rate", "convergence", "wind_shear", "mslp_gradient", "precip", "t2m_anomaly", "rh_column"]
    
    tensor_list = []
    for t in range(6):
        time_slice = []
        for feat in feature_names:
            if feat in ds_spatial:
                val = ds_spatial[feat].isel(time=t).values
            else:
                val = np.zeros((GRID_SIZE, GRID_SIZE))
            
            if val.shape != (GRID_SIZE, GRID_SIZE):
                padded = np.zeros((GRID_SIZE, GRID_SIZE))
                h = min(val.shape[0], GRID_SIZE)
                w = min(val.shape[1], GRID_SIZE)
                padded[:h, :w] = val[:h, :w]
                val = padded
            time_slice.append(val)
        tensor_list.append(np.stack(time_slice, axis=0))
        
    return torch.tensor(np.stack(tensor_list, axis=0), dtype=torch.float32)

def slice_raw_data(data_dict, event_date_str, center_lat, center_lon):
    event_time = pd.to_datetime(event_date_str) + pd.Timedelta(hours=12)
    time_slice = slice(event_time - pd.Timedelta(days=1), event_time + pd.Timedelta(days=1))
    
    # We need a reference for lat/lon indices
    ref_da = data_dict["terrain"]
    lats = ref_da.latitude.values
    lons = ref_da.longitude.values
    
    lat_idx = np.abs(lats - center_lat).argmin()
    lon_idx = np.abs(lons - center_lon).argmin()
    
    half_grid = GRID_SIZE // 2
    lat_start = max(0, lat_idx - half_grid)
    lon_start = max(0, lon_idx - half_grid)
    
    sliced_data = {"atmospheric": {}, "surface": {}}
    for k, da in data_dict["atmospheric"].items():
        try:
             sliced_data["atmospheric"][k] = da.sel(time=time_slice).isel(latitude=slice(lat_start, lat_start+GRID_SIZE), longitude=slice(lon_start, lon_start+GRID_SIZE)).compute()
        except:
             pass
    for k, da in data_dict["surface"].items():
        try:
             sliced_data["surface"][k] = da.sel(time=time_slice).isel(latitude=slice(lat_start, lat_start+GRID_SIZE), longitude=slice(lon_start, lon_start+GRID_SIZE)).compute()
        except:
             pass
             
    sliced_data["terrain"] = data_dict["terrain"].isel(latitude=slice(lat_start, lat_start+GRID_SIZE), longitude=slice(lon_start, lon_start+GRID_SIZE)).compute()
    sliced_data["land_mask"] = data_dict["land_mask"].isel(latitude=slice(lat_start, lat_start+GRID_SIZE), longitude=slice(lon_start, lon_start+GRID_SIZE)).compute()
    
    return sliced_data

def main():
    out_dir = Path("backend/api/events")
    out_dir.mkdir(parents=True, exist_ok=True)
    
    for eid in EVENT_IDS:
        event = get_event_by_id(eid)
        if not event:
            print(f"Skipping {eid}, not found in labels.py")
            continue
            
        print(f"Processing {event.event_id}: {event.description} ({event.date})")
        year = int(event.date.split('-')[0])
        
        try:
            print("Loading dataset...")
            data_dict = load_full_dataset(years=[year])
            
            print("Slicing 32x32 area and time window...")
            sliced_dict = slice_raw_data(data_dict, event.date, event.lat, event.lon)
            
            print("Computing features on sliced data...")
            features_ds = compute_all_features(sliced_dict)
            
            print("Normalizing...")
            normed_ds, _ = normalize_features(features_ds)
            
            print("Extracting final tensor...")
            tensor = extract_6h_slice(normed_ds, event.date, event.lat, event.lon)
            
            batch = tensor.unsqueeze(0).repeat(7, 1, 1, 1, 1)
            
            out_path = out_dir / f"{eid}.pt"
            torch.save(batch, out_path)
            print(f"Saved {out_path} with shape {batch.shape}")
            
        except Exception as e:
            print(f"Failed to process {eid}: {e}")

if __name__ == "__main__":
    main()
