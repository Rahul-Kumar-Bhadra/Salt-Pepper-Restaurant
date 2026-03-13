document.addEventListener('DOMContentLoaded', () => {
    // 1. Sticky Navbar & Active Link Update
    const header = document.getElementById('header');
    const mobileToggle = document.getElementById('mobile-toggle');
    const navbar = document.getElementById('navbar');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section');
    
    window.addEventListener('scroll', () => {
        // Sticky Header
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        // Active Link Update
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (scrollY >= (sectionTop - 100)) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').includes(current) && current !== '') {
                link.classList.add('active');
            }
        });
    });

    // 2. Mobile Menu Toggle
    mobileToggle.addEventListener('click', () => {
        navbar.classList.toggle('active');
        mobileToggle.classList.toggle('active');
        
        // Change icon based on menu state
        const icon = mobileToggle.querySelector('i');
        if (navbar.classList.contains('active')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
        } else {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    });

    // Close mobile menu when clicking a link
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navbar.classList.remove('active');
            mobileToggle.classList.remove('active');
            const icon = mobileToggle.querySelector('i');
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        });
    });

    // 3. Scroll Animations using IntersectionObserver
    const fadeElements = document.querySelectorAll('.fade-in-up');
    const staggerElements = document.querySelectorAll('.stagger-in');

    const fadeOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const fadeObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('appear');
                observer.unobserve(entry.target);
            }
        });
    }, fadeOptions);

    fadeElements.forEach(el => fadeObserver.observe(el));
    
    // For staggered animations
    const staggerObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add('appear');
                }, index * 100); // 100ms delay between each item
                observer.unobserve(entry.target);
            }
        });
    }, fadeOptions);

    staggerElements.forEach(el => staggerObserver.observe(el));

    // 4. Testimonials Carousel
    const slides = document.querySelectorAll('.review-card');
    const dots = document.querySelectorAll('.dot');
    let currentSlide = 1; // start at middle
    
    function showSlide(index) {
        slides.forEach(slide => {
            slide.classList.remove('active');
        });
        dots.forEach(dot => {
            dot.classList.remove('active');
        });
        
        slides[index].classList.add('active');
        dots[index].classList.add('active');
        currentSlide = index;
    }

    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            showSlide(index);
        });
    });
    
    // Auto cycle
    setInterval(() => {
        let max = slides.length - 1;
        let next = currentSlide >= max ? 0 : currentSlide + 1;
        showSlide(next);
    }, 5000);

    // 5. Backend Form Handling
    const reservationForm = document.getElementById('reservation-form');
    if (reservationForm) {
        reservationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const messageEl = document.getElementById('res-message');
            const submitBtn = reservationForm.querySelector('button[type="submit"]');
            
            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';
            messageEl.className = 'form-message';
            
            const data = {
                name: document.getElementById('res-name').value,
                email: document.getElementById('res-email').value,
                phone: document.getElementById('res-phone').value,
                guests: document.getElementById('res-guests').value,
                date: document.getElementById('res-date').value,
                time: document.getElementById('res-time').value,
                special_requests: document.getElementById('res-requests').value
            };

            try {
                const response = await fetch('/api/reserve', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                const result = await response.json();

                if (response.ok) {
                    messageEl.textContent = 'Table reserved successfully! We will see you soon.';
                    messageEl.classList.add('success');
                    reservationForm.reset();
                } else {
                    messageEl.textContent = result.error || 'Failed to reserve table. Please try again.';
                    messageEl.classList.add('error');
                }
            } catch (error) {
                messageEl.textContent = 'Network error. Please try again later.';
                messageEl.classList.add('error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Confirm Reservation';
            }
        });
    }

    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const messageEl = document.getElementById('contact-message-response');
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';
            messageEl.className = 'form-message';
            
            const data = {
                name: document.getElementById('contact-name').value,
                email: document.getElementById('contact-email').value,
                subject: document.getElementById('contact-subject').value,
                message: document.getElementById('contact-message').value
            };

            try {
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                const result = await response.json();

                if (response.ok) {
                    messageEl.textContent = 'Message sent successfully!';
                    messageEl.classList.add('success');
                    contactForm.reset();
                } else {
                    messageEl.textContent = result.error || 'Failed to send message.';
                    messageEl.classList.add('error');
                }
            } catch (error) {
                messageEl.textContent = 'Network error. Please try again later.';
                messageEl.classList.add('error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Send Message';
            }
        });
    }
});
