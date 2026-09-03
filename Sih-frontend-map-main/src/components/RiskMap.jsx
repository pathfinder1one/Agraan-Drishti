import { useEffect, useRef, useState } from "react";

import {
  MapContainer,
  TileLayer,
  GeoJSON,
  CircleMarker,
  Circle,
  Popup,
  Tooltip,
  useMap,
} from "react-leaflet";

import L from "leaflet";

import "leaflet/dist/leaflet.css";
import "leaflet.heat";

import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point } from "@turf/helpers";

// =====================================================
// IMPORTANT LOCATIONS
// HAZARD-SPECIFIC DEMO RISK
// =====================================================

const locations = [
  {
    name: "Rudraprayag",
    lat: 30.2844,
    lng: 78.9811,
    type: "District HQ",

    risks: {
      overall: 0.95,
      flood: 0.91,
      landslide: 0.84,
      cloudburst: 0.78,
      fire: 0.32,
    },
  },

  {
    name: "Tilwara",
    lat: 30.347,
    lng: 78.988,
    type: "Town",

    risks: {
      overall: 0.69,
      flood: 0.82,
      landslide: 0.61,
      cloudburst: 0.74,
      fire: 0.44,
    },
  },

  {
    name: "Augustmuni",
    lat: 30.5287,
    lng: 79.0775,
    type: "Town",

    risks: {
      overall: 0.63,
      flood: 0.71,
      landslide: 0.76,
      cloudburst: 0.88,
      fire: 0.48,
    },
  },

  {
    name: "Ukhimath",
    lat: 30.5169,
    lng: 79.0715,
    type: "Town",

    risks: {
      overall: 0.57,
      flood: 0.54,
      landslide: 0.82,
      cloudburst: 0.79,
      fire: 0.52,
    },
  },

  {
    name: "Guptkashi",
    lat: 30.4867,
    lng: 79.0856,
    type: "Town",

    risks: {
      overall: 0.74,
      flood: 0.67,
      landslide: 0.86,
      cloudburst: 0.83,
      fire: 0.58,
    },
  },
];

// =====================================================
// HAZARD MODES
// =====================================================

const hazardModes = [
  {
    key: "overall",
    label: "Overall Risk",
    short: "OVERALL",
  },

  {
    key: "flood",
    label: "Flash Flood",
    short: "FLOOD",
  },

  {
    key: "landslide",
    label: "Landslide",
    short: "LANDSLIDE",
  },

  {
    key: "cloudburst",
    label: "Cloudburst",
    short: "CLOUDBURST",
  },

  {
    key: "fire",
    label: "Forest Fire",
    short: "FIRE",
  },
];

// =====================================================
// HAZARD-SPECIFIC RISK FIELDS
// PROTOTYPE DATA
// =====================================================

