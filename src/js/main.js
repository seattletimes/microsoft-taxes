// require("./lib/social");
// require("./lib/ads");
// var track = require("./lib/tracking");

require("component-responsive-frame/child");
require("component-leaflet-map");
var dot = require("./lib/dot");

var template = dot.compile(require("./_infobox.html"));

var mapElement = document.querySelector("leaflet-map");
var L = mapElement.leaflet;
var map = mapElement.map;

var index = 0;

var prevCoords;
var regions = {};

var qsa = s => Array.prototype.slice.call(document.querySelectorAll(s));

var drawLine = function(location1, location2) {
  var pointA = new L.LatLng(location1[0],location1[1]);
  var pointB = new L.LatLng(location2[0],location2[1]);
  var pointList = [pointA, pointB];

  var polyline = new L.Polyline(pointList, {
    color: "#888",
    weight: 3,
    opacity: .8
  });

  return polyline;
};

["asia", "americas", "ema"].forEach(function(region) {
  var group = [];
  prevCoords = null;
  
  taxData[region].forEach(function(location) {
    var coords = [location.Lat, location.Lng];
    var marker = L.marker(coords, {
      icon: L.divIcon({
        className: region
      })
    });
    group.push(marker);

    if (prevCoords) {
      var line = drawLine(coords, prevCoords);
      group.push(line);
    }
    prevCoords = coords;
  });

  var featureGroup = L.featureGroup(group).addTo(map);
  regions[region] = featureGroup;
});

var setRegion = function(region) {
  for (var r in regions) {
    if (r == region) {
      regions[r].addTo(map);
      map.fitBounds(regions[r].getBounds());
    } else {
      map.removeLayer(regions[r])
    }
  }
  document.querySelector(".info-container").innerHTML = template(taxData[region][index]);
};

qsa(".button").forEach(function(button) {
  button.addEventListener("click", function(e) {
    setRegion(e.target.getAttribute("data-region"));
    var selected = qsa(".selected.button");
    if (selected) selected.forEach(function(b) {
      b.classList.remove("selected");
    });
    e.target.classList.add("selected");
  })
})

