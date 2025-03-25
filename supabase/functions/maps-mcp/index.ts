import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// Base URL for Google Maps APIs
const BASE_URL = "https://maps.googleapis.com/maps/api";

// --- Helper functions for each tool ---

// 1. Geocoding: Convert an address to coordinates.
async function geocode(address: string, apiKey: string) {
  const url = `${BASE_URL}/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Geocoding failed: ${response.statusText}`);
  const data = await response.json();
  if (data.status !== "OK" || data.results.length === 0) throw new Error(`Geocoding error: ${data.status}`);
  const result = data.results[0];
  return {
    location: result.geometry.location,
    formatted_address: result.formatted_address,
    place_id: result.place_id
  };
}

// 2. Reverse Geocoding: Convert coordinates to an address.
async function reverseGeocode(latitude: number, longitude: number, apiKey: string) {
  const url = `${BASE_URL}/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Reverse geocoding failed: ${response.statusText}`);
  const data = await response.json();
  if (data.status !== "OK" || data.results.length === 0) throw new Error(`Reverse geocoding error: ${data.status}`);
  const result = data.results[0];
  return {
    formatted_address: result.formatted_address,
    place_id: result.place_id,
    address_components: result.address_components
  };
}

// 3. Search Places: Text search for places.
async function searchPlaces(query: string, location: { latitude: number; longitude: number } | undefined, radius: number | undefined, apiKey: string) {
  let url = `${BASE_URL}/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;
  if (location) url += `&location=${location.latitude},${location.longitude}`;
  if (radius) url += `&radius=${radius}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Place search failed: ${response.statusText}`);
  const data = await response.json();
  if (data.status !== "OK") throw new Error(`Place search error: ${data.status}`);
  return data.results.map((place: any) => ({
    name: place.name,
    address: place.formatted_address,
    location: place.geometry.location,
    place_id: place.place_id
  }));
}

// 4. Place Details: Get detailed info about a place.
async function getPlaceDetails(place_id: string, apiKey: string) {
  const url = `${BASE_URL}/place/details/json?place_id=${place_id}&key=${apiKey}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Place details failed: ${response.statusText}`);
  const data = await response.json();
  if (data.status !== "OK") throw new Error(`Place details error: ${data.status}`);
  const place = data.result;
  return {
    name: place.name,
    address: place.formatted_address,
    phone: place.international_phone_number,
    website: place.website,
    rating: place.rating,
    reviews: place.reviews,
    opening_hours: place.opening_hours
  };
}

// 5. Distance Matrix: Calculate distances and times.
async function getDistanceMatrix(origins: string[], destinations: string[], mode: string | undefined, apiKey: string) {
  const originsParam = origins.join("|");
  const destinationsParam = destinations.join("|");
  let url = `${BASE_URL}/distancematrix/json?origins=${encodeURIComponent(originsParam)}&destinations=${encodeURIComponent(destinationsParam)}&key=${apiKey}`;
  if (mode) url += `&mode=${mode}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Distance matrix failed: ${response.statusText}`);
  const data = await response.json();
  if (data.status !== "OK") throw new Error(`Distance matrix error: ${data.status}`);
  return data.rows.map((row: any) => row.elements.map((element: any) => ({
    distance: element.distance,
    duration: element.duration
  })));
}

// 6. Elevation: Get elevation data.
async function getElevation(locations: { latitude: number; longitude: number }[], apiKey: string) {
  const locationsParam = locations.map(loc => `${loc.latitude},${loc.longitude}`).join("|");
  const url = `${BASE_URL}/elevation/json?locations=${encodeURIComponent(locationsParam)}&key=${apiKey}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Elevation failed: ${response.statusText}`);
  const data = await response.json();
  if (data.status !== "OK") throw new Error(`Elevation error: ${data.status}`);
  return data.results.map((result: any) => result.elevation);
}

// 7. Directions: Get route details.
async function getDirections(origin: string, destination: string, mode: string | undefined, apiKey: string) {
  let url = `${BASE_URL}/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&key=${apiKey}`;
  if (mode) url += `&mode=${mode}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Directions failed: ${response.statusText}`);
  const data = await response.json();
  if (data.status !== "OK" || data.routes.length === 0) throw new Error(`Directions error: ${data.status}`);
  const route = data.routes[0];
  // Return key information including the overview_polyline and bounds.
  return {
    distance: route.legs[0].distance,
    duration: route.legs[0].duration,
    steps: route.legs[0].steps.map((step: any) => step.html_instructions),
    polyline: route.overview_polyline.points,
    bounds: route.bounds // bounds contains northeast and southwest
  };
}

// --- Main function handler ---

serve(async (req) => {
  const url = new URL(req.url);
  const basePath = "/functions/v1/maps-mcp";

  // Optional SSE endpoint for MCP connectivity
  if (url.pathname === `${basePath}/sse`) {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue("data: maps-mcp connected\n\n");
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } 
  // Handle messages (POST requests)
  else if (url.pathname === `${basePath}/messages` && req.method === "POST") {
    try {
      const body = await req.json();
      const { tool, args } = body;
      const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
      if (!apiKey) throw new Error("API key not configured");

      // Prepare structured response content (multiple content items possible)
      let content = [];

      switch (tool) {
        case "maps_geocode": {
          const result = await geocode(args.address, apiKey);
          content.push({
            type: "text",
            text: `Geocoding for "${args.address}":\nCoordinates: ${result.location.lat}, ${result.location.lng}\nAddress: ${result.formatted_address}`
          });
          content.push({
            type: "map",
            mapType: "location",
            location: result.location,
            zoom: 12
          });
          break;
        }
        case "maps_reverse_geocode": {
          const result = await reverseGeocode(args.latitude, args.longitude, apiKey);
          content.push({
            type: "text",
            text: `Reverse Geocoding for (${args.latitude}, ${args.longitude}):\nAddress: ${result.formatted_address}`
          });
          content.push({
            type: "map",
            mapType: "location",
            location: { lat: args.latitude, lng: args.longitude },
            zoom: 12
          });
          break;
        }
        case "maps_search_places": {
          const results = await searchPlaces(args.query, args.location, args.radius, apiKey);
          let text = `Places search for "${args.query}":\n`;
          results.forEach((place: any, index: number) => {
            text += `${index + 1}. ${place.name} - ${place.address}\n`;
          });
          content.push({
            type: "text",
            text: text
          });
          // Optionally, you could add a map with markers for each place.
          break;
        }
        case "maps_place_details": {
          const result = await getPlaceDetails(args.place_id, apiKey);
          content.push({
            type: "text",
            text: `Details for place ID ${args.place_id}:\nName: ${result.name}\nAddress: ${result.address}\nPhone: ${result.phone}\nWebsite: ${result.website}\nRating: ${result.rating}`
          });
          break;
        }
        case "maps_distance_matrix": {
          const matrix = await getDistanceMatrix(args.origins, args.destinations, args.mode, apiKey);
          let text = "Distance Matrix Results:\n";
          matrix.forEach((row: any, i: number) => {
            row.forEach((elem: any, j: number) => {
              text += `From "${args.origins[i]}" to "${args.destinations[j]}": ${elem.distance.text} (${elem.duration.text})\n`;
            });
          });
          content.push({
            type: "text",
            text: text
          });
          break;
        }
        case "maps_elevation": {
          const elevations = await getElevation(args.locations, apiKey);
          let text = "Elevation Results (in meters):\n";
          elevations.forEach((elev: number, i: number) => {
            text += `Location ${i + 1}: ${elev}\n`;
          });
          content.push({
            type: "text",
            text: text
          });
          break;
        }
        case "maps_directions": {
          const result = await getDirections(args.origin, args.destination, args.mode, apiKey);
          const stepsText = result.steps.map((step: string, index: number) => `${index + 1}. ${step}`).join('\n');
          content.push({
            type: "text",
            text: `Directions from "${args.origin}" to "${args.destination}":\nDistance: ${result.distance.text}, Duration: ${result.duration.text}\nSteps:\n${stepsText}`
          });
          content.push({
            type: "map",
            mapType: "directions",
            polyline: result.polyline,
            bounds: result.bounds
          });
          break;
        }
        default:
          return new Response(
            JSON.stringify({ error: "Tool not found" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
      }

      return new Response(JSON.stringify({ content }), {
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }
  return new Response("Not Found", { status: 404 });
});
