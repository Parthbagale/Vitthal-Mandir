/* Bhakta Nivas Map with Distance Markers */

// Vitthal Mandir coordinates (Pandharpur)
const VITTHAL_MANDIR = {
    lat: 17.6796875,
    lng: 75.3203125,
    name: "Shri Vitthal Rukmini Mandir"
};

// Bhakta Nivas locations (sample data - update with actual coordinates)
const BHAKTA_NIVAS_LOCATIONS = [
    {
        id: 1,
        name: "Bhakta Nivas - Main Building",
        lat: 17.6806875,
        lng: 75.3213125,
        capacity: "50 rooms",
        facilities: "AC, Non-AC, Dining Hall"
    },
    {
        id: 2,
        name: "Bhakta Nivas - Annexe Building",
        lat: 17.6786875,
        lng: 75.3193125,
        capacity: "30 rooms",
        facilities: "Non-AC, Common Kitchen"
    }
];

let map;
let markers = [];
let directionsService;
let directionsRenderer;
let userLocationMarker = null;
let userLocation = null;

// Initialize map when page loads
function initBhaktaNivasMap() {
    // Initialize Google Maps services
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        suppressMarkers: true,
        polylineOptions: {
            strokeColor: '#FF7A00',
            strokeWeight: 3
        }
    });

    // Create map centered on Vitthal Mandir
    map = new google.maps.Map(document.getElementById('bhakta-nivas-map'), {
        center: VITTHAL_MANDIR,
        zoom: 15,
        mapTypeId: 'roadmap',
        styles: [
            {
                featureType: 'poi.place_of_worship',
                elementType: 'labels',
                stylers: [{ visibility: 'on' }]
            }
        ]
    });

    directionsRenderer.setMap(map);

    // Get user's current location
    getUserLocation();

    // Add Vitthal Mandir marker
    addMandirMarker();

    // Add Bhakta Nivas markers
    addBhaktaNivasMarkers();

    // Create distance info panel
    createDistancePanel();
}

// Get user's current location
function getUserLocation() {
    if (navigator.geolocation) {
        // Show loading message
        showLocationMessage('Getting your location...', 'info');
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                // Add user location marker
                addUserLocationMarker();
                
                showLocationMessage('Location found! Click any Bhakta Nivas to see route from your location.', 'success');
                
                // Auto-hide message after 5 seconds
                setTimeout(() => {
                    hideLocationMessage();
                }, 5000);
            },
            (error) => {
                console.error('Geolocation error:', error);
                let errorMsg = 'Unable to get your location. ';
                
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMsg += 'Please allow location access in your browser.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMsg += 'Location information unavailable.';
                        break;
                    case error.TIMEOUT:
                        errorMsg += 'Location request timed out.';
                        break;
                    default:
                        errorMsg += 'An unknown error occurred.';
                }
                
                showLocationMessage(errorMsg, 'warning');
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    } else {
        showLocationMessage('Geolocation is not supported by your browser.', 'warning');
    }
}

