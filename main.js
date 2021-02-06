/* global mapboxgl turf */

const get = document.getElementById.bind(document);
const queryAll = document.querySelectorAll.bind(document);

const starters = [
  { idd: 1002291880, lng: 27.341, lat: -30.403, zoom: 5 },
  //{ idd: 1001125440, lng: 24.341, lat: 0.769, zoom: 4 },
  //{ idd: 7000039870, lng: -73.916, lat: 40.954, zoom: 6 },
  //{ idd: 6000268020, lng: -65.668, lat: -2.646, zoom: 4 },
  //{ idd: 7000575380, lng: -90.186, lat: 38.619, zoom: 5 },
  //{ idd: 2000392040, lng: -0.11, lat: 51.494, zoom: 7 },
  //{ idd: 3000991120, lng: 106.88, lat: 47.907, zoom: 3 },
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
  //stylePointer("wait");
  //setTimeout(() => fireClick(p), 2000);
});
disableClick();
var marker = new mapboxgl.Marker({ scale: 0.7 });
map.on("load", () => {
  marker.setLngLat(random).addTo(map);
  //runQuery(random.idd, random, 0);
  addToMap(basinsSA);
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
  //map.on("click", "basins_transparent", handleClick);
  //stylePointer("pointer");
}

function disableClick() {
  //map.off("click", "basins_transparent", handleClick);
  //stylePointer("wait");
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
  return runQuery(idd, lngLat, 0);
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


const basinsSA = {"down":[1002291880,1001639790,1001639960,1001640000,1001640180,1001640270,1001640850,1002292420,1002292450,1001641290,1001641340,1001641510,1002292440,1001641150,1001641080,1001640840,1001640260,1001640310,1001640090,1001640250,1001640390,1002292140,1001641070,1001641200,1001641430,1001641450,1001640950,1002292410,1001640690,1001640620,1001640350,1001639860,1001639540,1002291690,1001638570,1001638560,1001638240,1001638150,1001637360,1001636930,1001636760,1001636250,1001636030,1002290540,1001634880,1001634710,1001634320,1001633700,1001633340,1001633600,1001633230,1001633160,1002289170,1002289120,1002289070,1002288810,1002288560,1001630910,1002288390,1001630110,1001629430,1001629420,1001630230,1002288420,1002288250,1001630210,1001630260,1001631180,1001631500,1001631900,1001632150,1002289330,1001633030,1002289450,1001633750,1001633680,1002289470,1001632720,1001632050,1001632270,1001631760,1002288890,1001631380,1001631100,1001630520,1001629710,1001629160,1001628740,1001628600,1001628130,1001627950,1001627290,1001627680,1001626820,1001626330,1001625450,1002286340,1001624550,1001623790,1001623220,1001623120,1001623060,1001623440,1001623780,1001623840,1001623830,1001624350,1001625000,1001625670,1001625860,1001625920,1001625850,1002286800,1002286870,1001626610,1001626600,1001626210,1001625840,1002286440,1001625070,1001624940,1001624780,1001624330,1001624300,1001624240,1001624000,1001623570,1001623650,1001624200,1001624370,1001624400,1001624390,1001624860,1001625140,1001625830,1001626070,1001626130,1001626300,1002286990,1001627770,1001628520,1001628410,1001628060,1001627840,1001627440,1001627220,1001627210,1001627130,1001627180,1001627170,1002287180,1001627660,1001627750,1001627530,1001627620,1001627740,1001627730,1001627270,1001626960,1001626550,1001626440,1001626650,1001625650,1002286540,1001625570,1001625820,1001625260,1001624700,1001624270,1001623950,1001623300,1001622710,1001622030,1002284850,1001621710,1001621310,1001620260,1001619610,1001619580,1001619740,1001619960,1001620470,1001621100,1002284780,1001621800,1001621910,1001622740,1001624050,1001624120,1001624580,1000015850],"up":[1002291880,1002291800,1001638750,1001638700,1001639270,1001640020,1002292270,1001639970,1001640700,1001640750,1001639230,1001638880,1002291840,1001638840,1001638260,1001638270,1001638280,1001638310,1001638470,1002291680,1002291770,1001639770,1002292220,1001639730,1001638390,1001638090,1002291390,1002291500,1002291630,1001638080,1001637380,1001637190,1001635890,1001635940,1001637210,1002290870,1001637390,1001636800,1002290710,1002290480,1002290200,1001636910,1001637100,1001636600,1001636560,1002290920,1002290910,1001636770,1001636710,1001636110,1002290820,1002290780,1002290650,1002290530,1002290340,1001636080,1001635850,1001635190,1001634520,1001634490,1001634020,1002289960,1001633560,1001633470,1001633420,1001633530,1001632810,1001632780,1001632700,1002289420,1002289670,1002289460,1001632650,1001632760,1002289090,1002288830,1002288710,1001630940,1001631120,1002288870,1001631050,1001630660,1001630620,1002287970,1001630610,1001629550,1001629450,1001630750,1001630700,1001630770,1001631290,1002288910,1001631270,1002288550,1001630870,1001630270,1001630320,1002287800,1002287510,1002287120,1001632800,1001632380,1001631850,1001631520,1002288480,1002288140,1002288030,1002287830,1002287700,1001631540,1001631360,1002288600,1002288180,1001631320,1002288190,1001629610,1001629540,1001628510,1002287270,1001628480,1002287090,1002286830,1001631860,1001632410,1001634050,1001635100,1001635900,1001636510,1002290580,1001636580,1001635380,1001635350,1001634800,1001634470,1002290060,1002289990,1002289870,1001634460,1001632930,1001632600,1001632610,1001632950,1001634790,1002290010,1001633320,1002289270,1001632130,1001631800,1001631840,1002288680,1002288540,1001632120,1001633350,1001637150,1002291100,1002291140,1001638660,1002291200,1001638740,1001637920,1001637910,1001637450,1001637090,1001637040,1001637460,1001636700,1001635640,1002290550,1001635010,1001634230,1001634240,1001634040,1002290000,1002289830,1001633180,1001633120,1002289180,1001634010,1002289720,1001635060,1001635620,1001636730,1002290630]};
