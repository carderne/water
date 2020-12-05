/* global mapboxgl start_ids */

const MB_TOKEN =
  "pk.eyJ1IjoiY2FyZGVybmUiLCJhIjoiY2puMXN5cnBtNG53NDN2bnhlZ3h4b3RqcCJ9.eNjrtezXwvM7Ho1VSxo06w";
const MB_STYLE =
  "mapbox://styles/carderne/cki8lqpp99h9q19lrfvg1cy2g?fresh=true";

mapboxgl.accessToken = MB_TOKEN;
let map = new mapboxgl.Map({
  container: "map",
  style: MB_STYLE,
  center: [25, -27],
  zoom: 4,
  minZoom: 3,
  maxZoom: 11,
});
map.getCanvas().style.cursor = "pointer";
map.dragRotate.disable();
map.touchZoomRotate.disableRotation();

map.on("load", () => {
  addToMap(start_ids);
  map.on("click", "basins_transparent", (e) =>
    runQuery(e.features[0].properties.HYBAS_ID)
  );
});

function runQuery(idd) {
  fetch(`api/${idd}/`)
    .then((response) => response.json())
    .then((basins) => addToMap(basins));
}

function addToMap(basins) {
  map.setFilter("basins_up", ["in", "HYBAS_ID"].concat(basins.up));
  map.setFilter("basins_down", ["in", "HYBAS_ID"].concat(basins.down));
}
