"""
PyTorch Dataset for severe weather prediction.
Creates (X, y, terrain) samples for multi-task ConvLSTM training.
"""
import numpy as np
import torch
from torch.utils.data import Dataset
from typing import List, Optional, Tuple
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
from config import SEQ_LEN, GRID_SIZE, NUM_FEATURES, FEATURE_CHANNELS, TIMESTEP_HOURS
from data.labels import WeatherEvent, create_multi_label_grids


class SevereWeatherDataset(Dataset):
    """
    Dataset for severe weather nowcasting.

    Each sample:
      X:       (SEQ_LEN, NUM_FEATURES, GRID_SIZE, GRID_SIZE) — 6 timesteps × 10 channels
      y:       (3, GRID_SIZE, GRID_SIZE) — thunderstorm, cloudburst, flash_flood labels
      terrain: (1, GRID_SIZE, GRID_SIZE) — static DEM
    """

    def __init__(
        self,
        feature_data: np.ndarray,   # (total_time, num_features, H, W)
        terrain: np.ndarray,        # (H, W)
        events: List[WeatherEvent],
        time_index: np.ndarray,     # datetime64 array
        augment: bool = False,
        negative_ratio: float = 2.0,  # negative samples per positive
    ):
        super().__init__()
        self.feature_data = feature_data
        self.terrain = terrain[np.newaxis, :, :]  # (1, H, W)
        self.events = events
        self.time_index = time_index
        self.augment = augment
        self.samples = self._build_samples(negative_ratio)

    def _find_time_index(self, date_str: str) -> Optional[int]:
        """Find the closest time index for a given date."""
        target = np.datetime64(date_str)
        diffs = np.abs(self.time_index - target)
        min_idx = int(np.argmin(diffs))
        # Check if the closest match is within 1 day
        if diffs[min_idx] > np.timedelta64(1, 'D'):
            return None
        return min_idx

    def _build_samples(self, negative_ratio: float) -> List[dict]:
        """Build list of (start_idx, labels) for positive and negative samples."""
        samples = []

        # Positive samples: centered around each event
        for event in self.events:
            t_idx = self._find_time_index(event.date)
            if t_idx is None:
                continue
            # We need SEQ_LEN timesteps before the event as input
            start = t_idx - SEQ_LEN
            if start < 0:
                continue
            labels = create_multi_label_grids(event)
            samples.append({
                "start_idx": start,
                "labels": labels,
                "event": event,
                "is_positive": True,
            })

        # Negative samples: random non-event windows
        n_neg = int(len(samples) * negative_ratio)
        np.random.seed(42)
        total_t = len(self.time_index)
        positive_times = {s["start_idx"] for s in samples}

        for _ in range(n_neg):
            for attempt in range(100):
                idx = np.random.randint(SEQ_LEN, total_t - 1)
                if idx not in positive_times:
                    break
            labels = {t: np.zeros((GRID_SIZE, GRID_SIZE), dtype=np.float32)
                      for t in ["thunderstorm", "cloudburst", "flash_flood"]}
            samples.append({
                "start_idx": idx - SEQ_LEN,
                "labels": labels,
                "event": None,
                "is_positive": False,
            })

        return samples

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        sample = self.samples[idx]
        start = sample["start_idx"]

        # Input: (SEQ_LEN, C, H, W)
        X = self.feature_data[start:start + SEQ_LEN].copy()

        # Labels: (3, H, W)
        y = np.stack([
            sample["labels"]["thunderstorm"],
            sample["labels"]["cloudburst"],
            sample["labels"]["flash_flood"],
        ], axis=0)

        # Data augmentation
        if self.augment:
            X, y = self._augment(X, y)

        X = torch.from_numpy(X).float()
        y = torch.from_numpy(y).float()
        terrain = torch.from_numpy(self.terrain.copy()).float()

        return X, y, terrain

    def _augment(self, X, y):
        """Simple augmentation: random flips."""
        if np.random.random() > 0.5:
            X = X[:, :, ::-1, :].copy()  # Flip lat
            y = y[:, ::-1, :].copy()
        if np.random.random() > 0.5:
            X = X[:, :, :, ::-1].copy()  # Flip lon
            y = y[:, :, ::-1].copy()
        return X, y


def create_datasets(
    feature_data: np.ndarray,
    terrain: np.ndarray,
    time_index: np.ndarray,
    train_events: List[WeatherEvent],
    val_events: List[WeatherEvent],
) -> Tuple[SevereWeatherDataset, SevereWeatherDataset]:
    """Create train and validation datasets."""
    train_ds = SevereWeatherDataset(
        feature_data, terrain, train_events, time_index, augment=True
    )
    val_ds = SevereWeatherDataset(
        feature_data, terrain, val_events, time_index, augment=False
    )
    print(f"Train: {len(train_ds)} samples ({sum(1 for s in train_ds.samples if s['is_positive'])} positive)")
    print(f"Val:   {len(val_ds)} samples ({sum(1 for s in val_ds.samples if s['is_positive'])} positive)")
    return train_ds, val_ds
