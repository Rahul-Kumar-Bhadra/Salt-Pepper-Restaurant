// Initial Auth Check
const token = localStorage.getItem('admin_token');
if (!token) {
    window.location.href = 'login.html';
}

// Global fetch wrapper
async function apiFetch(url, options = {}) {
    options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
    const response = await fetch(url, options);
    if (response.status === 401) {
        localStorage.removeItem('admin_token');
        window.location.href = 'login.html';
    }
    return response;
}

// UI Navigation
document.querySelectorAll('.sidebar-nav a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Update active class
        document.querySelectorAll('.sidebar-nav a').forEach(l => l.classList.remove('active'));
        e.target.closest('a').classList.add('active');

        // Show target section
        const targetId = e.target.closest('a').getAttribute('data-target');
        document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
        document.getElementById(targetId).classList.add('active');

        // Load data for section
        loadSectionData(targetId);
        
        // Hide mobile sidebar
        if(window.innerWidth <= 768) {
            document.getElementById('sidebar').classList.remove('active');
        }
    });
});

document.getElementById('mobile-toggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('active');
});

document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('admin_token');
    window.location.href = 'login.html';
});

// Load Data Functions
async function loadSectionData(targetId) {
    switch (targetId) {
        case 'dashboard-view':
            await fetchDashboardStats();
            break;
        case 'orders-view':
            await fetchOrders();
            break;
        case 'reservations-view':
            await fetchReservations();
            break;
        case 'menu-view':
            // Using public route to view menu, but admin could have its own
            await fetchMenuParams(); 
            break;
        case 'messages-view':
            await fetchMessages();
            break;
    }
}

// Helpers
function formatDate(isoString) {
    const d = new Date(isoString);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
}

const statusColors = {
    'Pending': 'warning',
    'Preparing': 'primary',
    'Out for Delivery': 'primary',
    'Completed': 'success',
    'Cancelled': 'danger'
};

// 1. Dashboard Stats
async function fetchDashboardStats() {
    try {
        const res = await apiFetch('/api/admin/dashboard-stats');
        const data = await res.json();
        
        document.getElementById('stat-orders').textContent = data.total_orders;
        document.getElementById('stat-revenue').textContent = `₹${data.total_revenue.toFixed(2)}`;
        document.getElementById('stat-reservations').textContent = data.total_reservations;
        document.getElementById('stat-pending').textContent = data.pending_orders;
    } catch(e) {
        console.error('Error fetching stats:', e);
    }
}

// 2. Orders
async function fetchOrders() {
    try {
        const res = await apiFetch('/api/admin/orders');
        const data = await res.json();
        const tbody = document.querySelector('#orders-table tbody');
        tbody.innerHTML = '';
        
        data.forEach(order => {
            const row = `<tr>
                <td>#ORD-${order.id}</td>
                <td>${formatDate(order.created_at)}</td>
                <td>${order.customer.name}<br><small>${order.customer.phone}</small></td>
                <td>₹${order.total_amount.toFixed(2)}</td>
                <td><span class="badge badge-${statusColors[order.status] || 'primary'}">${order.status}</span></td>
                <td>
                    <select class="form-control btn-sm" onchange="updateOrderStatus(${order.id}, this.value)" style="width:auto; display:inline-block">
                        <option value="" disabled selected>Update Status</option>
                        <option value="Pending">Pending</option>
                        <option value="Preparing">Preparing</option>
                        <option value="Out for Delivery">Out for Delivery</option>
                        <option value="Completed">Completed</option>
                    </select>
                </td>
            </tr>`;
            tbody.innerHTML += row;
        });
    } catch(e) {
        console.error('Error fetching orders:', e);
    }
}

