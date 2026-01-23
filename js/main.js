/* ============================================
   JLC STUDIO - Main JavaScript
   Premium Interactive Experience
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all modules
    Preloader.init();
    Navigation.init();
    Animations.init();
    Testimonials.init();
    CountUp.init();
    SmoothScroll.init();
});

/* Preloader Module */
const Preloader = {
    init() {
        const preloader = document.getElementById('preloader');
        if (!preloader) return;

        window.addEventListener('load', () => {
            setTimeout(() => {
                preloader.classList.add('hidden');
                document.body.style.overflow = 'auto';
            }, 1800);
        });
    }
};

/* Navigation Module */
const Navigation = {
    init() {
        this.navbar = document.getElementById('navbar');
        this.navToggle = document.getElementById('nav-toggle');
        this.navMenu = document.getElementById('nav-menu');
        this.navLinks = document.querySelectorAll('.nav-link');

        this.bindEvents();
        this.checkScroll();
    },

    bindEvents() {
        // Scroll handling
        window.addEventListener('scroll', () => this.checkScroll());

        // Mobile menu toggle
        if (this.navToggle) {
            this.navToggle.addEventListener('click', () => this.toggleMenu());
        }

        // Close menu on link click
        this.navLinks.forEach(link => {
            link.addEventListener('click', () => this.closeMenu());
        });

        // Close menu on outside click
        document.addEventListener('click', (e) => {
            if (this.navMenu && this.navToggle && !this.navMenu.contains(e.target) && !this.navToggle.contains(e.target)) {
                this.closeMenu();
            }
        });
    },

    checkScroll() {
        if (!this.navbar) return;
        if (window.scrollY > 100) {
            this.navbar.classList.add('scrolled');
        } else {
            this.navbar.classList.remove('scrolled');
        }
    },

    toggleMenu() {
        if (!this.navToggle || !this.navMenu) return;
        this.navToggle.classList.toggle('active');
        this.navMenu.classList.toggle('active');
        document.body.style.overflow = this.navMenu.classList.contains('active') ? 'hidden' : '';
    },

    closeMenu() {
        if (!this.navToggle || !this.navMenu) return;
        this.navToggle.classList.remove('active');
        this.navMenu.classList.remove('active');
        document.body.style.overflow = '';
    }
};

/* Animations Module */
const Animations = {
    init() {
        this.observeElements();
    },

    observeElements() {
        const options = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');

                    // Stagger children animations
                    const children = entry.target.querySelectorAll('.fade-in-child');
                    children.forEach((child, index) => {
                        setTimeout(() => {
                            child.classList.add('visible');
                        }, index * 100);
                    });
                }
            });
        }, options);

        // Add fade-in class to sections
        const sections = document.querySelectorAll(
            '.service-card, .process-step, .about-content, .about-image, ' +
            '.section-header, .cta-content, .footer-grid > div'
        );

        sections.forEach(section => {
            section.classList.add('fade-in');
            observer.observe(section);
        });
    }
};

/* Testimonials Slider Module */
const Testimonials = {
    init() {
        this.testimonials = document.querySelectorAll('.testimonial');
        this.dots = document.querySelectorAll('.nav-dot');
        this.currentIndex = 0;
        this.autoplayInterval = null;

        if (this.testimonials.length === 0) return;

        this.bindEvents();
        this.startAutoplay();
    },

    bindEvents() {
        this.dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                this.goTo(index);
                this.resetAutoplay();
            });
        });

        // Pause on hover
        const slider = document.querySelector('.testimonials-slider');
        if (slider) {
            slider.addEventListener('mouseenter', () => this.stopAutoplay());
            slider.addEventListener('mouseleave', () => this.startAutoplay());
        }
    },

    goTo(index) {
        this.testimonials[this.currentIndex].classList.remove('active');
        this.dots[this.currentIndex].classList.remove('active');

        this.currentIndex = index;

        this.testimonials[this.currentIndex].classList.add('active');
        this.dots[this.currentIndex].classList.add('active');
    },

    next() {
        const nextIndex = (this.currentIndex + 1) % this.testimonials.length;
        this.goTo(nextIndex);
    },

    startAutoplay() {
        this.autoplayInterval = setInterval(() => this.next(), 5000);
    },

    stopAutoplay() {
        clearInterval(this.autoplayInterval);
    },

    resetAutoplay() {
        this.stopAutoplay();
        this.startAutoplay();
    }
};

/* Count Up Animation Module */
const CountUp = {
    init() {
        this.counters = document.querySelectorAll('.stat-number');
        if (this.counters.length === 0) return;

        this.observeCounters();
    },

    observeCounters() {
        const options = {
            root: null,
            rootMargin: '0px',
            threshold: 0.5
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateCounter(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, options);

        this.counters.forEach(counter => observer.observe(counter));
    },

    animateCounter(element) {
        const target = parseInt(element.getAttribute('data-count'));
        const duration = 2000;
        const start = 0;
        const startTime = performance.now();

        const updateCounter = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const current = Math.floor(easeOutQuart * target);

            element.textContent = current;

            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            } else {
                element.textContent = target;
            }
        };

        requestAnimationFrame(updateCounter);
    }
};

