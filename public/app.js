const socket = io();

// Initialize Map
// Default view: Indonesia (approximate center)
const map = L.map('map').setView([-2.5489, 118.0149], 5);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

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
    connectionStatus.classList.add('connected');
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

        // Optional: specific behavior if popup is already open?
        // if (markers[id].isPopupOpen()) markers[id].openPopup(); 
    } else {
        // Create new marker
        const marker = L.marker([lat, lng])
            .addTo(map)
            .bindPopup(`<b>${name}</b><br>Active Now`);
        markers[id] = marker;
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
        li.innerHTML = `
            <h3>${user.name}</h3>
            <p>Lat: ${user.lat.toFixed(4)}, Lng: ${user.lng.toFixed(4)}</p>
            <p style="font-size:0.75rem; margin-top:0.25rem;">${new Date(user.timestamp).toLocaleTimeString()}</p>
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
    Object.assign(localUserData, users);

    // Update map markers
    Object.values(users).forEach(user => updateMarker(user));

    // Update sidebar
    renderUserList();
});

// 2. Real-time updates
socket.on('receive-location', (data) => {
    console.log('Received location:', data);

    // Update local data store
    localUserData[data.id] = data;

    // Update map marker
    updateMarker(data);

    // Update sidebar
    renderUserList();
});
