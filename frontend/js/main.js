/**
 * Main Application Logic for Salt & Pepper Restaurant
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- Header Scroll Effect ---
    const header = document.getElementById('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.style.background = 'rgba(255, 255, 255, 0.98)';
            header.style.boxShadow = '0 5px 20px rgba(0,0,0,0.1)';
        } else {
            header.style.background = 'rgba(255, 255, 255, 0.95)';
            header.style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)';
        }
    });

    // --- Mobile Menu Toggle ---
    const mobileToggle = document.getElementById('mobile-toggle');
    const navbar = document.getElementById('navbar');
    
    // We didn't fully style a distinct mobile menu in CSS for brevity, 
    // but a simple toggle mapping can be applied here.
    if(mobileToggle && navbar) {
        mobileToggle.addEventListener('click', () => {
            navbar.style.display = navbar.style.display === 'flex' ? 'none' : 'flex';
            navbar.style.flexDirection = 'column';
            navbar.style.position = 'absolute';
            navbar.style.top = '80px';
            navbar.style.left = '0';
            navbar.style.width = '100%';
            navbar.style.background = '#fff';
            navbar.style.padding = '20px';
            navbar.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)';
        });
    }

    // --- Shopping Cart Logic ---
    let cart = JSON.parse(localStorage.getItem('restaurant_cart')) || [];
    const cartToggleBtns = [document.getElementById('cart-toggle-btn'), document.getElementById('mobile-cart-toggle')];
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartOverlay = document.getElementById('cart-overlay');
    const closeCartBtn = document.getElementById('close-cart');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartTotalAmt = document.getElementById('cart-total-amt');
    const checkoutBtn = document.getElementById('checkout-btn');
    
    // Checkout Modal
    const checkoutModal = document.getElementById('checkout-modal');
    const closeCheckoutBtn = document.getElementById('close-checkout');
    const checkoutForm = document.getElementById('checkout-form');

    function saveCart() {
        localStorage.setItem('restaurant_cart', JSON.stringify(cart));
        updateCartUI();
    }

    function toggleCart() {
        cartSidebar.classList.toggle('active');
        cartOverlay.classList.toggle('active');
    }

    cartToggleBtns.forEach(btn => {
        if(btn) btn.addEventListener('click', toggleCart);
    });
    
    if(closeCartBtn) closeCartBtn.addEventListener('click', toggleCart);
    if(cartOverlay) cartOverlay.addEventListener('click', () => {
        cartSidebar.classList.remove('active');
        cartOverlay.classList.remove('active');
    });

    window.addToCart = function(id, name, price, img) {
        const item = cart.find(i => i.id === id);
        if (item) {
            item.qty++;
        } else {
            cart.push({ id, name, price: parseFloat(price), img, qty: 1 });
        }
        saveCart();
        cartSidebar.classList.add('active');
        cartOverlay.classList.add('active');
    };

    window.updateQty = function(id, delta) {
        const item = cart.find(i => i.id === id);
        if (item) {
            item.qty += delta;
            if (item.qty <= 0) {
                cart = cart.filter(i => i.id !== id);
            }
            saveCart();
        }
    };

    function updateCartUI() {
        // Update badges
        const count = cart.reduce((sum, item) => sum + item.qty, 0);
        document.querySelectorAll('.cart-count').forEach(el => el.textContent = count);

        // Update items list
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<div class="empty-cart-msg text-center">Your cart is empty</div>';
            cartTotalAmt.textContent = '₹0.00';
            checkoutBtn.disabled = true;
            return;
        }

        checkoutBtn.disabled = false;
        let total = 0;
        let html = '';

        cart.forEach(item => {
            total += item.price * item.qty;
            html += `
                <div class="cart-item">
                    <img src="${item.img || 'https://via.placeholder.com/60'}" alt="${item.name}">
                    <div class="cart-item-info">
                        <div class="cart-item-title">${item.name}</div>
                        <div class="cart-item-price">₹${item.price.toFixed(2)}</div>
                        <div class="cart-item-actions">
                            <button class="qty-btn" onclick="updateQty(${item.id}, -1)">-</button>
                            <span>${item.qty}</span>
                            <button class="qty-btn" onclick="updateQty(${item.id}, 1)">+</button>
                            <div style="flex-grow:1"></div>
                            <i class="fas fa-trash cart-item-remove" onclick="updateQty(${item.id}, -${item.qty})"></i>
                        </div>
                    </div>
                </div>
            `;
        });

        cartItemsContainer.innerHTML = html;
        cartTotalAmt.textContent = `₹${total.toFixed(2)}`;
        document.getElementById('pay-amt-btn').textContent = `₹${total.toFixed(2)}`;
    }

    // Initialize UI on load
    updateCartUI();

    // --- Dynamic Menu Loading ---
    async function loadMenu() {
        const container = document.getElementById('menu-container');
        const nav = document.getElementById('menu-categories-nav');
        const loader = document.getElementById('menu-loading');

        try {
            const res = await fetch('/api/public/menu');
            const data = await res.json();

            if (data.success && data.menu) {
                loader.style.display = 'none';
                let navHtml = `<button class="cat-btn active" data-filter="all">All</button>`;
                let itemsHtml = '';

                data.menu.forEach((category, idx) => {
                    navHtml += `<button class="cat-btn" data-filter="cat-${category.category_id}">${category.category_name}</button>`;
                    
                    category.items.forEach((item, i) => {
                        const delay = (i % 3) * 100; // Stagger animation
                        const vegIcon = item.is_veg ? '<div class="veg-badge veg"><i class="fas fa-leaf"></i> Veg</div>' 
                                                    : '<div class="veg-badge non-veg"><i class="fas fa-drumstick-bite"></i> Non-Veg</div>';
                        const imgSrc = item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=600';

                        itemsHtml += `
                            <div class="menu-card cat-${category.category_id}" data-aos="fade-up" data-aos-delay="${delay}">
                                <div class="menu-img-wrap">
                                    <img src="${imgSrc}" alt="${item.name}">
                                    ${vegIcon}
                                </div>
                                <div class="menu-content">
                                    <div class="menu-header">
                                        <h3 class="menu-title">${item.name}</h3>
                                        <div class="menu-price">₹${item.price}</div>
                                    </div>
                                    <p class="menu-desc">${item.description || 'Delicious freshly prepared dish.'}</p>
                                    <button class="add-to-cart-btn" onclick="addToCart(${item.id}, '${item.name.replace(/'/g, "\\'")}', ${item.price}, '${imgSrc}')">
                                        <i class="fas fa-plus"></i> Add to Order
                                    </button>
                                </div>
                            </div>
                        `;
                    });
                });

                nav.innerHTML = navHtml;
                container.innerHTML = itemsHtml;

                // Category filtering
                document.querySelectorAll('.cat-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
                        e.target.classList.add('active');
                        const filter = e.target.getAttribute('data-filter');
                        
                        document.querySelectorAll('.menu-card').forEach(card => {
                            if (filter === 'all' || card.classList.contains(filter)) {
                                card.style.display = 'block';
                            } else {
                                card.style.display = 'none';
                            }
                        });
                    });
                });
            }
        } catch (e) {
            console.error('Failed to load menu', e);
            loader.innerHTML = '<p class="text-danger">Failed to load menu. Please refresh.</p>';
        }
    }

    if (document.getElementById('menu-container')) {
        loadMenu();
    }

    // --- Forms Handling ---

    // 1. Contact Form
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = contactForm.querySelector('button[type="submit"]');
            const responseDiv = document.getElementById('contact-message-response');
            
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            btn.disabled = true;

            const payload = {
                name: document.getElementById('msg-name').value,
                email: document.getElementById('msg-email').value,
                subject: document.getElementById('msg-subject').value,
                message: document.getElementById('msg-message').value
            };

            try {
                const res = await fetch('/api/public/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                
                if (data.success) {
                    responseDiv.className = 'form-message mt-3 success';
                    responseDiv.textContent = 'Thank you! Your message has been sent.';
                    contactForm.reset();
                } else {
                    throw new Error(data.error);
                }
            } catch(e) {
                responseDiv.className = 'form-message mt-3 error';
                responseDiv.textContent = 'Sorry, something went wrong. Please try again.';
            } finally {
                btn.innerHTML = 'Send Message';
                btn.disabled = false;
            }
        });
    }

    // 2. Reservation Form
    const resForm = document.getElementById('reservation-form');
    if (resForm) {
        resForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = resForm.querySelector('button[type="submit"]');
            const responseDiv = document.getElementById('res-message');
            
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            btn.disabled = true;

            const payload = {
                name: document.getElementById('res-name').value,
                email: document.getElementById('res-email').value,
                phone: document.getElementById('res-phone').value,
                guests: document.getElementById('res-guests').value,
                date: document.getElementById('res-date').value,
                time: document.getElementById('res-time').value,
                special_requests: document.getElementById('res-requests').value
            };

            try {
                const res = await fetch('/api/public/reserve', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                
                if (data.success) {
                    responseDiv.className = 'form-message mt-3 success';
                    responseDiv.innerHTML = '<i class="fas fa-check-circle"></i> Reservation confirmed! See you soon.';
                    resForm.reset();
                } else {
                    throw new Error(data.error);
                }
            } catch(e) {
                responseDiv.className = 'form-message mt-3 error';
                responseDiv.textContent = 'Oops! Could not complete reservation. Please call us.';
            } finally {
                btn.innerHTML = 'Confirm Reservation';
                btn.disabled = false;
            }
        });
    }

    // --- Checkout & Payment Flow ---
    if(checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            cartSidebar.classList.remove('active');
            checkoutModal.classList.add('active');
        });
    }

    if(closeCheckoutBtn) {
        closeCheckoutBtn.addEventListener('click', () => {
            checkoutModal.classList.remove('active');
        });
    }

    if(checkoutForm) {
        checkoutForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const btn = document.getElementById('pay-now-btn');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            btn.disabled = true;

            const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
            const itemsPayload = cart.map(i => ({ menu_item_id: i.id, quantity: i.qty, price: i.price }));

            const orderPayload = {
                customer: {
                    name: document.getElementById('chk-name').value,
                    email: document.getElementById('chk-email').value,
                    phone: document.getElementById('chk-phone').value,
                    address: document.getElementById('chk-address').value
                },
                total_amount: total,
                items: itemsPayload
            };

            try {
                // 1. Create order in our backend
                const res = await fetch('/api/public/order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderPayload)
                });
                const data = await res.json();

                if(data.success) {
                    // Note: In a complete real-world scenario, you would now call 
                    // /api/payment/create to get a Razorpay Order ID, 
                    // and initialize the Razorpay checkout.js drop-in here.
                    
                    // Since Razorpay requires real API keys to generate valid order IDs, 
                    // we simulate a successful order here:
                    
                    alert(`Order #${data.order_id} placed successfully! Thank you.`);
                    cart = [];
                    saveCart();
                    checkoutModal.classList.remove('active');
                    cartOverlay.classList.remove('active');
                } else {
                    throw new Error(data.error);
                }
            } catch(e) {
                alert('Checkout failed. Please try again.');
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        });
    }
});
