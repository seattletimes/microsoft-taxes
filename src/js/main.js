// require("./lib/social");
// require("./lib/ads");
// var track = require("./lib/tracking");

require("component-responsive-frame/child");
require("component-leaflet-map");

var mapElement = document.querySelector("leaflet-map");
var L = mapElement.leaflet;
var map = mapElement.map;

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
      icon: L.divIcon()
    });
    group.push(marker);

    if (prevCoords) {
      var line = drawLine(coords, prevCoords);
      group.push(line);
    }
    prevCoords = coords;
  });
  regions[region] = L.featureGroup(group);
});

var setRegion = function(region) {
  for (var r in regions) {
    if (r == region) {
      regions[r].addTo(map);
    } else {
      map.removeLayer(regions[r]);
    }
  }
};

qsa(".button").forEach(function(button) {
  button.addEventListener("click", function(e) {
    setRegion(e.target.getAttribute("data-region"));
  })
})

setRegion("asia");
