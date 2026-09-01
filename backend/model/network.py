"""
Multi-task severe weather prediction network.
ConvLSTM backbone → Attention → 3 output heads (thunderstorm, cloudburst, flash-flood).
"""
import torch
import torch.nn as nn
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))
from config import NUM_FEATURES, HIDDEN_DIM, NUM_CONVLSTM_LAYERS, ATTENTION_HEADS, KERNEL_SIZE
from backend.model.convlstm import ConvLSTM
from backend.model.attention import SpatialAttention, ChannelAttention


class PredictionHead(nn.Module):
    """Single event-type prediction head: Conv → BN → ReLU → Conv → Sigmoid."""

    def __init__(self, in_channels, mid_channels=32):
        super().__init__()
        self.net = nn.Sequential(
            nn.Conv2d(in_channels, mid_channels, 3, padding=1),
            nn.BatchNorm2d(mid_channels),
            nn.ReLU(),
            nn.Conv2d(mid_channels, 1, 1),
            nn.Sigmoid(),
        )

    def forward(self, x):
        return self.net(x).squeeze(1)  # (B, H, W)


class SevereWeatherNet(nn.Module):
    """
    Full multi-task network:
      Input (B, T, C, H, W)
        → ConvLSTM backbone (shared)
        → Spatial + Channel Attention
        → Thunderstorm head → (B, H, W) prob map
        → Cloudburst head   → (B, H, W) prob map
        → Flash-flood head  → (B, H, W) prob map (uses cloudburst output + DEM)
    """

    def __init__(
        self,
        input_channels=NUM_FEATURES,
        hidden_dim=HIDDEN_DIM,
        num_layers=NUM_CONVLSTM_LAYERS,
        attention_heads=ATTENTION_HEADS,
        kernel_size=KERNEL_SIZE,
    ):
        super().__init__()

        # Shared backbone
        self.convlstm = ConvLSTM(input_channels, hidden_dim, num_layers, kernel_size)

        # Attention layers
        self.spatial_attn = SpatialAttention(hidden_dim, attention_heads)
        self.channel_attn = ChannelAttention(hidden_dim)

        # Event-specific heads
        self.thunderstorm_head = PredictionHead(hidden_dim)
        self.cloudburst_head = PredictionHead(hidden_dim)
        # Flash-flood head takes: backbone features + cloudburst probability + DEM = hidden_dim + 2
        self.flashflood_head = PredictionHead(hidden_dim + 2)

    def forward(self, x, terrain):
        """
        Args:
            x: (B, T, C, H, W) — feature tensor
            terrain: (B, 1, H, W) — DEM/terrain height

        Returns:
            dict with 'thunderstorm', 'cloudburst', 'flash_flood' probability maps (B, H, W)
        """
        # Shared backbone
        h, _ = self.convlstm(x)  # h: (B, hidden, H, W)

        # Attention fusion
        h = self.spatial_attn(h)
        h = self.channel_attn(h)

        # Thunderstorm prediction
        ts_prob = self.thunderstorm_head(h)

        # Cloudburst prediction
        cb_prob = self.cloudburst_head(h)

        # Flash-flood prediction (conditioned on cloudburst + terrain)
        ff_input = torch.cat([
            h,
            cb_prob.unsqueeze(1),   # (B, 1, H, W)
            terrain,                # (B, 1, H, W)
        ], dim=1)
        ff_prob = self.flashflood_head(ff_input)

        return {
            "thunderstorm": ts_prob,
            "cloudburst": cb_prob,
            "flash_flood": ff_prob,
        }


def count_parameters(model):
    return sum(p.numel() for p in model.parameters() if p.requires_grad)


if __name__ == "__main__":
    model = SevereWeatherNet()
    print(f"Parameters: {count_parameters(model):,}")

    # Test forward pass
    B, T, C, H, W = 2, 6, NUM_FEATURES, 32, 32
    x = torch.randn(B, T, C, H, W)
    terrain = torch.randn(B, 1, H, W)
    out = model(x, terrain)
    for k, v in out.items():
        print(f"  {k}: {v.shape}")