async function updateOrderStatus(id, status) {
    try {
        const res = await apiFetch(`/api/admin/orders/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
        if(res.ok) fetchOrders();
    } catch(e) {
        alert('Failed to update status');
    }
}

// 3. Reservations
async function fetchReservations() {
    try {
        const res = await apiFetch('/api/admin/reservations');
        const data = await res.json();
        const tbody = document.querySelector('#reservations-table tbody');
        tbody.innerHTML = '';
        
        data.forEach(r => {
            const row = `<tr>
                <td><strong>${r.date}</strong><br><small>${r.time}</small></td>
                <td>${r.name}<br><small>${r.phone}</small></td>
                <td>${r.guests} guests</td>
                <td>${r.special_requests || '-'}</td>
            </tr>`;
            tbody.innerHTML += row;
        });
    } catch(e) { console.error('Error:', e); }
}

// 4. Messages
async function fetchMessages() {
    try {
        const res = await apiFetch('/api/admin/messages');
        const data = await res.json();
        const tbody = document.querySelector('#messages-table tbody');
        tbody.innerHTML = '';
        
        data.forEach(m => {
            const row = `<tr>
                <td>${formatDate(m.created_at)}</td>
                <td><strong>${m.name}</strong><br><small>${m.email}</small></td>
                <td>${m.subject}</td>
                <td>${m.message}</td>
            </tr>`;
            tbody.innerHTML += row;
        });
    } catch(e) { console.error('Error:', e); }
}

// 5. Menu Management
let menuItems = [];
async function fetchMenuParams() {
    try {
        const res = await fetch('/api/public/menu'); // Assuming public is fine for listing
        const data = await res.json();
        if(data.success) {
            menuItems = data.menu;
            renderMenuTable();
        }
    } catch(e) { console.error('Menu load error:', e); }
}

function renderMenuTable() {
    const tbody = document.querySelector('#menu-table tbody');
    tbody.innerHTML = '';
    
    menuItems.forEach(category => {
        category.items.forEach(item => {
            const img = item.image_url ? `<img src="../${item.image_url}" width="50" height="50" style="object-fit:cover; border-radius:4px">` : '-';
            const vegBadge = item.is_veg ? '<span class="badge badge-success">Veg</span>' : '<span class="badge badge-danger">Non-Veg</span>';
            const availBadge = item.is_available ? '<span class="badge badge-success">Yes</span>' : '<span class="badge badge-warning">No</span>';
            
            const row = `<tr>
                <td>${img}</td>
                <td><strong>${item.name}</strong><br>${vegBadge}</td>
                <td>${category.category_name} (ID: ${item.category_id})</td>
                <td>₹${item.price}</td>
                <td>${availBadge}</td>
                <td>
                    <button class="btn btn-outline btn-sm" onclick='editMenu(${JSON.stringify(item).replace(/'/g, "&#39;")})'><i class="fas fa-edit"></i></button>
                    <button class="btn btn-primary btn-sm" onclick="deleteMenu(${item.id})"><i class="fas fa-trash"></i></button>
                </td>
            </tr>`;
            tbody.innerHTML += row;
        });
    });
}

// Modal Logic
const modal = document.getElementById('menu-modal');

function openMenuModal() {
    document.getElementById('menu-form').reset();
    document.getElementById('menu-id').value = '';
    document.getElementById('modal-title').textContent = 'Add Menu Item';
    modal.classList.add('active');
}

function closeMenuModal() {
    modal.classList.remove('active');
}

window.editMenu = function(item) {
    document.getElementById('menu-id').value = item.id;
    document.getElementById('menu-name').value = item.name;
    document.getElementById('menu-category').value = item.category_id;
    document.getElementById('menu-price').value = item.price;
    document.getElementById('menu-desc').value = item.description || '';
    document.getElementById('menu-image').value = item.image_url || '';
    document.getElementById('menu-veg').checked = item.is_veg;
    document.getElementById('menu-available').checked = item.is_available;
    
    document.getElementById('modal-title').textContent = 'Edit Menu Item';
    modal.classList.add('active');
};

window.deleteMenu = async function(id) {
    if(confirm('Are you sure you want to delete this dish?')) {
        const res = await apiFetch(`/api/admin/menu/${id}`, { method: 'DELETE' });
        if(res.ok) fetchMenuParams();
    }
};

document.getElementById('menu-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('menu-id').value;
    const isEdit = !!id;
    const url = isEdit ? `/api/admin/menu/${id}` : `/api/admin/menu`;
    const method = isEdit ? 'PUT' : 'POST';
    
    const payload = {
        name: document.getElementById('menu-name').value,
        category_id: parseInt(document.getElementById('menu-category').value),
        price: parseFloat(document.getElementById('menu-price').value),
        description: document.getElementById('menu-desc').value,
        image_url: document.getElementById('menu-image').value,
        is_veg: document.getElementById('menu-veg').checked,
        is_available: document.getElementById('menu-available').checked,
    };

    try {
        const res = await apiFetch(url, {
            method: method,
            body: JSON.stringify(payload)
        });
        if(res.ok) {
            closeMenuModal();
            fetchMenuParams();
        } else {
            alert('Failed to save menu item');
        }
    } catch(e) {
        alert('API Error');
    }
});

// Load initial view
loadSectionData('dashboard-view');
