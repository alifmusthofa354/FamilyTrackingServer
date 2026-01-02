const socket = io();

// Initialize Map
// Default view: Indonesia (approximate center)
const map = L.map('map').setView([-2.5489, 118.0149], 5);

// Use CartoDB Voyager tiles for a more modern, premium look that matches the UI
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
}).addTo(map);

// Robust fix for map rendering issues (grey screen) due to flexbox/layout shifts
function fixMapSize() {
    map.invalidateSize();
}

// Robust fix: Use ResizeObserver to detect container size changes automatically
const mapElement = document.getElementById('map');
const resizeObserver = new ResizeObserver(() => {
    map.invalidateSize();
});
resizeObserver.observe(mapElement);

// Fallback timeouts just in case
setTimeout(fixMapSize, 500);
setTimeout(fixMapSize, 2000);

// Store markers: { userId: L.marker }
const markers = {};
const userListElement = document.getElementById('user-list');
const connectionStatus = document.getElementById('connection-status');
const userCountElement = document.getElementById('user-count');
const localUserData = {};

// Connection Events
socket.on('connect', () => {
    connectionStatus.textContent = 'Connected';
    connectionStatus.classList.remove('disconnected');
    connectionStatus.classList.add('connected'); // This relies on CSS .status-indicator.connected
    console.log('Connected to server');
});

socket.on('disconnect', () => {
    connectionStatus.textContent = 'Disconnected';
    connectionStatus.classList.remove('connected');
    connectionStatus.classList.add('disconnected');
});

// Update Marker on Map
function updateMarker(data) {
    const { id, name, lat, lng, timestamp } = data;

    if (markers[id]) {
        // Move existing marker
        markers[id].setLatLng([lat, lng]);
        markers[id].bindPopup(`<b>${name}</b><br>Updated: ${new Date(timestamp).toLocaleTimeString()}`);
    } else {
        // Create new marker
        const marker = L.marker([lat, lng])
            .addTo(map)
            .bindPopup(`<b>${name}</b><br>Active Now`);
        markers[id] = marker;
    }
}

// Remove Marker
function removeMarker(userId) {
    if (markers[userId]) {
        map.removeLayer(markers[userId]);
        delete markers[userId];
    }
}

// Update Sidebar List
function renderUserList() {
    userListElement.innerHTML = '';
    const users = Object.values(localUserData);

    userCountElement.textContent = `Active Users: ${users.length}`;

    if (users.length === 0) {
        userListElement.innerHTML = '<li class="empty-message">No users connected yet...</li>';
        return;
    }

    users.forEach(user => {
        const li = document.createElement('li');
        li.className = 'user-item';
        // Get initial from name for avatar
        const initial = user.name ? user.name.charAt(0).toUpperCase() : '?';

        li.innerHTML = `
            <div class="user-avatar">${initial}</div>
            <div class="user-info">
                <h3>${user.name}</h3>
                <p>Lat: ${user.lat.toFixed(4)}, Lng: ${user.lng.toFixed(4)}</p>
                <p style="font-size:0.7rem; opacity:0.8; margin-top:2px;">Last seen: ${new Date(user.timestamp).toLocaleTimeString()}</p>
            </div>
        `;
        li.onclick = () => {
            // Fly to location when clicked in list
            map.flyTo([user.lat, user.lng], 16);
            if (markers[user.id]) markers[user.id].openPopup();
        };
        userListElement.appendChild(li);
    });
}

// Socket Listeners

// 1. Initial Load of all users
socket.on('current-users', (users) => {
    // Clear existing data first
    for (const userId in localUserData) delete localUserData[userId];
    Object.assign(localUserData, users);

    // Clear existing markers not in new list (tricky, better to just wipe or sync)
    Object.keys(markers).forEach(id => {
        if (!users[id]) removeMarker(id);
    });

    // Update map markers
    Object.values(users).forEach(user => updateMarker(user));

    // Update sidebar
    renderUserList();
});

// 2. Real-time updates
socket.on('receive-location', (data) => {
    console.log('Received location:', data);
    localUserData[data.id] = data;
    updateMarker(data);
    renderUserList();
});

// 3. Handle User Disconnect
socket.on('user-disconnected', (userId) => {
    console.log('User disconnected:', userId);
    if (localUserData[userId]) {
        delete localUserData[userId];
        removeMarker(userId);
        renderUserList();
    }
});

// UI Interactions
const toggleBtn = document.getElementById('sidebar-toggle');
const mainContainer = document.querySelector('main');

toggleBtn.addEventListener('click', () => {
    mainContainer.classList.toggle('sidebar-collapsed');

    // Wait for transition to finish then resize map
    setTimeout(() => {
        map.invalidateSize();
    }, 300);
});