const hazardRiskPoints = {
  // ===================================================
  // OVERALL
  // ===================================================

  overall: [
    [30.2844, 78.9811, 1.0],
    [30.2920, 78.9850, 0.96],
    [30.2780, 78.9750, 0.94],
    [30.3000, 78.9780, 0.91],

    [30.2600, 78.9700, 0.84],
    [30.2450, 78.9800, 0.79],
    [30.2300, 78.9950, 0.74],
    [30.2150, 79.0150, 0.68],

    [30.3150, 79.0000, 0.83],
    [30.3300, 79.0150, 0.77],
    [30.3450, 79.0250, 0.71],
    [30.3650, 79.0350, 0.65],

    [30.3850, 79.0500, 0.59],
    [30.4050, 79.0700, 0.53],
    [30.4250, 79.0850, 0.47],

    [30.3000, 78.9450, 0.61],
    [30.3250, 78.9250, 0.55],
    [30.3500, 78.9150, 0.48],

    [30.3700, 78.9500, 0.35],
    [30.4000, 78.9700, 0.28],
    [30.4300, 79.0200, 0.24],
  ],

  // ===================================================
  // FLASH FLOOD
  // ===================================================

  flood: [
    [30.2844, 78.9811, 1.0],
    [30.2920, 78.9850, 0.98],
    [30.3000, 78.9850, 0.95],
    [30.3100, 78.9850, 0.93],
    [30.3200, 78.9870, 0.91],
    [30.3300, 78.9890, 0.88],
    [30.3400, 78.9910, 0.86],
    [30.3500, 78.9940, 0.84],

    [30.2700, 78.9750, 0.90],
    [30.2550, 78.9800, 0.86],
    [30.2400, 78.9880, 0.82],
    [30.2250, 78.9970, 0.78],

    [30.3000, 78.9500, 0.73],
    [30.2900, 78.9600, 0.77],
    [30.2800, 78.9700, 0.84],

    [30.3700, 79.0000, 0.72],
    [30.3850, 79.0100, 0.66],
    [30.4000, 79.0250, 0.59],
  ],

  // ===================================================
  // LANDSLIDE
  // ===================================================

  landslide: [
    [30.4200, 79.0550, 0.95],
    [30.4350, 79.0750, 0.92],
    [30.4500, 79.0900, 0.89],

    [30.4000, 79.0400, 0.87],
    [30.3850, 79.0250, 0.84],
    [30.3700, 79.0150, 0.80],

    [30.3500, 79.0450, 0.88],
    [30.3350, 79.0600, 0.84],
    [30.3200, 79.0750, 0.78],

    [30.3000, 79.0400, 0.73],
    [30.2850, 79.0550, 0.69],
    [30.2700, 79.0700, 0.63],

    [30.4100, 78.9500, 0.71],
    [30.3900, 78.9350, 0.66],
    [30.3650, 78.9250, 0.60],
  ],

  // ===================================================
  // CLOUD BURST
  // ===================================================

  cloudburst: [
    [30.3400, 79.0200, 1.0],
    [30.3470, 79.0280, 0.97],
    [30.3550, 79.0350, 0.94],

    [30.3950, 79.0600, 0.92],
    [30.4020, 79.0680, 0.88],
    [30.4100, 79.0750, 0.84],

    [30.2700, 78.9550, 0.89],
    [30.2770, 78.9650, 0.85],
    [30.2850, 78.9750, 0.81],

    [30.3200, 78.9300, 0.73],
    [30.3350, 78.9400, 0.68],
  ],

  // ===================================================
  // FOREST FIRE
  // ===================================================

  fire: [
    [30.4100, 78.9400, 0.92],
    [30.4250, 78.9500, 0.88],
    [30.4400, 78.9650, 0.84],

    [30.3800, 78.9200, 0.79],
    [30.3950, 78.9300, 0.76],

    [30.3500, 78.9000, 0.72],
    [30.3650, 78.9100, 0.69],

    [30.2500, 79.0300, 0.64],
    [30.2350, 79.0450, 0.60],

    [30.4300, 79.1000, 0.58],
    [30.4450, 79.1150, 0.53],
  ],
};

// =====================================================
// RISK COLOR
// =====================================================

function getRiskMeta(risk) {
  if (risk >= 0.8) {
    return {
      level: "EXTREME",
      color: "#ff2525",
    };
  }

  if (risk >= 0.6) {
    return {
      level: "HIGH",
      color: "#ff7200",
    };
  }

  if (risk >= 0.4) {
    return {
      level: "MODERATE",
      color: "#ffd000",
    };
  }

  if (risk >= 0.2) {
    return {
      level: "LOW",
      color: "#477cff",
    };
  }

  return {
    level: "VERY LOW",
    color: "#16e879",
  };
}

// =====================================================
// GET LOCATION RISK
// =====================================================

function getLocationRisk(
  location,
  hazard
) {
  return (
    location.risks?.[hazard] ??
    location.risks?.overall ??
    0
  );
}

// =====================================================
// STEP 5 — FORECAST TIMELINE
// PROTOTYPE FORECAST LOGIC
// =====================================================

function getForecastTimeline(
  location,
  hazard
) {
  const currentRisk =
    getLocationRisk(
      location,
      hazard
    );

  const trendByHazard = {
    overall: [
      0.00,
      0.02,
      0.04,
      0.06,
      0.08,
    ],

    flood: [
      0.00,
      0.02,
      0.04,
      0.05,
      0.07,
    ],

    landslide: [
      0.00,
      0.01,
      0.03,
      0.04,
      0.06,
    ],

    cloudburst: [
      0.00,
      0.04,
      0.07,
      0.08,
      0.10,
    ],

    fire: [
      0.00,
      0.01,
      0.02,
      0.04,
      0.05,
    ],
  };

  const trend =
    trendByHazard[hazard] ??
    trendByHazard.overall;

  const times = [
    "NOW",
    "+15m",
    "+30m",
    "+45m",
    "+60m",
  ];

  return times.map(
    (time, index) => ({
      time,

      risk: Math.min(
        0.99,
        currentRisk +
          trend[index]
      ),
    })
  );
}

