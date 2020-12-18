/* global mapboxgl turf */

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
const CONN_LIM = 500;

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
let geoloc = new mapboxgl.GeolocateControl({
  fitBoundsOptions: {
    maxZoom: 9,
    linear: true,
    easing: () => {
      return 1;
    },
  },
});
map.addControl(geoloc, "bottom-right");
function trigger() {
  geoloc.trigger();
}
geoloc.on("geolocate", (p) => {
  stylePointer("wait");
  setTimeout(() => fireClick(p), 2000);
});
disableClick();
var marker = new mapboxgl.Marker({ scale: 0.7 });
map.on("load", () => {
  marker.setLngLat(random).addTo(map);
  runQuery(random.idd, random, 0);
});

get("geoloc").onclick = trigger;
get("exit").onclick = exitModal;
get("modal").onclick = exitModal;
function exitModal() {
  get("modal").style.display = "none";
}

function fireClick(p) {
  let lngLat = { lng: p.coords.longitude, lat: p.coords.latitude };
  map.fire("click", {
    lngLat: lngLat,
    point: map.project(lngLat),
    originalEvent: {},
  });
  setTimeout(() => stylePointer("pointer"), 1500);
}

function stylePointer(style) {
  map.getCanvas().style.cursor = style;
  queryAll(".mapboxgl-marker").forEach((q) => (q.style.cursor = style));
  queryAll(".mapboxgl-ctrl-icon").forEach((q) => (q.style.cursor = style));
  get("geoloc").style.cursor = style;
  get("controls").style.cursor = style;
}

function enableClick() {
  map.on("click", "basins_transparent", handleClick);
  stylePointer("pointer");
}

function disableClick() {
  map.off("click", "basins_transparent", handleClick);
  stylePointer("wait");
}

function handleClick(e) {
  let idd = e.features[0].properties.HYBAS_ID;
  let lngLat = e.lngLat;
  let lng = parseFloat(lngLat.lng.toFixed(3));
  let lat = parseFloat(lngLat.lat.toFixed(3));
  console.log({ idd: idd, lng: lng, lat: lat });
  runIfCan(idd, lngLat);
}

function runIfCan(idd, lngLat) {
  fetch("https://water.rdrn.me/ac")
    .then((res) => res.text())
    .then((num_conn) => {
      return runQuery(idd, lngLat, num_conn);
    })
    .catch(() => enableClick());
}

let lngLatStr;
function runQuery(idd, lngLat, num_conn) {
  if (num_conn > CONN_LIM) {
    get("modal").style.display = "block";
  } else {
    lngLatStr = lngLat.lng + "_" + lngLat.lat;
    marker.setLngLat(lngLat);
    disableClick();
    fetch(`api/${idd}/`)
      .then((response) => response.json())
      .then((basins) => addToMap(basins))
      .catch(() => enableClick());
  }
}

let basins;
function addToMap(b) {
  basins = b;
  map.setFilter("basins_up", ["in", "HYBAS_ID"].concat(basins.up));
  map.setFilter("basins_down", ["in", "HYBAS_ID"].concat(basins.down));
  setTimeout(enableClick, 4000);
}

function download() {
  let feats = [];
  for (let key in basins) {
    let src = map.querySourceFeatures("composite", {
      sourceLayer: "hydrobasins",
      filter: ["in", "HYBAS_ID"].concat(basins[key]),
    });
    let fc = turf.featureCollection(
      src.map((s) =>
        turf.truncate(turf.feature(s.toJSON().geometry), { precision: 4 })
      )
    );
    let fc2 = [];
    fc.features.forEach((f) => {
      if (f.geometry.type == "MultiPolygon") {
        fc2.push.apply(fc2, turf.flatten(f).features);
      } else {
        fc2.push(f);
      }
    });
    let un = turf.union.apply(this, fc2);
    //un.geometry.coordinates.splice(1, un.geometry.coordinates[0].length - 1);
    feats[key] = un;
  }
  let final = turf.featureCollection([feats.up, feats.down]);
  let str = JSON.stringify(final);
  let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(str);
  let downloadAnchorNode = document.createElement("a");
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute(
    "download",
    "basins_" + lngLatStr + ".geojson"
  );
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}
