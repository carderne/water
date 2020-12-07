/* global mapboxgl */

const get = document.getElementById.bind(document);
const queryAll = document.querySelectorAll.bind(document);

const starters = [
  { idd: 1002291880, lng: 27.341, lat: -30.403, zoom: 5 },
  { idd: 1001125440, lng: 24.341, lat: 0.769, zoom: 4 },
  { idd: 7000039870, lng: -73.916, lat: 40.954, zoom: 6 },
  { idd: 6000268020, lng: -65.668, lat: -2.646, zoom: 4 },
  { idd: 7000575380, lng: -90.186, lat: 38.619, zoom: 5 },
  { idd: 2000392040, lng: -0.11, lat: 51.494, zoom: 7 },
  { idd: 3000991120, lng: 106.88, lat: 47.907, zoom: 3 },
];
const random = starters[Math.floor(Math.random() * starters.length)];

const MB_TOKEN =
  "pk.eyJ1IjoiY2FyZGVybmUiLCJhIjoiY2puMXN5cnBtNG53NDN2bnhlZ3h4b3RqcCJ9.eNjrtezXwvM7Ho1VSxo06w";
const MB_STYLE = "mapbox://styles/carderne/cki8lqpp99h9q19lrfvg1cy2g";
const CONN_LIM = 200;

mapboxgl.accessToken = MB_TOKEN;
let map = new mapboxgl.Map({
  container: "map",
  style: MB_STYLE,
  center: [random.lng, random.lat],
  zoom: random.zoom,
  minZoom: 2,
  maxZoom: 11,
});
map.dragRotate.disable();
map.touchZoomRotate.disableRotation();
map.addControl(
  new mapboxgl.ScaleControl({
    maxWidth: 200,
    unit: "metric",
  }),
  "bottom-right"
);
map.addControl(new mapboxgl.NavigationControl(), "bottom-right");

function enableClick() {
  map.on("click", "basins_transparent", handleClick);
  map.getCanvas().style.cursor = "pointer";
  queryAll(".mapboxgl-marker").forEach((q) => (q.style.cursor = "pointer"));
}

function disableClick() {
  map.off("click", "basins_transparent", handleClick);
  map.getCanvas().style.cursor = "wait";
  queryAll(".mapboxgl-marker").forEach((q) => (q.style.cursor = "wait"));
}

var marker = new mapboxgl.Marker({ scale: 0.7 });

map.on("load", () => {
  disableClick();
  marker.setLngLat(random);
  runIfCan(random.idd, random, true);
});

function runQuery(idd, lngLat, num_conn, fit) {
  if (num_conn > CONN_LIM) {
    get("modal").style.display = "block";
  } else {
    marker.setLngLat(lngLat);
    disableClick();
    fetch(`api/${idd}/`)
      .then((response) => response.json())
      .then((basins) => addToMap(basins, lngLat, fit))
      .catch(() => enableClick());
  }
}

function addToMap(basins, lngLat, fit) {
  map.setFilter("basins_up", ["in", "HYBAS_ID"].concat(basins.up));
  map.setFilter("basins_down", ["in", "HYBAS_ID"].concat(basins.down));
  marker.addTo(map);
  setTimeout(() => enableClick(), 2000);
  if (fit)
    setTimeout(
      () => map.flyTo({ center: [random.lng, random.lat], zoom: random.zoom }),
      2000
    );
}

function handleClick(e) {
  let idd = e.features[0].properties.HYBAS_ID;
  let lngLat = e.lngLat;
  let lng = parseFloat(lngLat.lng.toFixed(3));
  let lat = parseFloat(lngLat.lat.toFixed(3));
  console.log({ idd: idd, lng: lng, lat: lat });
  runIfCan(idd, lngLat, false);
}

function runIfCan(idd, lngLat, fit) {
  fetch("https://water.rdrn.me/ac")
    .then((res) => res.text())
    .then((num_conn) => {
      return runQuery(idd, lngLat, num_conn, fit);
    });
}

get("exit").onclick = exitModal;
get("modal").onclick = exitModal;
function exitModal() {
  get("modal").style.display = "none";
}
