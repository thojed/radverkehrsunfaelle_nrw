// map marker styles
const markerHtmlStyles = `
  width: 0.8rem;
  height: 0.8rem;
  left: -0.4rem;
  top: -0.4rem;
  display: block;
  position: relative;
  transform: rotate(45deg);
  opacity: 1.0;
  border: 1px solid #000000`;
const markerHtmlStylesXL = `
  width: 1rem;
  height: 1rem;
  left: -0.5rem;
  top: -0.5rem;
  display: block;
  position: relative;
  transform: rotate(45deg);
  opacity: 1.0;
  border: 1px solid #000000`;

var iconTot = L.divIcon({
    className: "my-custom-pin",
    iconAnchor: [0, 0],
    labelAnchor: [-6, 0],
    popupAnchor: [0, -3],
    html: `<span style="${markerHtmlStylesXL};background-color: #1A1A1A;" />`
});
var iconSchwerVerletzt = L.divIcon({
    className: "my-custom-pin",
    iconAnchor: [0, 0],
    labelAnchor: [-6, 0],
    popupAnchor: [0, -3],
    html: `<span style="${markerHtmlStyles};background-color: #4169E1;" />`
});
var iconLeichtVerletzt = L.divIcon({
    className: "my-custom-pin",
    iconAnchor: [0, 0],
    labelAnchor: [-6, 0],
    popupAnchor: [0, -3],
    html: `<span style="${markerHtmlStyles};background-color: #9AC0CD;" />`
});

var markerClusters = L.markerClusterGroup({
    chunkedLoading: true,
    maxClusterRadius: 70,
    disableClusteringAtZoom: 12
});
const mapHeatProps = {
    radius: 12,
    blur: 7,
    maxZoom: 15,
    max: 1
};
const mapHeatPropsSmall = {
    radius: 30,
    blur: 30,
    maxZoom: 10,
    max: 1
};

// map
// https://www.terrestris.de/de/openstreetmap-wms/
var terrestrisWMS = L.tileLayer.wms('https://ows.terrestris.de/osm-gray/service?', {
    layers: 'OSM-WMS',
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
});

var map = L.map('map', {
    center: [
        51.4000, 7.6000 // NRW
    ],
    zoom: 7,
    layers: [terrestrisWMS]
});

d3.json("src/nrw_umriss.geojson").then(aGeoJSON => {
    var myStyle = {
        color: "#444444",
        weight: 2,
        fillOpacity: 0
    };
    L.geoJSON(aGeoJSON, {
        style: myStyle
    }).addTo(map);
});

