// /assets/js/chat/chatRenderer.js

export function addMessage(role, contentItems) {
    const chatWindow = document.getElementById("chat-window");
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${role} fade-in`; // add fade-in for smooth appearance
  
    contentItems.forEach((item) => {
      if (item.type === "text") {
        const textSpan = document.createElement("span");
        textSpan.innerHTML = item.text;
  
        // If the text looks like an address, make it clickable
        if (/[\d]+,\s*[A-Za-z]+/.test(item.text)) {
          textSpan.classList.add("clickable-address");
          textSpan.style.cursor = "pointer";
          textSpan.title = "Click to open map";
          textSpan.addEventListener("click", () => {
            openMapModal(item.location, item.zoom || 12);
          });
        }
        messageDiv.appendChild(textSpan);
      } else if (item.type === "map") {
        // Create a container for the map with a loading spinner overlay
        const mapContainer = document.createElement("div");
        mapContainer.style.position = "relative";
        mapContainer.style.height = "300px";
        mapContainer.style.width = "100%";
  
        // Spinner element
        const spinner = document.createElement("div");
        spinner.className = "spinner";
        spinner.style.position = "absolute";
        spinner.style.top = "50%";
        spinner.style.left = "50%";
        spinner.style.transform = "translate(-50%, -50%)";
        mapContainer.appendChild(spinner);
  
        messageDiv.appendChild(mapContainer);
  
        // Lazy load Google Maps API if not already loaded
        if (typeof google === "undefined" || !google.maps) {
          loadGoogleMapsAPI()
            .then(() => {
              initializeMap(item, mapContainer, spinner);
            })
            .catch((err) => {
              console.error("Error loading Google Maps API:", err);
              mapContainer.innerHTML = "<p>Error loading map</p>";
            });
        } else {
          initializeMap(item, mapContainer, spinner);
        }
      }
    });
  
    chatWindow.appendChild(messageDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }
  
  function initializeMap(item, container, spinner) {
    const map = new google.maps.Map(container, {
      zoom: item.zoom || 12,
      center: item.location,
    });
    // Remove spinner once map is loaded
    spinner.remove();
  
    if (item.mapType === "location") {
      new google.maps.Marker({
        position: item.location,
        map: map,
      });
    } else if (item.mapType === "directions") {
      if (google.maps?.geometry?.encoding) {
        const path = google.maps.geometry.encoding.decodePath(item.polyline);
        const polyline = new google.maps.Polyline({
          path: path,
          geodesic: true,
          strokeColor: "#FF0000",
          strokeOpacity: 1.0,
          strokeWeight: 2,
        });
        polyline.setMap(map);
  
        if (item.bounds && item.bounds.northeast && item.bounds.southwest) {
          const bounds = new google.maps.LatLngBounds(
            item.bounds.southwest,
            item.bounds.northeast
          );
          map.fitBounds(bounds);
        }
      } else {
        console.error("Google Maps geometry library is not loaded.");
      }
    }
  }
  
  // Lazy-load the Google Maps API
  function loadGoogleMapsAPI() {
    return new Promise((resolve, reject) => {
      if (typeof google !== "undefined" && google.maps) {
        resolve();
      } else {
        const script = document.createElement("script");
        script.src =
          "https://maps.googleapis.com/maps/api/js?key=AIzaSyCYhgqMfTMImNQQjQb6gzHYtW1EODYPpEI&libraries=geometry";
        script.async = true;
        script.defer = true;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      }
    });
  }
  
  // Function to open a modal map view for clickable addresses
  function openMapModal(location, zoom) {
    let modal = document.getElementById("map-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "map-modal";
      modal.style.position = "fixed";
      modal.style.top = "0";
      modal.style.left = "0";
      modal.style.width = "100%";
      modal.style.height = "100%";
      modal.style.backgroundColor = "rgba(0,0,0,0.7)";
      modal.style.display = "flex";
      modal.style.justifyContent = "center";
      modal.style.alignItems = "center";
      modal.style.zIndex = "1000";
      modal.addEventListener("click", () => {
        modal.remove();
      });
      document.body.appendChild(modal);
    }
    modal.innerHTML = "";
    const mapDiv = document.createElement("div");
    mapDiv.style.width = "80%";
    mapDiv.style.height = "80%";
    mapDiv.style.boxShadow = "0 0 10px #000";
    modal.appendChild(mapDiv);
  
    const map = new google.maps.Map(mapDiv, {
      center: location,
      zoom: zoom || 12,
    });
    new google.maps.Marker({
      position: location,
      map: map,
    });
  }
  