// Add user location marker
function addUserLocationMarker() {
    if (!userLocation) return;
    
    const userIcon = {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30">
                <circle cx="15" cy="15" r="14" fill="#2196F3" stroke="white" stroke-width="2"/>
                <circle cx="15" cy="15" r="6" fill="white"/>
                <circle cx="15" cy="15" r="3" fill="#2196F3"/>
            </svg>
        `),
        scaledSize: new google.maps.Size(30, 30),
        anchor: new google.maps.Point(15, 15)
    };
    
    userLocationMarker = new google.maps.Marker({
        position: userLocation,
        map: map,
        icon: userIcon,
        title: 'Your Location',
        animation: google.maps.Animation.DROP,
        zIndex: 1000
    });
    
    const infoWindow = new google.maps.InfoWindow({
        content: `
            <div style="padding: 10px; max-width: 200px;">
                <h3 style="color: #2196F3; margin: 0 0 8px 0; font-size: 15px;">
                    📍 Your Current Location
                </h3>
                <p style="margin: 0; color: #666; font-size: 13px;">
                    Click any Bhakta Nivas marker to see route from here
                </p>
            </div>
        `
    });
    
    userLocationMarker.addListener('click', () => {
        infoWindow.open(map, userLocationMarker);
    });
    
    // Add accuracy circle
    new google.maps.Circle({
        map: map,
        center: userLocation,
        radius: 50, // 50 meters accuracy
        fillColor: '#2196F3',
        fillOpacity: 0.1,
        strokeColor: '#2196F3',
        strokeOpacity: 0.3,
        strokeWeight: 1
    });
}

// Add main temple marker
function addMandirMarker() {
    const mandirIcon = {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="50" viewBox="0 0 40 50">
                <path fill="#FF7A00" d="M20 0C11.716 0 5 6.716 5 15c0 8.284 15 35 15 35s15-26.716 15-35c0-8.284-6.716-15-15-15z"/>
                <circle cx="20" cy="15" r="8" fill="white"/>
                <text x="20" y="19" font-size="12" text-anchor="middle" fill="#FF7A00" font-weight="bold">🕉</text>
            </svg>
        `),
        scaledSize: new google.maps.Size(40, 50),
        anchor: new google.maps.Point(20, 50)
    };

    const marker = new google.maps.Marker({
        position: VITTHAL_MANDIR,
        map: map,
        icon: mandirIcon,
        title: VITTHAL_MANDIR.name,
        animation: google.maps.Animation.DROP
    });

    const infoWindow = new google.maps.InfoWindow({
        content: `
            <div style="padding: 10px; max-width: 250px;">
                <h3 style="color: #FF7A00; margin: 0 0 8px 0; font-size: 16px;">
                    ${VITTHAL_MANDIR.name}
                </h3>
                <p style="margin: 0; color: #666; font-size: 14px;">
                    Main Temple Complex<br>
                    Pandharpur, Maharashtra
                </p>
            </div>
        `
    });

    marker.addListener('click', () => {
        infoWindow.open(map, marker);
    });

    markers.push(marker);
}

// Add Bhakta Nivas markers
function addBhaktaNivasMarkers() {
    BHAKTA_NIVAS_LOCATIONS.forEach((nivas, index) => {
        const nivasIcon = {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="35" height="45" viewBox="0 0 35 45">
                    <path fill="#4CAF50" d="M17.5 0C10.044 0 4 6.044 4 13.5c0 7.456 13.5 31.5 13.5 31.5s13.5-24.044 13.5-31.5C31 6.044 24.956 0 17.5 0z"/>
                    <circle cx="17.5" cy="13.5" r="7" fill="white"/>
                    <text x="17.5" y="17" font-size="10" text-anchor="middle" fill="#4CAF50" font-weight="bold">🏠</text>
                </svg>
            `),
            scaledSize: new google.maps.Size(35, 45),
            anchor: new google.maps.Point(17.5, 45)
        };

        const marker = new google.maps.Marker({
            position: { lat: nivas.lat, lng: nivas.lng },
            map: map,
            icon: nivasIcon,
            title: nivas.name,
            animation: google.maps.Animation.DROP
        });

        // Calculate distance
        const distance = calculateDistance(
            VITTHAL_MANDIR.lat,
            VITTHAL_MANDIR.lng,
            nivas.lat,
            nivas.lng
        );
        
        // Calculate distance from user location if available
        let userDistance = null;
        if (userLocation) {
            userDistance = calculateDistance(
                userLocation.lat,
                userLocation.lng,
                nivas.lat,
                nivas.lng
            );
        }

        const infoWindow = new google.maps.InfoWindow({
            content: `
                <div style="padding: 12px; max-width: 300px;">
                    <h3 style="color: #4CAF50; margin: 0 0 8px 0; font-size: 15px;">
                        ${nivas.name}
                    </h3>
                    <div style="margin-bottom: 8px; padding: 6px; background: #FFF3E0; border-radius: 4px;">
                        <strong style="color: #FF7A00;">📍 Distance from Temple:</strong>
                        <span style="font-size: 16px; font-weight: bold; color: #FF7A00;">
                            ${distance.toFixed(2)} km
                        </span>
                    </div>
                    ${userDistance ? `
                    <div style="margin-bottom: 8px; padding: 6px; background: #E3F2FD; border-radius: 4px;">
                        <strong style="color: #2196F3;">📍 Distance from You:</strong>
                        <span style="font-size: 16px; font-weight: bold; color: #2196F3;">
                            ${userDistance.toFixed(2)} km
                        </span>
                    </div>
                    ` : ''}
                    <p style="margin: 4px 0; color: #666; font-size: 13px;">
                        <strong>Capacity:</strong> ${nivas.capacity}
                    </p>
                    <p style="margin: 4px 0; color: #666; font-size: 13px;">
                        <strong>Facilities:</strong> ${nivas.facilities}
                    </p>
                    <div style="display: flex; gap: 8px; margin-top: 8px;">
                        <button onclick="showRoute(${nivas.lat}, ${nivas.lng}, '${nivas.name}', 'temple')" 
                                style="flex: 1; padding: 6px 12px; background: #FF7A00; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                            From Temple
                        </button>
                        ${userLocation ? `
                        <button onclick="showRoute(${nivas.lat}, ${nivas.lng}, '${nivas.name}', 'user')" 
                                style="flex: 1; padding: 6px 12px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                            From My Location
                        </button>
                        ` : ''}
                    </div>
                </div>
            `
        });

        marker.addListener('click', () => {
            // Close all other info windows
            markers.forEach(m => {
                if (m.infoWindow) m.infoWindow.close();
            });
            infoWindow.open(map, marker);
        });

        marker.infoWindow = infoWindow;
        markers.push(marker);

        // Add distance label on map
        addDistanceLabel(nivas, distance);
    });
}

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of Earth in kilometers
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(degrees) {
    return degrees * (Math.PI / 180);
}

// Add distance label overlay on map
function addDistanceLabel(nivas, distance) {
    const midLat = (VITTHAL_MANDIR.lat + nivas.lat) / 2;
    const midLng = (VITTHAL_MANDIR.lng + nivas.lng) / 2;

    const label = new google.maps.Marker({
        position: { lat: midLat, lng: midLng },
        map: map,
        icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="80" height="30">
                    <rect width="80" height="30" rx="15" fill="#FF7A00" opacity="0.9"/>
                    <text x="40" y="20" font-size="12" text-anchor="middle" fill="white" font-weight="bold">
                        ${distance.toFixed(2)} km
                    </text>
                </svg>
            `),
            scaledSize: new google.maps.Size(80, 30),
            anchor: new google.maps.Point(40, 15)
        },
        clickable: false
    });
}

