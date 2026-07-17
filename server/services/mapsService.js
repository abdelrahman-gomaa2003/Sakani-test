import { config } from "../config.js";

const MAPS_BASE = "https://maps.googleapis.com/maps/api";

export async function geocodeAddress(address) {
  if (!config.googleMapsKey) {
    return { error: "Google Maps API key not configured" };
  }

  try {
    const query = encodeURIComponent(`${address}, Fayoum, Egypt`);
    const res = await fetch(
      `${MAPS_BASE}/geocode/json?address=${query}&key=${config.googleMapsKey}&language=ar`
    );
    const data = await res.json();

    if (data.status !== "OK" || !data.results?.length) {
      return { error: "Location not found" };
    }

    const result = data.results[0];
    return {
      latitude: result.geometry.location.lat,
      longitude: result.geometry.location.lng,
      formatted_address: result.formatted_address,
    };
  } catch (err) {
    return { error: err.message };
  }
}

export async function reverseGeocode(lat, lng) {
  if (!config.googleMapsKey) {
    return { error: "Google Maps API key not configured" };
  }

  try {
    const res = await fetch(
      `${MAPS_BASE}/geocode/json?latlng=${lat},${lng}&key=${config.googleMapsKey}&language=ar`
    );
    const data = await res.json();

    if (data.status !== "OK" || !data.results?.length) {
      return { error: "Address not found" };
    }

    return {
      formatted_address: data.results[0].formatted_address,
      components: data.results[0].address_components,
    };
  } catch (err) {
    return { error: err.message };
  }
}

export async function findNearbyPlaces(lat, lng, type = "apartment", radius = 5000) {
  if (!config.googleMapsKey) {
    return { error: "Google Maps API key not configured" };
  }

  try {
    const res = await fetch(
      `${MAPS_BASE}/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${config.googleMapsKey}`
    );
    const data = await res.json();

    if (data.status !== "OK") {
      return { results: [] };
    }

    return {
      results: data.results.map((r) => ({
        name: r.name,
        address: r.vicinity,
        location: r.geometry.location,
        rating: r.rating,
      })),
    };
  } catch (err) {
    return { error: err.message };
  }
}