// =====================================================
// HAZARD-SPECIFIC HEATMAP
// =====================================================

function RiskHeatmap({
  hazard,
  boundaryData,
}) {
  const map = useMap();

  const heatLayerRef =
    useRef(null);

  useEffect(() => {
    const activePoints =
      hazardRiskPoints[hazard] ??
      hazardRiskPoints.overall;

    let filteredPoints =
      activePoints;

    // =================================================
    // FILTER BY DISTRICT BOUNDARY
    // =================================================

    if (
      boundaryData &&
      Array.isArray(
        boundaryData.features
      ) &&
      boundaryData.features.length > 0
    ) {
      filteredPoints =
        activePoints.filter(
          ([lat, lng]) => {
            const testPoint =
              point([
                lng,
                lat,
              ]);

            return boundaryData.features.some(
              (feature) => {
                try {
                  return booleanPointInPolygon(
                    testPoint,
                    feature
                  );
                } catch (error) {
                  console.error(
                    "Polygon test error:",
                    error
                  );

                  return false;
                }
              }
            );
          }
        );
    }

    // =================================================
    // CREATE HEAT DATA
    // =================================================

    const heatData =
      filteredPoints.map(
        ([lat, lng, risk]) => [
          lat,
          lng,
          Math.min(
            1,
            risk
          ),
        ]
      );

    // =================================================
    // CREATE HEAT LAYER
    // =================================================

    const heat =
      L.heatLayer(
        heatData,
        {
          radius: 45,
          blur: 38,
          maxZoom: 13,
          max: 1,
          minOpacity: 0.28,

          gradient: {
            0.00: "#00ff55",
            0.20: "#36ff42",
            0.40: "#ffe600",
            0.60: "#ff9d00",
            0.80: "#ff4800",
            1.00: "#ff0000",
          },
        }
      );

    heat.addTo(map);

    heatLayerRef.current =
      heat;

    return () => {
      if (
        heatLayerRef.current
      ) {
        map.removeLayer(
          heatLayerRef.current
        );

        heatLayerRef.current =
          null;
      }
    };
  }, [
    map,
    hazard,
    boundaryData,
  ]);

  return null;
}

// =====================================================
// RISK ZONES
// =====================================================

function RiskZones() {
  return (
    <>
      <Circle
        center={[
          30.2844,
          78.9811,
        ]}
        radius={3500}
        pathOptions={{
          color: "#ff2525",
          fillColor: "#ff2525",
          fillOpacity: 0.055,
          weight: 1,
          opacity: 0.35,
        }}
      />

      <Circle
        center={[
          30.245,
          78.985,
        ]}
        radius={5000}
        pathOptions={{
          color: "#ff7200",
          fillColor: "#ff7200",
          fillOpacity: 0.04,
          weight: 1,
          opacity: 0.28,
        }}
      />

      <Circle
        center={[
          30.35,
          79.02,
        ]}
        radius={6000}
        pathOptions={{
          color: "#ff7200",
          fillColor: "#ff7200",
          fillOpacity: 0.03,
          weight: 1,
          opacity: 0.24,
        }}
      />
    </>
  );
}

// =====================================================
// RIVER LAYER
// PROTOTYPE VISUAL CENTERLINES
// =====================================================

