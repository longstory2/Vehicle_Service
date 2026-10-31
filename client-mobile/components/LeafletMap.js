import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { HO_CHI_MINH_BOUNDS } from '../constants/serviceArea';

const LeafletMap = ({ location, technicianLocation = null, pickupLabel = 'Vị trí của bạn' }) => {
  const initialCoords = [10.8015, 106.6935];
  const initialZoom = 16;
  const mapBounds = [
    [HO_CHI_MINH_BOUNDS.south, HO_CHI_MINH_BOUNDS.west],
    [HO_CHI_MINH_BOUNDS.north, HO_CHI_MINH_BOUNDS.east],
  ];
  const webViewRef = useRef(null);
  const lastPickupLocationRef = useRef(null);
  const lastTechnicianLocationRef = useRef(null);
  const [isMapReady, setIsMapReady] = useState(false);

  // Chờ Leaflet khởi tạo xong rồi mới gửi tọa độ từ form sang WebView.
  useEffect(() => {
    if (!isMapReady) return;

    if (!location) {
      webViewRef.current?.injectJavaScript('window.clearPickupLocation(); true;');
      lastPickupLocationRef.current = null;
      return;
    }

    if (
      lastPickupLocationRef.current?.latitude === location.latitude &&
      lastPickupLocationRef.current?.longitude === location.longitude
    ) {
      return;
    }

    lastPickupLocationRef.current = location;
    webViewRef.current?.injectJavaScript(
      `window.showPickupLocation(${location.latitude}, ${location.longitude}, ${JSON.stringify(pickupLabel)}); true;`,
    );
  }, [isMapReady, location, pickupLabel]);

  useEffect(() => {
    if (!isMapReady) return;

    if (!technicianLocation) {
      webViewRef.current?.injectJavaScript('window.clearTechnicianLocation(); true;');
      lastTechnicianLocationRef.current = null;
      return;
    }

    if (
      lastTechnicianLocationRef.current?.latitude === technicianLocation.latitude &&
      lastTechnicianLocationRef.current?.longitude === technicianLocation.longitude
    ) {
      return;
    }

    lastTechnicianLocationRef.current = technicianLocation;
    webViewRef.current?.injectJavaScript(
      `window.showTechnicianLocation(${technicianLocation.latitude}, ${technicianLocation.longitude}); true;`,
    );
  }, [isMapReady, technicianLocation]);

  const handleWebViewMessage = (event) => {
    if (event.nativeEvent.data === 'leaflet-map-ready') {
      setIsMapReady(true);
    }
  };

  // Mã HTML/JS nhúng Leaflet và OpenStreetMap
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body, html, #map {
          width: 100%;
          height: 100%;
          margin: 0;
          padding: 0;
          overflow: hidden; /* Ẩn thanh thanh cuộn của trình duyệt */
        }
          .car-marker {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: 3px solid white;
  border-radius: 50%;
  background: #1976d2;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
  font-size: 25px;
  line-height: 1;
}
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        // 1. Khởi tạo map
        var map = L.map('map', {
          maxBounds: ${JSON.stringify(mapBounds)},
          maxBoundsViscosity: 1.0,
          minZoom: 10,
        }).setView([${initialCoords[0]}, ${initialCoords[1]}], ${initialZoom});

        // 2. Thêm layer bản đồ OpenStreetMap
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        var pickupMarker = null;
        var technicianMarker = null;
        var routeLayer = null;
        var routeRequestId = 0;
        var lastRouteRequestedAt = 0;

        var technicianIcon = L.divIcon({
          className: "",
          html: '<div class="car-marker">🚗</div>',
          iconSize: [44, 44],
          conAnchor: [22, 22],
          });

        window.showPickupLocation = function(latitude, longitude, label) {
          var coordinates = [latitude, longitude];
          if (pickupMarker) {
            pickupMarker.setLatLng(coordinates);
          } else {
            pickupMarker = L.marker(coordinates).addTo(map);
          }
          map.flyTo(coordinates, 16);
          pickupMarker.bindPopup(label).openPopup();
        };

        window.clearPickupLocation = function() {
          if (pickupMarker) {
            map.removeLayer(pickupMarker);
            pickupMarker = null;
          }
        };

       window.showTechnicianLocation = function(latitude, longitude) {
  var technicianCoords = [latitude, longitude];

  if (technicianMarker) {
    technicianMarker.setLatLng(technicianCoords);
  } else {
    technicianMarker = L.marker(technicianCoords, {
      icon: technicianIcon,
      zIndexOffset: 1000,
    }).addTo(map);

    technicianMarker.bindPopup("Vị trí kỹ thuật viên");
  }

  // Đơn chưa có điểm khách thì chỉ hiện marker xe.
  if (!pickupMarker) return;

  // GPS có thể cập nhật thường xuyên; giới hạn yêu cầu tuyến đường mỗi 15 giây.
  if (Date.now() - lastRouteRequestedAt < 15000) return;
  lastRouteRequestedAt = Date.now();

  var requestId = ++routeRequestId;
  var destination = pickupMarker.getLatLng();

  // OSRM nhận tọa độ theo thứ tự kinh độ, vĩ độ.
  var url =
    "https://router.project-osrm.org/route/v1/driving/" +
    longitude + "," + latitude + ";" +
    destination.lng + "," + destination.lat +
    "?overview=full&geometries=geojson";

  fetch(url)
    .then(function(response) {
      if (!response.ok) {
        throw new Error("Không lấy được tuyến đường: HTTP " + response.status);
      }
      return response.json();
    })
    .then(function(data) {
      // Bỏ kết quả cũ nếu đã có yêu cầu mới hơn.
      if (requestId !== routeRequestId) return;

      var route = data.routes && data.routes[0];
      if (!route) {
        throw new Error("Dịch vụ định tuyến không tìm thấy đường đi.");
      }

      if (routeLayer) {
        map.removeLayer(routeLayer);
      }

      routeLayer = L.geoJSON(route.geometry, {
        style: {
          color: "#2457e6",
          weight: 7,
          opacity: 0.9,
        },
      }).addTo(map);

      map.fitBounds(routeLayer.getBounds(), {
        padding: [40, 40],
        maxZoom: 16,
      });
    })
    .catch(function(error) {
      console.warn("Lỗi tải tuyến đường:", error);
    });
};

window.clearTechnicianLocation = function() {
  routeRequestId += 1;

  if (technicianMarker) {
    map.removeLayer(technicianMarker);
    technicianMarker = null;
  }

  if (routeLayer) {
    map.removeLayer(routeLayer);
    routeLayer = null;
  }

  lastRouteRequestedAt = 0;
};

        window.ReactNativeWebView.postMessage('leaflet-map-ready');

      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onMessage={handleWebViewMessage}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },

});

export default LeafletMap;