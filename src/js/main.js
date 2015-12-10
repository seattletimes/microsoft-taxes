// require("./lib/social");
// require("./lib/ads");
// var track = require("./lib/tracking");

require("component-responsive-frame/child");
require("component-leaflet-map");
var $ = require("jquery");
var dot = require("./lib/dot");

var template = dot.compile(require("./_infobox.html"));

var mapElement = document.querySelector("leaflet-map");
var L = mapElement.leaflet;
var map = mapElement.map;

L.tileLayer('./assets/tiles/{z}/{x}/{y}.png', {
  maxZoom: 6,
  minZoom: 1
}).addTo(map);

//get rid of the default layer
map.removeLayer(mapElement.lookup.tiles);

var layers = {};
var zones = ["americas", "ema", "asia"];

var region;
var index = 0;
var prevIndex = -1;

var prevCoords;
var regions = {};
var markers = {};
var arrows = {};
var layers = {};

//IE really doesn't handle our geoJSON very well...
if (!window.navigator.userAgent.match(/trident|edge/i)) {

  var requests = zones.map(u => $.ajax({
    url: `./assets/${u}.geojson`,
    dataType: "json"
  }));

  $.when.apply($, requests).then(function(a, e, as) {
    var americaLayer = a[0];
    var emaLayer = e[0];
    var asiaLayer = as[0];

    layers.americas = L.geoJson(americaLayer, {
      style: {
        fillColor: "#EC5519",
        weight: 0,
        fillOpacity: 0.35
      }
    }).addTo(map);
    layers.ema = L.geoJson(emaLayer, {
      style: {
        fillColor: "#717400",
        weight: 0,
        fillOpacity: 0.35
      }
    }).addTo(map);
    layers.asia = L.geoJson(asiaLayer, {
      style: {
        fillColor: "#DC8505",
        weight: 0,
        fillOpacity: 0.35
      }
    }).addTo(map);
  })
}

var qsa = s => Array.prototype.slice.call(document.querySelectorAll(s));

var infoBox = document.querySelector(".info-container");

infoBox.addEventListener("click", function(e) {

  var parent = e.target.parentElement;

  if (parent.classList.contains("previous") && index > 0) {
    prevIndex = index;
    index -= 1;
    infoBox.innerHTML = template(taxData[region][index]);
    document.querySelector(".disabled.arrow").classList.remove("disabled");
    if (index == 0) document.querySelector(".previous.arrow").classList.add("disabled");
  }
  if (parent.classList.contains("next") && index < (taxData[region].length - 1)) {
    prevIndex = index;
    index += 1;
    infoBox.innerHTML = template(taxData[region][index]);
    document.querySelector(".disabled.arrow").classList.remove("disabled");
    if (index == (taxData[region].length - 1)) document.querySelector(".next.arrow").classList.add("disabled");
  }

  zoomMap();
  
  markers[region].forEach(function(marker) {
    marker._icon.classList.remove("highlighted");
  });
  markers[region][index]._icon.classList.add("highlighted");
});

var findMin = function(val1, val2) {
  return val1 < val2 ? val1 : val2;
};
var findMax = function(val1, val2) {
  return val1 > val2 ? val1 : val2;
};

var zoomMap = function() {
  if (index > prevIndex) {
    var first = markers[region][index - 1];
    var second = markers[region][index];
  } else {
    var first = markers[region][index];
    var second = markers[region][index + 1];
  }

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
};

var drawLine = function(location1, location2, region) {
  var segments = 30;

  var pointList = [];

  var x1 = location1[1] * 1;
  var y1 = location1[0] * 1;
  var x2 = location2[1] * 1;
  var y2 = location2[0] * 1;

  var dx = (x1 - x2) / segments;
  var dy = (y1 - y2) / segments;
  var length = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));

  for (var i = 0; i < segments + 1; i++) { 
    if (dx < 0) {
      var lat = y1 - (dy * i) + Math.sin(Math.PI / segments * i) * length * 5;
      var lng = x1 - (dx * i) + Math.sin(Math.PI / segments * i) * length * 5;
    } else {
      var lat = y1 - (dy * i) - Math.sin(Math.PI / segments * i) * length * 5;
      var lng = x1 - (dx * i) - Math.sin(Math.PI / segments * i) * length * 5;
    }

    var coords = new L.LatLng(lat, lng);
    var prevLat;
    var prevLng;

    if (i == 6) {
      prevLat = lat;
      prevLng = lng;
    } else if (i == 7) {
      var y = lat - prevLat;
      var x = lng - prevLng;
      var rotation = Math.atan(y / x) + (Math.PI / 4);
      if (x < 1) rotation += Math.PI;
      var arrow = L.marker(coords, {
        icon: L.divIcon({
          html: "<div class='arrowhead' style='transform: rotateZ(-" + rotation + "rad);'></div>"
        })
      }).addTo(map);
      arrows[region].push(arrow);
    }

    pointList.push(coords);
  }

  var polyline = new L.Polyline(pointList, {
    color: "#888",
    weight: 3,
    opacity: .8
  });

  return polyline;
};

zones.forEach(function(region) {
  var group = [];
  if (!markers[region]) markers[region] = [];
  if (!arrows[region]) arrows[region] = [];

  prevCoords = null;
  
  taxData[region].forEach(function(location) {
    var coords = [location.Lat, location.Lng];
    var marker = L.marker(coords, {
      icon: L.divIcon({
        className: "dot " + region + " index-" + location.Order,
        html: "<div class='div-label'>" + location.Order + "</div>"
      })
    });
    group.push(marker);
    markers[region].push(marker);

    if (prevCoords) {
      var line = drawLine(coords, prevCoords, region);
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
  for (var r in arrows) {
    if (r == region) {
      arrows[r].forEach(function(a) {
        a.addTo(map);
      });
    } else {
      arrows[r].forEach(function(a) {
        map.removeLayer(a);
      });
    }
  }
  markers[region][index]._icon.classList.add("highlighted");
  infoBox.innerHTML = template(taxData[region][index]);
};

qsa(".button").forEach(function(button) {
  button.addEventListener("click", function(e) {
    index = 0;
    region = e.target.getAttribute("data-region");
    document.querySelector(".outer").className = "outer";
    document.querySelector(".outer").classList.add(region);
    setRegion();
    var selected = qsa(".selected.button");
    if (selected) selected.forEach(function(b) {
      b.classList.remove("selected");
    });
    e.target.classList.add("selected");

    ["asia", "americas", "ema"].forEach(function(r) {
      var layer = layers[r];
      if (!layer) return;
      if (r == region) {
        layer.addTo(map);
      } else {
        map.removeLayer(layer)
      }
    });
  })
})

