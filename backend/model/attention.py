"""
Spatial self-attention layer for cross-channel feature fusion.
Attends across moisture/instability/lift feature groups.
"""
import torch
import torch.nn as nn
import torch.nn.functional as F


class SpatialAttention(nn.Module):
    """Multi-head spatial attention on ConvLSTM output."""

    def __init__(self, channels, num_heads=4):
        super().__init__()
        self.num_heads = num_heads
        self.head_dim = channels // num_heads
        assert channels % num_heads == 0

        self.q_proj = nn.Conv2d(channels, channels, 1)
        self.k_proj = nn.Conv2d(channels, channels, 1)
        self.v_proj = nn.Conv2d(channels, channels, 1)
        self.out_proj = nn.Conv2d(channels, channels, 1)
        self.norm = nn.LayerNorm([channels])
        self.scale = self.head_dim ** -0.5

    def forward(self, x):
        """
        Args:
            x: (batch, channels, H, W)
        Returns:
            attended: (batch, channels, H, W)
        """
        B, C, H, W = x.shape

        q = self.q_proj(x).reshape(B, self.num_heads, self.head_dim, H * W)
        k = self.k_proj(x).reshape(B, self.num_heads, self.head_dim, H * W)
        v = self.v_proj(x).reshape(B, self.num_heads, self.head_dim, H * W)

        # Attention: (B, heads, HW, HW)
        attn = torch.matmul(q.transpose(-2, -1), k) * self.scale
        attn = F.softmax(attn, dim=-1)

        # Apply attention to values
        out = torch.matmul(v, attn.transpose(-2, -1))  # (B, heads, head_dim, HW)
        out = out.reshape(B, C, H, W)
        out = self.out_proj(out)

        # Residual connection
        return x + out


class ChannelAttention(nn.Module):
    """Channel attention (squeeze-excitation style) for feature weighting."""

    def __init__(self, channels, reduction=4):
        super().__init__()
        self.fc = nn.Sequential(
            nn.AdaptiveAvgPool2d(1),
            nn.Flatten(),
            nn.Linear(channels, channels // reduction),
            nn.ReLU(),
            nn.Linear(channels // reduction, channels),
            nn.Sigmoid(),
        )

    def forward(self, x):
        B, C, H, W = x.shape
        w = self.fc(x).view(B, C, 1, 1)
        return x * w
