/* global mapboxgl MB_TOKEN MB_STYLE */

const get = document.getElementById.bind(document);

const MB_TOKEN =
  "pk.eyJ1IjoiY2FyZGVybmUiLCJhIjoiY2puMXN5cnBtNG53NDN2bnhlZ3h4b3RqcCJ9.eNjrtezXwvM7Ho1VSxo06w";
const MB_STYLE = "mapbox://styles/carderne/cki8lqpp99h9q19lrfvg1cy2g?fresh=true";

mapboxgl.accessToken = MB_TOKEN;
let map = new mapboxgl.Map({
  container: "map",
  style: MB_STYLE,
  center: [0, 0],
  zoom: 3,
});

map.on("load", () => {
  map.addSource("watershed", {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] },
  });
  map.addLayer({
    id: "watershed",
    type: "circle",
    source: "watershed",
    paint: {
      "circle-radius": 10,
      "circle-color": "#E97F35",
    },
  });
  map.on("click", (e) => {
    runQuery(e.lngLat.lng, e.lngLat.lat);
  });
});

function runQuery(lon, lat) {
  console.log("coords", lon, lat);
  let direc = get("dir").value;
  console.log("direc", direc);
  fetch(`http://168.119.239.10/${lon}/${lat}/${direc}`)
    .then((response) => response.json())
    .then((basins) => addToMap(basins));
}

function addToMap(basins) {
  console.log("basins", basins);
  map.setFilter("hydrobasins", ["in", "HYBAS_ID"].concat(basins));
}
