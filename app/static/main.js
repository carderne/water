/* global mapboxgl */

const get = document.getElementById.bind(document);
const queryAll = document.querySelectorAll.bind(document);

//prettier-ignore
// eslint-disable-next-line
const startIds={down:[1001630940,1002288710,1002288830,1002289090,1001632760,1001632810,1001633530,1002289960,1001634020,1001634490,1001635190,1001635850,1001636080,1001636710,1002290910,1002290920,1001636560,1001636600,1001637100,1001636910,1001637390,1001638080,1001638390,1001638310,1001638270,1001638840,1001639230,1001638700,1001638750,1002291800,1002291880,1001639790,1001639960,1001640000,1001640180,1001640270,1001640850,1002292420,1002292450,1001641290,1001641340,1001641510,1002292440,1001641150,1001641080,1001640840,1001640260,1001640310,1001640090,1001640250,1001640390,1002292140,1001641070,1001641200,1001641430,1001641450,1001640950,1002292410,1001640690,1001640620,1001640350,1001639860,1001639540,1002291690,1001638570,1001638560,1001638240,1001638150,1001637360,1001636930,1001636760,1001636250,1001636030,1002290540,1001634880,1001634710,1001634320,1001633700,1001633340,1001633600,1001633230,1001633160,1002289170,1002289120,1002289070,1002288810,1002288560,1001630910,1002288390,1001630110,1001629430,1001629420,1001630230,1002288420,1002288250,1001630210,1001630260,1001631180,1001631500,1001631900,1001632150,1002289330,1001633030,1002289450,1001633750,1001633680,1002289470,1001632720,1001632050,1001632270,1001631760,1002288890,1001631380,1001631100,1001630520,1001629710,1001629160,1001628740,1001628600,1001628130,1001627950,1001627290,1001627680,1001626820,1001626330,1001625450,1002286340,1001624550,1001623790,1001623220,1001623120,1001623060,1001623440,1001623780,1001623840,1001623830,1001624350,1001625000,1001625670,1001625860,1001625920,1001625850,1002286800,1002286870,1001626610,1001626600,1001626210,1001625840,1002286440,1001625070,1001624940,1001624780,1001624330,1001624300,1001624240,1001624000,1001623570,1001623650,1001624200,1001624370,1001624400,1001624390,1001624860,1001625140,1001625830,1001626070,1001626130,1001626300,1002286990,1001627770,1001628520,1001628410,1001628060,1001627840,1001627440,1001627220,1001627210,1001627130,1001627180,1001627170,1002287180,1001627660,1001627750,1001627530,1001627620,1001627740,1001627730,1001627270,1001626960,1001626550,1001626440,1001626650,1001625650,1002286540,1001625570,1001625820,1001625260,1001624700,1001624270,1001623950,1001623300,1001622710,1001622030,1002284850,1001621710,1001621310,1001620260,1001619610,1001619580,1001619740,1001619960,1001620470,1001621100,1002284780,1001621800,1001621910,1001622740,1001624050,1001624120,1001624580,1000015850],up:[1001630940,1001631120,1002288870,1001631050,1001630660,1001630620,1002287970,1001630610,1001629550,1001629450,1001630750,1001630700,1001630770,1001631290,1002288910,1001631270,1002288550]};
const startLngLat = [28.944, -29.325];
const MB_TOKEN =
  "pk.eyJ1IjoiY2FyZGVybmUiLCJhIjoiY2puMXN5cnBtNG53NDN2bnhlZ3h4b3RqcCJ9.eNjrtezXwvM7Ho1VSxo06w";
const MB_STYLE = "mapbox://styles/carderne/cki8lqpp99h9q19lrfvg1cy2g";
const CONN_LIM = 20;

mapboxgl.accessToken = MB_TOKEN;
let map = new mapboxgl.Map({
  container: "map",
  style: MB_STYLE,
  center: [25, -27],
  zoom: 4,
  minZoom: 3,
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
  map.on("click", "basins_transparent", runIfCan);
  map.getCanvas().style.cursor = "pointer";
  queryAll(".mapboxgl-marker").forEach((q) => (q.style.cursor = "pointer"));
}

function disableClick() {
  map.off("click", "basins_transparent", runIfCan);
  map.getCanvas().style.cursor = "wait";
  queryAll(".mapboxgl-marker").forEach((q) => (q.style.cursor = "wait"));
}

var marker = new mapboxgl.Marker({ scale: 0.7 }).setLngLat(startLngLat);

map.on("load", () => {
  disableClick();
  addToMap(startIds);
});

function runQuery(idd, lngLat, num_conn) {
  console.log("basin id:", idd);
  if (num_conn > CONN_LIM) {
    get("modal").style.display = "block";
  } else {
    marker.setLngLat(lngLat);
    disableClick();
    fetch(`api/${idd}/`)
      .then((response) => response.json())
      .then((basins) => addToMap(basins))
      .catch(() => enableClick());
  }
}

function addToMap(basins) {
  map.setFilter("basins_up", ["in", "HYBAS_ID"].concat(basins.up));
  map.setFilter("basins_down", ["in", "HYBAS_ID"].concat(basins.down));
  marker.addTo(map);
  setTimeout(() => enableClick(), 2000);
}

function runIfCan(e) {
  let idd = e.features[0].properties.HYBAS_ID;
  fetch("https://water.rdrn.me/ac")
    .then((res) => res.text())
    .then((num_conn) => {
      return runQuery(idd, e.lngLat, num_conn);
    });
}

get("exit").onclick = exitModal;
get("modal").onclick = exitModal;
function exitModal() {
  get("modal").style.display = "none";
}
