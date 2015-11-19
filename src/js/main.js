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

var region;
var index = 0;

var prevCoords;
var regions = {};
var markers = {};

var qsa = s => Array.prototype.slice.call(document.querySelectorAll(s));

var infoBox = document.querySelector(".info-container");

var findMin = function(val1, val2) {
  return val1 < val2 ? val1 : val2;
};
var findMax = function(val1, val2) {
  return val1 > val2 ? val1 : val2;
};

infoBox.addEventListener("click", function(e) {
  var parent = e.target.parentElement.parentElement;

  if (parent.classList.contains("previous")) {
    index -= 1;
  }
  if (parent.classList.contains("next")) {
    index += 1;
  }
  infoBox.innerHTML = template(taxData[region][index]);

  var first = markers[region][index - 1];
  var second = markers[region][index];
  var firstCoords = first.getLatLng();
  var secondCoords = second.getLatLng();
  var southWest = [ 
    findMin(firstCoords.lat, secondCoords.lat),
    findMin(firstCoords.lng, secondCoords.lng)
  ];
  var northEast = [ 
    findMax(firstCoords.lat, secondCoords.lat),
    findMax(firstCoords.lng, secondCoords.lng)
  ];
  map.fitBounds([southWest,northEast], {padding: [10,10]});
});

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
  if (!markers[region]) markers[region] = [];

  prevCoords = null;
  
  taxData[region].forEach(function(location) {
    var coords = [location.Lat, location.Lng];
    var marker = L.marker(coords, {
      icon: L.divIcon({
        className: region
      })
    });
    group.push(marker);
    markers[region].push(marker);

    if (prevCoords) {
      var line = drawLine(coords, prevCoords);
      group.push(line);
    }
    prevCoords = coords;
  });

  var featureGroup = L.featureGroup(group).addTo(map);
  regions[region] = featureGroup;
});

var setRegion = function() {
  for (var r in regions) {
    if (r == region) {
      regions[r].addTo(map);
      map.fitBounds(regions[r].getBounds(), {padding: [10,10]});
    } else {
      map.removeLayer(regions[r])
    }
  }
  infoBox.innerHTML = template(taxData[region][index]);
};

qsa(".button").forEach(function(button) {
  button.addEventListener("click", function(e) {
    index = 0;
    region = e.target.getAttribute("data-region")
    setRegion();
    var selected = qsa(".selected.button");
    if (selected) selected.forEach(function(b) {
      b.classList.remove("selected");
    });
    e.target.classList.add("selected");
  })
})

