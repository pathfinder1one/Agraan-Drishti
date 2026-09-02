"""
Spatial self-attention layer for cross-channel feature fusion.
Attends across moisture/instability/lift feature groups.
"""
import torch
import torch.nn as nn
import torch.nn.functional as F


class SpatialAttention(nn.Module):
    """Spatial attention (CBAM style) using pooling + Conv, avoids O(N^2) memory explosion."""

    def __init__(self, channels, num_heads=None):
        super().__init__()
        # CBAM spatial attention combines avg and max pooling across channels
        # followed by a 7x7 convolution to create a 1-channel spatial attention mask.
        self.conv = nn.Conv2d(2, 1, kernel_size=7, padding=3)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        """
        Args:
            x: (batch, channels, H, W)
        Returns:
            attended: (batch, channels, H, W)
        """
        # Channel-wise max and avg pooling: (B, 1, H, W)
        avg_out = torch.mean(x, dim=1, keepdim=True)
        max_out, _ = torch.max(x, dim=1, keepdim=True)
        
        # Concatenate along channel dimension: (B, 2, H, W)
        scale = torch.cat([avg_out, max_out], dim=1)
        
        # Convolve to (B, 1, H, W) and apply sigmoid
        scale = self.sigmoid(self.conv(scale))
        
        # Apply spatial mask to original features
        return x * scale


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