function buildCharts() {
    // d3.dsv(";", "/data").then(csvData => {
    d3.dsv(";", "src/radunfaelleNRW2020.csv").then(function (csvData) {

        csvData.forEach(function (d) {
            var v = +d["UKATEGORIE"];
            d["UKATEGORIE"] = (v == 1) ? 'Unfall mit Getöteten' :
                (v == 2) ? 'Unfall mit Schwerverletzten' :
                (v == 3) ? 'Unfall mit Leichtverletzten' : 'unbekannt';

            v = +d["UART"];
            d["UART"] = (v == 0) ? 'Unfall anderer Art' :
                (v <= 5) ? 'Zusammenstoß mit anderem Fahrzeug' :
                (v == 6) ? 'Zusammenstoß mit Fußgänger' :
                (v == 7) ? 'Aufprall auf Fahrbahnhindernis' :
                (v >= 8) ? 'Abkommen von Fahrbahn' : 'unbekannt';
                
            v = +d["ULICHTVERH"];
            d["ULICHTVERH"] = (v == 0) ? 'Tageslicht' :
                (v == 1) ? 'Dämmerung' :
                (v == 2) ? 'Dunkelheit' :
                'unbekannt';
             
            v = +d["STRZUSTAND"];
            d["STRZUSTAND"] = (v == 0) ? 'trocken' :
                (v == 1) ? 'nass/feucht' :
                (v == 2) ? 'winterglatt' :
                'unbekannt';
        })
        var dataLength = csvData.length;

        // crossfilter
        var ndx = crossfilter(csvData);

        // dimensions
        var katDim = ndx.dimension(function (d) {
            return d["UKATEGORIE"];
        });
        var uartDim = ndx.dimension(function (d) {
            return d["UART"];
        });
        var lichtDim = ndx.dimension(function (d) {
            return d["ULICHTVERH"];
        });
        var strzustDim = ndx.dimension(function (d) {
            return d["STRZUSTAND"];
        });
        var kreiseDim = ndx.dimension(function (d) {
            return d["GEN_K"];
        });
        var allDim = ndx.dimension(function (d) { return d; });

        // group data
        var all = ndx.groupAll();
        var katGroup = katDim.group();
        var uartGroup = uartDim.group();
        var lichtGroup = lichtDim.group();
        var strzustGroup = strzustDim.group();
        var kreiseGroup = kreiseDim.group();

        // dc charts
        var chartKategorie = dc.rowChart('#chart-kategorie');
        var chartUart = dc.rowChart('#chart-uart');
        var chartLicht = dc.rowChart('#chart-licht');
        var chartStrzust = dc.rowChart('#chart-strzust');
        var selectKreise = dc.cboxMenu('#select-kreise');

        chartKategorie
            .dimension(katDim)
            .group(katGroup)
            .width(300)
            .height(100)
            .label(function (d) {
                return d.key + " (" + d.value + ")";
            })
            .ordering(function (d) { return -d.value})
            .xAxis().ticks(4);
        
        chartUart
            .dimension(uartDim)
            .group(uartGroup)
            .width(300)
            .height(140)
            .label(function (d) {
                return d.key + " (" + d.value + ")";
            })
            .ordering(function (d) { return -d.value})
            .xAxis().ticks(4);

        chartLicht
            .dimension(lichtDim)
            .group(lichtGroup)
            .width(300)
            .height(120)
            .elasticX(true)
            .label(function (d) {
                return d.key + " (" + d.value + ")";
            })
            .ordering(function (d) { return -d.value})
            .xAxis().ticks(4);

        chartStrzust
            .dimension(strzustDim)
            .group(strzustGroup)
            .width(300)
            .height(120)
            .elasticX(true)
            .label(function (d) {
                return d.key + " (" + d.value + ")";
            })
            .ordering(function (d) { return -d.value})
            .xAxis().ticks(4);

        selectKreise
            .dimension(kreiseDim)
            .group(kreiseGroup)
            .multiple(true)
            .controlsUseVisibility(true);        

        var mapHeatLayer;
        var drawMapPoints = function () {
            markerClusters.clearLayers();
            var heatPoints = [];

            _.each(allDim.top(Infinity), function (d) {
                var popup = `<p><b><u>Radverkehrsunfall 2019</u></b><br>
                                <b>Kreis oder kreisfreie Stadt:</b> ${d.GEN_K}<br>
                                <b>Unfallkategorie:</b> ${d.UKATEGORIE}<br>
                                <b>Unfallart:</b> ${d.UART}<br>
                                <b>Lichtverhältnisse:</b> ${d.ULICHTVERH}<br>
                                <b>Strassenzustand:</b> ${d.STRZUSTAND}</p>`;
                var marker = L.marker([d.YGCSWGS84, d.XGCSWGS84],).bindPopup(popup);
                switch(d.UKATEGORIE) {
                    case 1:
                        marker.setIcon(iconTot);
                        break;
                    case 2:
                        marker.setIcon(iconSchwerVerletzt);
                        break;
                    default:
                        marker.setIcon(iconLeichtVerletzt);
                }
                markerClusters.addLayer( marker );
                heatPoints.push([d.YGCSWGS84, d.XGCSWGS84]);
            });
            map.addLayer( markerClusters );

            mapHeatLayer = L.heatLayer(heatPoints, 
                (heatPoints.length > 200) ? mapHeatProps : mapHeatPropsSmall);
            map.addLayer(mapHeatLayer);
        }
        drawMapPoints();

        var dcCharts = [chartKategorie, chartUart, chartLicht, chartStrzust, selectKreise];

        _.each(dcCharts, function (dcChart) {
            dcChart.on("filtered", function (chart, filter) {
                map.eachLayer(function (layer) {
                    if (("_url" in layer) == false) {
                        map.removeLayer(layer);
                    }
                }); 
                drawMapPoints();
            });
        });

        map.on('zoom', function (e) {

        });

        // reset buttons
        d3.selectAll('a#resetAll').on('click', function () {
            dc.filterAll();
            dc.renderAll();
        });
        d3.selectAll('a#reset-kategorie').on('click', function () {
            chartKategorie.filterAll();
            dc.redrawAll();
        });
        d3.selectAll('a#reset-uart').on('click', function () {
            chartUart.filterAll();
            dc.redrawAll();
        });
        d3.selectAll('a#reset-licht').on('click', function () {
            chartLicht.filterAll();
            dc.redrawAll();
        });
        d3.selectAll('a#reset-strzust').on('click', function () {
            chartStrzust.filterAll();
            dc.redrawAll();
        });
        

        dc.renderAll();
        
    });
};

buildCharts();