function RiverLayer() {
  const map = useMap();

  useEffect(() => {
    const riverGroup =
      L.layerGroup();

    // =================================================
    // MANDAKINI RIVER
    // =================================================

    const mandakiniCoordinates = [
      [30.61, 79.08],
      [30.59, 79.075],
      [30.57, 79.07],
      [30.55, 79.065],
      [30.53, 79.06],
      [30.51, 79.055],
      [30.49, 79.045],
      [30.47, 79.035],
      [30.45, 79.025],
      [30.43, 79.015],
      [30.41, 79.005],
      [30.39, 79.0],
      [30.37, 78.995],
      [30.35, 78.99],
      [30.33, 78.987],
      [30.31, 78.984],
      [30.2844, 78.9811],
    ];

    const mandakiniGlow =
      L.polyline(
        mandakiniCoordinates,
        {
          color: "#00a8ff",
          weight: 9,
          opacity: 0.12,
          lineCap: "round",
          lineJoin: "round",
        }
      );

    mandakiniGlow.addTo(
      riverGroup
    );

    const mandakini =
      L.polyline(
        mandakiniCoordinates,
        {
          color: "#20bfff",
          weight: 3,
          opacity: 0.92,
          lineCap: "round",
          lineJoin: "round",
        }
      );

    mandakini.bindTooltip(
      "Mandakini River"
    );

    mandakini.addTo(
      riverGroup
    );

    // =================================================
    // ALAKNANDA RIVER
    // =================================================

    const alaknandaCoordinates = [
      [30.32, 78.87],
      [30.315, 78.89],
      [30.305, 78.91],
      [30.30, 78.93],
      [30.295, 78.95],
      [30.292, 78.965],
      [30.2844, 78.9811],
    ];

    const alaknandaGlow =
      L.polyline(
        alaknandaCoordinates,
        {
          color: "#00a8ff",
          weight: 9,
          opacity: 0.10,
          lineCap: "round",
          lineJoin: "round",
        }
      );

    alaknandaGlow.addTo(
      riverGroup
    );

    const alaknanda =
      L.polyline(
        alaknandaCoordinates,
        {
          color: "#238ee0",
          weight: 3,
          opacity: 0.88,
          lineCap: "round",
          lineJoin: "round",
        }
      );

    alaknanda.bindTooltip(
      "Alaknanda River"
    );

    alaknanda.addTo(
      riverGroup
    );

    riverGroup.addTo(map);

    return () => {
      map.removeLayer(
        riverGroup
      );
    };
  }, [map]);

  return null;
}

// =====================================================
// LOCATION MARKER
// =====================================================

function LocationMarker({
  location,
  onSelect,
  hazard,
}) {
  const locationRisk =
    getLocationRisk(
      location,
      hazard
    );

  const meta =
    getRiskMeta(
      locationRisk
    );

  return (
    <CircleMarker
      center={[
        location.lat,
        location.lng,
      ]}
      radius={
        location.name ===
        "Rudraprayag"
          ? 10
          : 6
      }
      pathOptions={{
        color: "#ffffff",

        weight:
          location.name ===
          "Rudraprayag"
            ? 3
            : 2,

        fillColor:
          meta.color,

        fillOpacity: 1,
      }}
      eventHandlers={{
        click: () =>
          onSelect(
            location
          ),
      }}
    >

      {/* LOCATION LABEL */}

      <Tooltip
        direction="top"
        offset={[
          0,
          -8,
        ]}
        permanent={
          location.name ===
          "Rudraprayag"
        }
        opacity={
          location.name ===
          "Rudraprayag"
            ? 0.95
            : 0.85
        }
        className="risk-location-label"
      >
        <span>
          {location.name}
        </span>
      </Tooltip>

      {/* POPUP */}

      <Popup>

        <div
          style={{
            minWidth:
              "210px",
            background:
              "#071117",
            color: "white",
            padding: "4px",
          }}
        >

          <small
            style={{
              color:
                "#7b8b92",
            }}
          >
            {location.type}
          </small>

          <h3
            style={{
              margin:
                "5px 0",
            }}
          >
            {location.name}
          </h3>

          <strong
            style={{
              color:
                meta.color,
            }}
          >

            {meta.level}
            {" · "}

            {Math.round(
              locationRisk *
                100
            )}

            /100

          </strong>

          <hr
            style={{
              borderColor:
                "#273840",
            }}
          />

          <p>
            🌊 Flash Flood:{" "}
            <b>
              {Math.round(
                getLocationRisk(
                  location,
                  "flood"
                ) * 100
              )}
              %
            </b>
          </p>

          <p>
            ☁️ Cloudburst:{" "}
            <b>
              {Math.round(
                getLocationRisk(
                  location,
                  "cloudburst"
                ) * 100
              )}
              %
            </b>
          </p>

          <p>
            ⛰️ Landslide:{" "}
            <b>
              {Math.round(
                getLocationRisk(
                  location,
                  "landslide"
                ) * 100
              )}
              %
            </b>
          </p>

          <p
            style={{
              color:
                "#728189",
              fontSize:
                "11px",
            }}
          >
            AI Confidence: 86%
          </p>

        </div>

      </Popup>

    </CircleMarker>
  );
}

// =====================================================
// AUTO FIT DISTRICT BOUNDARY
// =====================================================