/* Smooth Scroll Module */
const SmoothScroll = {
    init() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                const href = anchor.getAttribute('href');
                if (href === '#') return;

                e.preventDefault();
                const target = document.querySelector(href);

                if (target) {
                    const headerOffset = 100;
                    const elementPosition = target.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }
};

/* Form Validation Module (for contact page) */
const FormValidation = {
    init() {
        const form = document.getElementById('contact-form');
        if (!form) return;

        form.addEventListener('submit', (e) => this.handleSubmit(e, form));
    },

    handleSubmit(e, form) {
        e.preventDefault();

        const fields = form.querySelectorAll('[required]');
        let isValid = true;

        fields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        if (isValid) {
            this.submitForm(form);
        }
    },

    validateField(field) {
        const value = field.value.trim();
        const type = field.type;
        let isValid = true;

        // Remove existing error
        this.removeError(field);

        if (!value) {
            this.showError(field, 'This field is required');
            isValid = false;
        } else if (type === 'email' && !this.isValidEmail(value)) {
            this.showError(field, 'Please enter a valid email');
            isValid = false;
        }

        return isValid;
    },

    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },

    showError(field, message) {
        field.classList.add('error');
        const errorEl = document.createElement('span');
        errorEl.className = 'field-error';
        errorEl.textContent = message;
        field.parentNode.appendChild(errorEl);
    },

    removeError(field) {
        field.classList.remove('error');
        const errorEl = field.parentNode.querySelector('.field-error');
        if (errorEl) errorEl.remove();
    },

    submitForm(form) {
        const btn = form.querySelector('[type="submit"]');
        btn.textContent = 'Sending...';
        btn.disabled = true;

        // Simulate form submission
        setTimeout(() => {
            form.innerHTML = `
                <div class="form-success">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    <h3>Thank You!</h3>
                    <p>Your message has been sent. We'll be in touch within 24 hours.</p>
                </div>
            `;
        }, 1500);
    }
};

/* Gallery Lightbox Module (for gallery page) */
const Lightbox = {
    init() {
        this.gallery = document.querySelector('.gallery-grid');
        if (!this.gallery) return;

        this.createLightbox();
        this.bindEvents();
    },

    createLightbox() {
        const lightbox = document.createElement('div');
        lightbox.className = 'lightbox';
        lightbox.innerHTML = `
            <div class="lightbox-content">
                <button class="lightbox-close">&times;</button>
                <button class="lightbox-prev">&larr;</button>
                <button class="lightbox-next">&rarr;</button>
                <img src="" alt="">
                <div class="lightbox-caption"></div>
            </div>
        `;
        document.body.appendChild(lightbox);
        this.lightbox = lightbox;
        this.lightboxImg = lightbox.querySelector('img');
        this.lightboxCaption = lightbox.querySelector('.lightbox-caption');
    },

    bindEvents() {
        const items = this.gallery.querySelectorAll('.gallery-item');

        items.forEach((item, index) => {
            item.addEventListener('click', () => this.open(index));
        });

        this.lightbox.querySelector('.lightbox-close').addEventListener('click', () => this.close());
        this.lightbox.querySelector('.lightbox-prev').addEventListener('click', () => this.prev());
        this.lightbox.querySelector('.lightbox-next').addEventListener('click', () => this.next());

        this.lightbox.addEventListener('click', (e) => {
            if (e.target === this.lightbox) this.close();
        });

        document.addEventListener('keydown', (e) => {
            if (!this.lightbox.classList.contains('active')) return;
            if (e.key === 'Escape') this.close();
            if (e.key === 'ArrowLeft') this.prev();
            if (e.key === 'ArrowRight') this.next();
        });
    },

    open(index) {
        this.items = this.gallery.querySelectorAll('.gallery-item');
        this.currentIndex = index;
        this.updateImage();
        this.lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    },

    close() {
        this.lightbox.classList.remove('active');
        document.body.style.overflow = '';
    },

    prev() {
        this.currentIndex = (this.currentIndex - 1 + this.items.length) % this.items.length;
        this.updateImage();
    },

    next() {
        this.currentIndex = (this.currentIndex + 1) % this.items.length;
        this.updateImage();
    },

    updateImage() {
        const item = this.items[this.currentIndex];
        const img = item.querySelector('img');
        this.lightboxImg.src = img.src;
        this.lightboxCaption.textContent = img.alt;
    }
};

/* Initialize additional modules when needed */
document.addEventListener('DOMContentLoaded', function() {
    FormValidation.init();
    Lightbox.init();
});

/* Parallax Effect for Hero (subtle) */
window.addEventListener('scroll', function() {
    const hero = document.querySelector('.hero-content');
    if (hero) {
        const scroll = window.pageYOffset;
        hero.style.transform = `translateY(${scroll * 0.3}px)`;
        hero.style.opacity = 1 - (scroll * 0.002);
    }
});
