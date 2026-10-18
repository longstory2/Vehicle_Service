import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

const LeafletMap = ({ location }) => {
    const initialCoords = [10.8015, 106.6935];
    const initialZoom = 16;
    const webViewRef = useRef(null);
    const [isMapReady, setIsMapReady] = useState(false);

    // Chờ Leaflet khởi tạo xong rồi mới gửi tọa độ từ form sang WebView.
    useEffect(() => {
        if (!isMapReady) return;

        if (!location) {
            webViewRef.current?.injectJavaScript('window.clearPickupLocation(); true;');
            return;
        }

        webViewRef.current?.injectJavaScript(
            `window.showPickupLocation(${location.latitude}, ${location.longitude}); true;`,
        );
    }, [isMapReady, location]);

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
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        // 1. Khởi tạo map
        var map = L.map('map').setView([${initialCoords[0]}, ${initialCoords[1]}], ${initialZoom});

        // 2. Thêm layer bản đồ OpenStreetMap
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        var pickupMarker = null;
        window.showPickupLocation = function(latitude, longitude) {
          var coordinates = [latitude, longitude];
          if (pickupMarker) {
            pickupMarker.setLatLng(coordinates);
          } else {
            pickupMarker = L.marker(coordinates).addTo(map);
          }
          map.flyTo(coordinates, 16);
          pickupMarker.bindPopup('Vị trí của bạn').openPopup();
        };

        window.clearPickupLocation = function() {
          if (pickupMarker) {
            map.removeLayer(pickupMarker);
            pickupMarker = null;
          }
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