// Show route from temple or user location to Bhakta Nivas
window.showRoute = function(lat, lng, name, fromLocation = 'temple') {
    let origin;
    let originName;
    let routeColor;
    
    if (fromLocation === 'user' && userLocation) {
        origin = userLocation;
        originName = 'Your Location';
        routeColor = '#2196F3'; // Blue for user routes
    } else {
        origin = VITTHAL_MANDIR;
        originName = VITTHAL_MANDIR.name;
        routeColor = '#FF7A00'; // Orange for temple routes
    }
    
    // Update route line color
    directionsRenderer.setOptions({
        polylineOptions: {
            strokeColor: routeColor,
            strokeWeight: 4,
            strokeOpacity: 0.8
        }
    });
    
    const request = {
        origin: origin,
        destination: { lat: lat, lng: lng },
        travelMode: google.maps.TravelMode.WALKING
    };

    directionsService.route(request, (result, status) => {
        if (status === 'OK') {
            directionsRenderer.setDirections(result);
            
            const route = result.routes[0].legs[0];
            showRouteInfo(name, route.distance.text, route.duration.text, originName, routeColor);
        } else {
            showLocationMessage('Unable to calculate route. Please try again.', 'error');
        }
    });
};

// Show route information
function showRouteInfo(name, distance, duration, fromLocation = 'Temple', color = '#FF7A00') {
    const infoDiv = document.getElementById('route-info');
    if (infoDiv) {
        const icon = fromLocation === 'Your Location' ? '📍' : '🕉';
        infoDiv.innerHTML = `
            <div style="padding: 16px; background: linear-gradient(135deg, ${color}, ${color}dd); color: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                <h4 style="margin: 0 0 12px 0; font-size: 16px;">
                    🚶 Route to ${name}
                </h4>
                <div style="background: rgba(255,255,255,0.2); padding: 8px; border-radius: 8px; margin-bottom: 12px;">
                    <div style="font-size: 13px; opacity: 0.95; margin-bottom: 4px;">
                        ${icon} From: <strong>${fromLocation}</strong>
                    </div>
                </div>
                <div style="display: flex; gap: 20px; margin-bottom: 8px;">
                    <div>
                        <div style="font-size: 12px; opacity: 0.9;">Distance</div>
                        <div style="font-size: 20px; font-weight: bold;">${distance}</div>
                    </div>
                    <div>
                        <div style="font-size: 12px; opacity: 0.9;">Walking Time</div>
                        <div style="font-size: 20px; font-weight: bold;">${duration}</div>
                    </div>
                </div>
                <button onclick="clearRoute()" style="margin-top: 8px; padding: 6px 16px; background: white; color: ${color}; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                    Clear Route
                </button>
            </div>
        `;
        infoDiv.style.display = 'block';
    }
}

