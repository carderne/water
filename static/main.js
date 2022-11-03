/* global mapboxgl turf */

import starters from "./starters.js";

const backendRunning = true;

const get = document.getElementById.bind(document);
const queryAll = document.querySelectorAll.bind(document);

if (backendRunning) get("warning").remove();

const random = starters[Math.floor(Math.random() * starters.length)];

const MB_TOKEN =
  "pk.eyJ1IjoiY2FyZGVybmUiLCJhIjoiY2puMXN5cnBtNG53NDN2bnhlZ3h4b3RqcCJ9.eNjrtezXwvM7Ho1VSxo06w";
const MB_STYLE = "mapbox://styles/carderne/cki8lqpp99h9q19lrfvg1cy2g";

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

var marker = new mapboxgl.Marker({ scale: 0.7 });
map.on("load", () => {
  marker.setLngLat(random).addTo(map);
  if (backendRunning) {
    disableClick();
    runQuery(random.idd, random, 0);
  } else {
    disableBackend();
    addToMap(random.basins);
  }
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

function disableBackend() {
  map.off("click", "basins_transparent", handleClick);
  stylePointer("not-allowed");
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
  return runQuery(idd, lngLat);
}

let lngLatStr;
function runQuery(idd, lngLat) {
  if (backendRunning) {
    lngLatStr = lngLat.lng + "_" + lngLat.lat;
    marker.setLngLat(lngLat);
    disableClick();
    fetch(`https://water.fly.dev/api/${idd}/`)
      .then((response) => response.json())
      .then((basins) => addToMap(basins))
      .catch(() => enableClick());
  } else {
    console.log("Backend not running!");
  }
}

let basins;
function addToMap(b) {
  basins = b;
  map.setFilter("basins_up", ["in", "HYBAS_ID"].concat(basins.up));
  map.setFilter("basins_down", ["in", "HYBAS_ID"].concat(basins.down));
  if (backendRunning) {
    setTimeout(enableClick, 4000);
  }
}

// eslint-disable-next-line
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
