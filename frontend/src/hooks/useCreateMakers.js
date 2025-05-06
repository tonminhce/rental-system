import { useEffect } from "react";
import goongJs from "@goongmaps/goong-js"; // Import GoongJS
import getPopupContent from "@/utils/getPopupContent";

export default function useCreateMarkers(mapInstance, markers = [], onMarkerClick = () => { }) {
  useEffect(() => {
    if (!mapInstance || !markers.length) return;

    const customMarkers = markers.map((property) => {
      let hovered = false;
      const popup = new goongJs.Popup({ 
        closeButton: false,
        className: 'custom-popup'
      }).setHTML(getPopupContent(property));
      
      const coordinates = property.coordinates.coordinates;
      const newCoordinates = coordinates[1] > 90 || coordinates[1] < -90 ? [coordinates[1], coordinates[0]] : coordinates;
      const marker = new goongJs.Marker().setPopup(popup).setLngLat(newCoordinates).addTo(mapInstance);
      const markerElement = marker.getElement();

      // Apply custom CSS to fix the popup styling
      popup.on('open', () => {
        const popupElement = popup.getElement();
        
        // Apply custom styling to ensure the popup has proper border
        const popupContent = popupElement.querySelector('.mapboxgl-popup-content');
        if (popupContent) {
          popupContent.style.padding = '0';
          popupContent.style.overflow = 'hidden';
          popupContent.style.borderRadius = '8px';
          popupContent.style.background = 'none';
          popupContent.style.boxShadow = 'none';
        }
        
        popupElement.addEventListener("mouseenter", () => (hovered = true));
        popupElement.addEventListener("mouseleave", () => {
          hovered = false;
          popup.remove();
        });
      });

      markerElement.addEventListener("click", () => {
        onMarkerClick(property);
      });
      markerElement.addEventListener("mouseenter", () => {
        hovered = true;
        popup.addTo(mapInstance);
      });
      markerElement.addEventListener("mouseleave", () => {
        hovered = false;
        setTimeout(() => hovered || popup.remove(), 500);
      });

      return marker;
    });

    return () => {
      customMarkers.forEach((marker) => marker.remove());
    };
  }, [mapInstance, markers]);
}
