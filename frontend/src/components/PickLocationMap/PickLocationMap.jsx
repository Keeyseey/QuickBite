import React from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Import marker images for Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix default Leaflet marker
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Component to handle marker selection
const LocationMarker = ({ onLocationSelect, pinnedLocation }) => {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      onLocationSelect(lat, lng);
    },
  });

  // Only render marker if valid coordinates exist
  return pinnedLocation?.lat && pinnedLocation?.lng ? (
    <Marker
      position={[pinnedLocation.lat, pinnedLocation.lng]}
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const { lat, lng } = e.target.getLatLng();
          onLocationSelect(lat, lng);
        },
      }}
    />
  ) : null;
};

const PickLocationMap = ({
  initialPosition = [9.78712415, 125.494369721199],
  pinnedLocation,
  onLocationSelect,
}) => {
  const handleLocateMe = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported.");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        onLocationSelect(latitude, longitude);
      },
      () => alert("Unable to get your location."),
      { enableHighAccuracy: true }
    );
  };

  // Determine safe center coordinates
  const centerPosition =
    pinnedLocation?.lat && pinnedLocation?.lng
      ? [pinnedLocation.lat, pinnedLocation.lng]
      : initialPosition;

  return (
    <div style={{ position: 'relative' }}>
      <MapContainer
        center={centerPosition}
        zoom={15}
        style={{ height: '300px', width: '100%', marginBottom: '10px' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        <LocationMarker pinnedLocation={pinnedLocation} onLocationSelect={onLocationSelect} />
      </MapContainer>

      <button
        onClick={handleLocateMe}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          zIndex: 1000,
          padding: '6px 12px',
          backgroundColor: '#007bff',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        Locate Me
      </button>
    </div>
  );
};

export default PickLocationMap;