function FitDistrictBounds({
  boundaryData,
}) {
  const map = useMap();

  useEffect(() => {
    if (!boundaryData) return;

    try {
      const boundaryLayer =
        L.geoJSON(
          boundaryData
        );

      const bounds =
        boundaryLayer.getBounds();

      if (bounds.isValid()) {
        map.fitBounds(
          bounds,
          {
            padding: [
              45,
              45,
            ],
            maxZoom: 10,
            animate: true,
          }
        );
      }
    } catch (error) {
      console.error(
        "Map fit error:",
        error
      );
    }
  }, [
    map,
    boundaryData,
  ]);

  return null;
}

// =====================================================
// RESTRICT MAP TO RUDRAPRAYAG
// =====================================================

function RestrictMapToDistrict({
  boundaryData,
}) {
  const map = useMap();

  useEffect(() => {
    if (!boundaryData) return;

    try {
      const boundaryLayer =
        L.geoJSON(
          boundaryData
        );

      const bounds =
        boundaryLayer.getBounds();

      if (!bounds.isValid()) {
        return;
      }

      const paddedBounds =
        bounds.pad(0.10);

      map.setMaxBounds(
        paddedBounds
      );

      map.options.maxBoundsViscosity =
        0.9;

    } catch (error) {
      console.error(
        "Map restriction error:",
        error
      );
    }

    return () => {
      map.setMaxBounds(
        null
      );
    };
  }, [
    map,
    boundaryData,
  ]);

  return null;
}

// =====================================================
// MAIN MAP
// =====================================================