// Clear route
window.clearRoute = function() {
    directionsRenderer.setDirections({ routes: [] });
    const infoDiv = document.getElementById('route-info');
    if (infoDiv) {
        infoDiv.style.display = 'none';
    }
};

// Create distance panel
function createDistancePanel() {
    const panelDiv = document.getElementById('distance-panel');
    if (!panelDiv) return;

    let html = `
        <div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <h3 style="margin: 0 0 16px 0; color: #FF7A00; font-size: 18px;">
                📍 Bhakta Nivas Locations
            </h3>
            <div style="max-height: 400px; overflow-y: auto;">
    `;

    BHAKTA_NIVAS_LOCATIONS.forEach((nivas, index) => {
        const distance = calculateDistance(
            VITTHAL_MANDIR.lat,
            VITTHAL_MANDIR.lng,
            nivas.lat,
            nivas.lng
        );

        html += `
            <div style="padding: 12px; margin-bottom: 12px; background: #f9fafb; border-radius: 8px; border-left: 4px solid #4CAF50; cursor: pointer;" 
                 onclick="focusOnNivas(${nivas.lat}, ${nivas.lng}, ${index + 1})">
                <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">
                    ${nivas.name}
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: #6b7280; font-size: 13px;">
                        ${nivas.capacity}
                    </span>
                    <span style="background: #FF7A00; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">
                        ${distance.toFixed(2)} km
                    </span>
                </div>
            </div>
        `;
    });

    html += `
            </div>
        </div>
    `;

    panelDiv.innerHTML = html;
}

// Focus on specific Bhakta Nivas
window.focusOnNivas = function(lat, lng, markerIndex) {
    map.setCenter({ lat: lat, lng: lng });
    map.setZoom(17);
    
    // Trigger marker click
    if (markers[markerIndex]) {
        google.maps.event.trigger(markers[markerIndex], 'click');
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (typeof google !== 'undefined' && document.getElementById('bhakta-nivas-map')) {
            initBhaktaNivasMap();
        }
    });
} else {
    if (typeof google !== 'undefined' && document.getElementById('bhakta-nivas-map')) {
        initBhaktaNivasMap();
    }
}


// Show location message
function showLocationMessage(message, type = 'info') {
    let existingMsg = document.getElementById('location-message');
    if (existingMsg) {
        existingMsg.remove();
    }
    
    const colors = {
        info: { bg: '#2196F3', icon: 'ℹ️' },
        success: { bg: '#4CAF50', icon: '✅' },
        warning: { bg: '#FF9800', icon: '⚠️' },
        error: { bg: '#F44336', icon: '❌' }
    };
    
    const style = colors[type] || colors.info;
    
    const messageDiv = document.createElement('div');
    messageDiv.id = 'location-message';
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${style.bg};
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        font-size: 14px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideDown 0.3s ease-out;
    `;
    
    messageDiv.innerHTML = `
        <span style="font-size: 18px;">${style.icon}</span>
        <span>${message}</span>
    `;
    
    document.body.appendChild(messageDiv);
    
    // Add animation
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
        @keyframes slideDown {
            from {
                transform: translateX(-50%) translateY(-20px);
                opacity: 0;
            }
            to {
                transform: translateX(-50%) translateY(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(styleSheet);
}

// Hide location message
function hideLocationMessage() {
    const messageDiv = document.getElementById('location-message');
    if (messageDiv) {
        messageDiv.style.animation = 'slideUp 0.3s ease-out';
        setTimeout(() => {
            messageDiv.remove();
        }, 300);
    }
}

// Refresh user location
window.refreshUserLocation = function() {
    if (userLocationMarker) {
        userLocationMarker.setMap(null);
        userLocationMarker = null;
    }
    userLocation = null;
    getUserLocation();
};
