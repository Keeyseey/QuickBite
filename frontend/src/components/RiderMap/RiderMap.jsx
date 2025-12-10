import React, { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const RiderMap = ({ location }) => {
  if (!location) return <div className="map-placeholder">Select a customer to locate</div>;

  // ⚡ Extract passed data
  const { lat, lng, userName, fullAddress, orderNumber, userId } = location;

  // ⚡ Prevent map from re-rendering infinitely
  const mapCenter = useMemo(() => [lat, lng], [lat, lng]);

  return (
    <MapContainer
      center={mapCenter}
      zoom={16}
      style={{ height: "420px", width: "100%", borderRadius: "12px" }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <Marker position={mapCenter}>
        <Popup>
          <strong>{userName || "Customer"}</strong> <br />

          {orderNumber && (
            <>
              <strong>Order #:</strong> {orderNumber} <br />
            </>
          )}

          {userId && (
            <>
              <strong>User ID:</strong> {userId} <br />
            </>
          )}

          <strong>Address:</strong> <br />
          {fullAddress || `${lat.toFixed(5)}, ${lng.toFixed(5)}`}
        </Popup>
      </Marker>
    </MapContainer>
  );
};

export default RiderMap;