export default function RiskMap() {

  const [
    boundaryData,
    setBoundaryData,
  ] = useState(null);

  const [
    selectedLocation,
    setSelectedLocation,
  ] = useState(
    locations[0]
  );

  // ===================================================
  // ACTIVE HAZARD
  // ===================================================

  const [
    activeHazard,
    setActiveHazard,
  ] = useState(
    "overall"
  );

  const activeHazardMeta =
    hazardModes.find(
      (item) =>
        item.key ===
        activeHazard
    ) ??
    hazardModes[0];

  // ===================================================
  // LOAD RUDRAPRAYAG DISTRICT BOUNDARY
  // ===================================================

  useEffect(() => {

    const url =
      "https://livingatlas.esri.in/server/rest/services/India/IN_DT_Language/MapServer/0/query" +
      "?where=distname%3D%27Rudraprayag%27" +
      "&outFields=distname" +
      "&returnGeometry=true" +
      "&f=geojson" +
      "&outSR=4326";

    fetch(url)

      .then(
        (response) => {

          if (!response.ok) {
            throw new Error(
              "Boundary loading failed"
            );
          }

          return response.json();
        }
      )

      .then((data) => {

        setBoundaryData(
          data
        );

      })

      .catch((error) => {

        console.error(
          "Boundary error:",
          error
        );

      });

  }, []);

  // ===================================================
  // SELECTED LOCATION RISK
  // ===================================================

  const selectedLocationRisk =
    getLocationRisk(
      selectedLocation,
      activeHazard
    );

  const selectedMeta =
    getRiskMeta(
      selectedLocationRisk
    );

  // ===================================================
  // FORECAST TIMELINE
  // ===================================================

  const forecastTimeline =
    getForecastTimeline(
      selectedLocation,
      activeHazard
    );

  // ===================================================
  // FORECAST END RISK
  // ===================================================

  const forecastEndRisk =
    forecastTimeline[
      forecastTimeline.length -
        1
    ]?.risk ??
    selectedLocationRisk;

  const forecastEndMeta =
    getRiskMeta(
      forecastEndRisk
    );

  return (
    <div className="risk-map-container">

      {/* =================================================
          MAP
      ================================================= */}

      <MapContainer
        center={[
          30.36,
          79.02,
        ]}
        zoom={9.2}
        minZoom={8}
        maxZoom={16}
        zoomControl={true}
        style={{
          width: "100%",
          height: "100%",
        }}
      >

        {/* AUTO FIT */}

        <FitDistrictBounds
          boundaryData={
            boundaryData
          }
        />

        {/* MAP RESTRICTION */}

        <RestrictMapToDistrict
          boundaryData={
            boundaryData
          }
        />

        {/* BASE MAP */}

        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="base-map-tiles"
        />

        {/* HAZARD-SPECIFIC HEATMAP */}

        <RiskHeatmap
          hazard={
            activeHazard
          }
          boundaryData={
            boundaryData
          }
        />

        {/* RISK ZONES */}

        <RiskZones />

        {/* RIVERS */}

        <RiverLayer />

        {/* DISTRICT BOUNDARY */}

        {boundaryData && (
          <GeoJSON
            data={
              boundaryData
            }
            style={{
              color: "#ffffff",
              weight: 2.5,
              opacity: 0.95,
              fillColor:
                "#ff3300",
              fillOpacity:
                0.04,
              dashArray:
                "7 5",
            }}
            onEachFeature={(
              feature,
              layer
            ) => {
              layer.bindTooltip(
                "Rudraprayag District"
              );
            }}
          />
        )}

        {/* LOCATIONS */}

        {locations.map(
          (location) => (

            <LocationMarker
              key={
                location.name
              }
              location={
                location
              }
              hazard={
                activeHazard
              }
              onSelect={
                setSelectedLocation
              }
            />

          )
        )}

      </MapContainer>

      {/* =================================================
          HAZARD SELECTOR
      ================================================= */}

      <div className="hazard-selector">

        <div className="hazard-selector-head">

          <div>

            <span className="hazard-kicker">
              ANALYSIS LAYER
            </span>

            <strong>
              {
                activeHazardMeta.label
              }
            </strong>

          </div>

          <span className="hazard-live-dot">
            LIVE
          </span>

        </div>

        <div className="hazard-tabs">

          {hazardModes.map(
            (hazardMode) => (

              <button
                key={
                  hazardMode.key
                }
                type="button"
                className={
                  activeHazard ===
                  hazardMode.key
                    ? "hazard-tab active"
                    : "hazard-tab"
                }
                onClick={() =>
                  setActiveHazard(
                    hazardMode.key
                  )
                }
              >

                {
                  hazardMode.short
                }

              </button>

            )
          )}

        </div>

      </div>

      {/* =================================================
          AI STATUS PANEL
      ================================================= */}

      <div className="ai-status-panel">

        <div className="ai-status-header">

          <span className="ai-pulse"></span>

          AI RISK ENGINE

        </div>

        <div className="ai-status-main">

          <span>
            MODEL STATUS
          </span>

          <strong>
            AI DEMO
          </strong>

        </div>

        <div className="ai-status-row">

          <span>
            Satellite
          </span>

          <b>
            SIMULATED
          </b>

        </div>

        <div className="ai-status-row">

          <span>
            Terrain
          </span>

          <b>
            DEMO
          </b>

        </div>

        <div className="ai-status-row">

          <span>
            Weather
          </span>

          <b>
            DEMO
          </b>

        </div>

        <div className="ai-status-row">

          <span>
            Prediction
          </span>

          <b>
            60 MIN
          </b>

        </div>

      </div>

      {/* =================================================
          TITLE
      ================================================= */}

      <div className="map-title-overlay">

        <div className="map-title">

          RUDRAPRAYAG · LIVE RISK

        </div>

        <div className="map-subtitle">

          {
            activeHazardMeta.label.toUpperCase()
          }

          {" · "}

          AI GEOSPATIAL DISASTER
          INTELLIGENCE

        </div>

      </div>

      {/* =================================================
          RISK LEGEND
      ================================================= */}

      <div className="risk-legend">

        <div className="legend-title">
          RISK LEVEL
        </div>

        <div>
          <span className="dot very-low"></span>
          Very Low
        </div>

        <div>
          <span className="dot low"></span>
          Low
        </div>

        <div>
          <span className="dot moderate"></span>
          Moderate
        </div>

        <div>
          <span className="dot high"></span>
          High
        </div>

        <div>
          <span className="dot extreme"></span>
          Extreme
        </div>

      </div>

      {/* =================================================
          LOCATION LIST
      ================================================= */}

      <div className="location-list">

        <div className="location-list-title">

          LOCATIONS

          <span>
            SELECT
          </span>

        </div>

        {locations.map(
          (location) => {

            const locationRisk =
              getLocationRisk(
                location,
                activeHazard
              );

            const meta =
              getRiskMeta(
                locationRisk
              );

            return (

              <button
                key={
                  location.name
                }
                className={
                  selectedLocation.name ===
                  location.name
                    ? "location-item active"
                    : "location-item"
                }
                onClick={() =>
                  setSelectedLocation(
                    location
                  )
                }
              >

                <span>

                  <i
                    style={{
                      background:
                        meta.color,
                    }}
                  />

                  {
                    location.name
                  }

                </span>

                <b
                  style={{
                    color:
                      meta.color,
                  }}
                >

                  {Math.round(
                    locationRisk *
                      100
                  )}

                </b>

              </button>

            );
          }
        )}

      </div>

      {/* =================================================
          STEP 5 — AI FORECAST TIMELINE
      ================================================= */}

      <div className="prediction-panel">

        <div className="prediction-header">

          <div>

            <div className="prediction-title">
              AI FORECAST
            </div>

            <div className="prediction-subtitle">

              {
                activeHazardMeta.label
              }

              {" · "}

              {
                selectedLocation.name
              }

            </div>

          </div>

          <span className="forecast-live">
            LIVE
          </span>

        </div>

        {/* CURRENT + END RISK */}

        <div className="forecast-current">

          <div>

            <span>
              CURRENT RISK
            </span>

            <strong
              style={{
                color:
                  selectedMeta.color,
              }}
            >

              {Math.round(
                selectedLocationRisk *
                  100
              )}

            </strong>

          </div>

          <div className="forecast-horizon">

            <span>
              +60 MIN FORECAST
            </span>

            <b
              style={{
                color:
                  forecastEndMeta.color,
              }}
            >

              {Math.round(
                forecastEndRisk *
                  100
              )}

            </b>

          </div>

        </div>

        {/* TIMELINE */}

        <div className="forecast-timeline">

          {forecastTimeline.map(
            (item, index) => {

              const itemMeta =
                getRiskMeta(
                  item.risk
                );

              return (

                <div
                  key={
                    item.time
                  }
                  className={
                    index === 0
                      ? "forecast-point current"
                      : "forecast-point"
                  }
                >

                  <span className="forecast-time">

                    {
                      item.time
                    }

                  </span>

                  <div className="forecast-dot-wrap">

                    <span
                      className="forecast-dot"
                      style={{
                        background:
                          itemMeta.color,
                        boxShadow:
                          `0 0 12px ${itemMeta.color}`,
                      }}
                    />

                  </div>

                  <strong
                    style={{
                      color:
                        itemMeta.color,
                    }}
                  >

                    {Math.round(
                      item.risk *
                        100
                    )}

                  </strong>

                </div>

              );
            }
          )}

        </div>

        {/* FORECAST SCALE */}

        <div className="forecast-scale">

          <span>
            NOW
          </span>

          <span>
            +15m
          </span>

          <span>
            +30m
          </span>

          <span>
            +45m
          </span>

          <span>
            +60m
          </span>

        </div>

        {/* MODEL CONFIDENCE */}

        <div className="prediction-confidence">

          <span>
            MODEL CONFIDENCE
          </span>

          <strong>
            86%
          </strong>

        </div>

      </div>

      {/* =================================================
          SELECTED RISK CARD
      ================================================= */}

      <div
        className="selected-risk-card"
        style={{
          borderColor:
            selectedMeta.color,
        }}
      >

        <div className="selected-top">

          <div>

            <small>

              SELECTED LOCATION ·{" "}

              {
                activeHazardMeta.short
              }

            </small>

            <h2>

              {
                selectedLocation.name
              }

            </h2>

          </div>

          <span
            style={{
              color:
                selectedMeta.color,

              borderColor:
                selectedMeta.color,
            }}
          >

            {
              selectedMeta.level
            }

          </span>

        </div>

        {/* MAIN SCORE */}

        <div className="big-risk">

          <strong
            style={{
              color:
                selectedMeta.color,
            }}
          >

            {Math.round(
              selectedLocationRisk *
                100
            )}

          </strong>

          <div>

            /100

            <small>

              {
                activeHazardMeta.label.toUpperCase()
              }

              {" "}

              RISK

            </small>

          </div>

        </div>

        {/* HAZARD BREAKDOWN */}

        <div className="metrics">

          <div>

            <span>
              Flash Flood
            </span>

            <b>

              {Math.round(
                getLocationRisk(
                  selectedLocation,
                  "flood"
                ) *
                  100
              )}

              %

            </b>

          </div>

          <div>

            <span>
              Cloudburst
            </span>

            <b>

              {Math.round(
                getLocationRisk(
                  selectedLocation,
                  "cloudburst"
                ) *
                  100
              )}

              %

            </b>

          </div>

          <div>

            <span>
              Landslide
            </span>

            <b>

              {Math.round(
                getLocationRisk(
                  selectedLocation,
                  "landslide"
                ) *
                  100
              )}

              %

            </b>

          </div>

        </div>

      </div>

    </div>
  );
}