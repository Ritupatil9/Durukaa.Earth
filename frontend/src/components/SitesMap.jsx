import mapboxgl from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import { useEffect, useRef } from "react";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

/**
 * Reusable Mapbox GL map.
 *
 * Props:
 * - geojson: FeatureCollection of existing site polygons to render.
 * - drawEnabled: when true, shows Mapbox GL Draw controls so the admin can
 *   draw/edit a single new polygon.
 * - onDrawChange(geojsonPolygonOrNull): called whenever the drawn polygon
 *   is created, edited, or deleted.
 * - onFeatureClick(properties): called when an existing site polygon is
 *   clicked (used to show a popup / navigate to site details).
 * - initialPolygon: an existing GeoJSON polygon to preload into draw mode
 *   (used when editing a site's boundary).
 */
export default function SitesMap({
  geojson,
  drawEnabled = false,
  onDrawChange,
  onFeatureClick,
  initialPolygon,
  className = "h-[420px]",
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const drawRef = useRef(null);
  const popupRef = useRef(null);

  // Initialize map once.
  useEffect(() => {
    if (!MAPBOX_TOKEN) return;
    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [73.45, 18.6],
      zoom: 9,
    });
    mapRef.current = map;

    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    if (drawEnabled) {
      const draw = new MapboxDraw({
        displayControlsDefault: false,
        controls: { polygon: true, trash: true },
      });
      drawRef.current = draw;
      map.addControl(draw, "top-left");

      const emitChange = () => {
        const data = draw.getAll();
        onDrawChange?.(data.features.length ? data.features[0].geometry : null);
      };

      map.on("draw.create", emitChange);
      map.on("draw.update", emitChange);
      map.on("draw.delete", emitChange);

      map.on("load", () => {
        if (initialPolygon) {
          draw.add({ type: "Feature", properties: {}, geometry: initialPolygon });
          const coords = initialPolygon.coordinates[0];
          const bounds = coords.reduce(
            (b, c) => b.extend(c),
            new mapboxgl.LngLatBounds(coords[0], coords[0]),
          );
          map.fitBounds(bounds, { padding: 40, duration: 0 });
        }
      });
    }

    map.on("load", () => {
      if (!drawEnabled) {
        map.addSource("sites-source", {
          type: "geojson",
          data: geojson || { type: "FeatureCollection", features: [] },
        });
        map.addLayer({
          id: "sites-fill",
          type: "fill",
          source: "sites-source",
          paint: { "fill-color": "#3f9264", "fill-opacity": 0.35 },
        });
        map.addLayer({
          id: "sites-outline",
          type: "line",
          source: "sites-source",
          paint: { "line-color": "#265d41", "line-width": 2 },
        });

        map.on("click", "sites-fill", (e) => {
          const feature = e.features[0];
          const props = feature.properties;

          if (popupRef.current) popupRef.current.remove();
          popupRef.current = new mapboxgl.Popup({ closeButton: true })
            .setLngLat(e.lngLat)
            .setHTML(
              `<div style="font-family: Inter, sans-serif; min-width: 180px;">
                 <p style="font-weight:600; margin:0 0 4px;">${escapeHtml(props.name)}</p>
                 <p style="margin:0 0 2px; color:#555; font-size:12px;">${escapeHtml(props.project_name)}</p>
                 <p style="margin:0 0 8px; font-size:12px;">Area: ${Number(props.area_hectares).toFixed(2)} ha</p>
                 <button id="view-site-${props.id}" style="background:#2f7550;color:white;border:none;border-radius:6px;padding:6px 10px;font-size:12px;cursor:pointer;">View details</button>
               </div>`,
            )
            .addTo(map);

          setTimeout(() => {
            const btn = document.getElementById(`view-site-${props.id}`);
            if (btn) btn.onclick = () => onFeatureClick?.(props);
          }, 0);
        });

        map.on("mouseenter", "sites-fill", () => (map.getCanvas().style.cursor = "pointer"));
        map.on("mouseleave", "sites-fill", () => (map.getCanvas().style.cursor = ""));

        fitToFeatures(map, geojson);
      }
    });

    return () => map.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the source in sync when geojson prop changes (view mode only).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || drawEnabled) return;
    const applyData = () => {
      const source = map.getSource("sites-source");
      if (source) {
        source.setData(geojson || { type: "FeatureCollection", features: [] });
        fitToFeatures(map, geojson);
      }
    };
    if (map.isStyleLoaded()) applyData();
    else map.once("load", applyData);
  }, [geojson, drawEnabled]);

  if (!MAPBOX_TOKEN) {
    return (
      <div
        className={`${className} flex items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500`}
      >
        Mapbox access token is missing. Set{" "}
        <code className="mx-1 rounded bg-gray-200 px-1">VITE_MAPBOX_TOKEN</code> in frontend/.env to
        enable the map.
      </div>
    );
  }

  return <div ref={mapContainerRef} className={`${className} w-full rounded-xl`} />;
}

function fitToFeatures(map, geojson) {
  if (!geojson || !geojson.features || geojson.features.length === 0) return;
  let bounds = null;
  geojson.features.forEach((feature) => {
    feature.geometry.coordinates[0].forEach((coord) => {
      bounds = bounds ? bounds.extend(coord) : new mapboxgl.LngLatBounds(coord, coord);
    });
  });
  if (bounds) map.fitBounds(bounds, { padding: 60, duration: 500 });
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.innerText = value ?? "";
  return div.innerHTML;
}
