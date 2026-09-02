import urllib.request
import json
import torch
import numpy as np
from matplotlib.path import Path

url = "https://raw.githubusercontent.com/datameet/maps/master/Country/india-composite.geojson"
try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
    
    polygons = []
    for feature in data['features']:
        geom = feature['geometry']
        if geom['type'] == 'Polygon':
            polygons.append(geom['coordinates'][0])
        elif geom['type'] == 'MultiPolygon':
            for poly in geom['coordinates']:
                polygons.append(poly[0])
                
    paths = [Path(poly) for poly in polygons]
    
    LAT_MIN, LON_MIN = 5.04, 65.04
    GRID_RESOLUTION = 0.108
    
    lats = np.linspace(LAT_MIN, LAT_MIN + 309 * GRID_RESOLUTION, 310)
    lons = np.linspace(LON_MIN, LON_MIN + 309 * GRID_RESOLUTION, 310)
    lon_grid, lat_grid = np.meshgrid(lons, lats)
    points = np.column_stack((lon_grid.ravel(), lat_grid.ravel()))
    
    mask = np.zeros(310 * 310, dtype=bool)
    for p in paths:
        mask |= p.contains_points(points)
        
    mask = torch.tensor(mask.reshape(310, 310), dtype=torch.float32)
    torch.save(mask, "backend/api/india_mask.pt")
    print("Mask created successfully!")
except Exception as e:
    print("Failed:", e)
