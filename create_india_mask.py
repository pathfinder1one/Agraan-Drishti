import torch
import numpy as np
from matplotlib.path import Path
import os

# Create a polygonal mask for India to strictly bound the heatmap
INDIA_POLYGON = [
    (37.0, 74.5), (35.0, 77.0), (33.0, 79.0), (30.0, 81.0),
    (28.0, 88.0), (29.0, 95.0), (27.0, 97.0), (24.0, 94.0),
    (22.0, 92.0), (21.0, 89.0), (19.0, 85.0), (16.0, 82.0),
    (13.0, 80.0), (10.0, 79.5), (8.0, 77.5), (9.0, 76.0),
    (11.0, 75.0), (15.0, 73.0), (19.0, 72.5), (21.0, 70.0),
    (23.0, 68.0), (24.5, 68.0), (27.0, 70.5), (29.0, 72.5),
    (31.0, 74.0), (34.0, 74.0), (37.0, 74.5)
]

def create_mask():
    india_path = Path([(lon, lat) for lat, lon in INDIA_POLYGON]) # Path takes (x, y) = (lon, lat)
    
    LAT_MIN, LON_MIN = 5.04, 65.04
    GRID_RESOLUTION = 0.108
    
    lats = np.linspace(LAT_MIN, LAT_MIN + 309 * GRID_RESOLUTION, 310)
    lons = np.linspace(LON_MIN, LON_MIN + 309 * GRID_RESOLUTION, 310)
    
    lon_grid, lat_grid = np.meshgrid(lons, lats)
    points = np.column_stack((lon_grid.ravel(), lat_grid.ravel()))
    
    mask = india_path.contains_points(points)
    mask = torch.tensor(mask.reshape(310, 310), dtype=torch.float32)
    
    # Smooth the mask slightly using a small kernel to avoid aliased sharp edges
    import torch.nn.functional as F
    mask = mask.view(1, 1, 310, 310)
    kernel = torch.ones(1, 1, 5, 5) / 25.0
    mask = F.conv2d(mask, kernel, padding=2)
    
    torch.save(mask.squeeze(), "backend/api/india_mask.pt")
    print("Mask saved!")

if __name__ == "__main__":
    create_mask()
