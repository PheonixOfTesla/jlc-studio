/**
 * JLC Studio Content Loader
 * Comprehensive loader - pulls ALL content from admin.json
 * No hardcoded data should exist in HTML files
 */

const ContentLoader = {
  dataPath: '/_data',
  adminData: null,

  async loadAdminData() {
    try {
      const response = await fetch(`${this.dataPath}/admin.json?t=${Date.now()}`);
      if (!response.ok) throw new Error('Failed to load admin.json');
      this.adminData = await response.json();
      console.log('✓ Admin data loaded (single source of truth)');
      return this.adminData;
    } catch (error) {
      console.error('Failed to load admin.json:', error);
      return null;
    }
  },

  // Apply theme colors from admin.json to CSS variables
  loadTheme() {
    if (!this.adminData?.theme) return;

    const theme = this.adminData.theme;
    const root = document.documentElement;

    // Map each JSON color to its CSS variable
    root.style.setProperty('--gold', theme.gold);
    root.style.setProperty('--gold-light', theme.goldLight);
    root.style.setProperty('--gold-dark', theme.goldDark);
    root.style.setProperty('--sage', theme.sage);
    root.style.setProperty('--sage-light', theme.sageLight);
    root.style.setProperty('--sage-dark', theme.sageDark);
    root.style.setProperty('--white', theme.white);
    root.style.setProperty('--cream', theme.cream);
    root.style.setProperty('--ivory', theme.ivory);
    root.style.setProperty('--taupe', theme.taupe);
    root.style.setProperty('--warm-gray', theme.warmGray);
    root.style.setProperty('--charcoal', theme.charcoal);
    root.style.setProperty('--black', theme.black);

    console.log('✓ Theme colors loaded from admin.json');
  },

  // Load text content via data-content attributes
  loadTextContent() {
    if (!this.adminData) return;

    const setTextContent = (selector, value) => {
      const elements = document.querySelectorAll(`[data-content="${selector}"]`);
      if (elements.length > 0 && value) {
        elements.forEach(el => {
          if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            el.value = value;
          } else {
            el.textContent = value;
          }
        });
      }
    };

    // Load labels/template text from admin.json
    if (this.adminData.labels) {
      const labels = this.adminData.labels;
      const loadLabels = (obj, prefix = '') => {
        for (const key in obj) {
          if (typeof obj[key] === 'string') {
            const selectorKey = prefix ? `${prefix}-${key}` : key;
            setTextContent(selectorKey, obj[key]);
          } else if (typeof obj[key] === 'object') {
            loadLabels(obj[key], key);
          }
        }
      };
      loadLabels(labels);
    }

    // Hero content
    if (this.adminData.hero) {
      const hero = this.adminData.hero;
      setTextContent('hero-badge', hero.badge);
      setTextContent('hero-title-1', hero.titleLine1);
      setTextContent('hero-title-2', hero.titleLine2);
      setTextContent('hero-subtitle', hero.subtitle);
      setTextContent('hero-description', hero.description);
      setTextContent('hero-btn-primary', hero.primaryBtn);
      setTextContent('hero-btn-secondary', hero.secondaryBtn);

      // Hero image
      const heroImg = document.querySelector('[data-image-id="hero-main"]');
      if (heroImg && hero.heroImage) heroImg.src = hero.heroImage;
    }

    // About content
    if (this.adminData.about) {
      const about = this.adminData.about;
      setTextContent('about-name', about.name);
      setTextContent('about-title', about.title);
      setTextContent('about-short-bio', about.bio);
      setTextContent('about-full-bio', about.bio);

      // Stats
      const yearsEl = document.querySelector('[data-content="years-experience"]');
      if (yearsEl) yearsEl.setAttribute('data-count', about.years || 15);

      const eventsEl = document.querySelector('[data-content="events-created"]');
      if (eventsEl) eventsEl.setAttribute('data-count', about.events || 500);
    }

    // Settings/Contact content
    if (this.adminData.settings) {
      const settings = this.adminData.settings;
      setTextContent('business-name', settings.businessName);
      setTextContent('tagline', settings.tagline);
      setTextContent('phone', settings.phone);
      setTextContent('email', settings.email);
      setTextContent('address', settings.address);

      // Update phone and email links
      document.querySelectorAll('a[data-content="phone"]').forEach(el => {
        el.href = `tel:${settings.phone.replace(/\D/g, '')}`;
      });
      document.querySelectorAll('a[data-content="email"]').forEach(el => {
        el.href = `mailto:${settings.email}`;
      });
    }
  },

  // Load images via data-image-id attributes
  loadImages() {
    if (!this.adminData) return;

    // Combine both image sources: structured images and flat imageMap
    const imageMap = this.adminData.imageMap || {};
    const flatImages = { ...imageMap };

    // Also flatten nested images structure if it exists
    if (this.adminData.images) {
      const images = this.adminData.images;
      const traverse = (obj) => {
        for (const key in obj) {
          if (obj[key] && typeof obj[key] === 'object' && 'url' in obj[key]) {
            flatImages[obj[key].id] = obj[key].url;
          } else if (obj[key] && typeof obj[key] === 'object') {
            traverse(obj[key]);
          }
        }
      };
      traverse(images);
    }

    // Apply images to all elements with data-image-id
    document.querySelectorAll('[data-image-id]').forEach(img => {
      const id = img.getAttribute('data-image-id');
      if (flatImages[id]) {
        // Handle both object format and string format
        const url = typeof flatImages[id] === 'string' ? flatImages[id] : flatImages[id].url;
        if (url) img.src = url;
      }
    });
  },

  // Load services dynamically
  loadServices() {
    if (!this.adminData || !Array.isArray(this.adminData.services)) return;

    const services = this.adminData.services;

    // Load services by category
    ['floral', 'decor', 'tailoring'].forEach(category => {
      const container = document.querySelector(`[data-service-category="${category}"]`);
      if (!container) return;

      const categoryServices = services.filter(s => s.category === category);
      container.innerHTML = categoryServices.map(s => `
        <div class="offering">
          <h5>${s.type}</h5>
          <p>${s.desc}</p>
          <span class="price">${s.price}</span>
        </div>
      `).join('');
    });
  },

  // Load packages dynamically
  loadPackages() {
    if (!this.adminData || !Array.isArray(this.adminData.packages)) return;

    const packages = this.adminData.packages;
    const container = document.getElementById('packages-list');

    if (!container) return;

    container.innerHTML = packages.map(p => `
      <div class="package-card ${p.featured ? 'featured' : ''}">
        ${p.featured ? '<div class="package-badge">Most Popular</div>' : ''}
        <h3>${p.title}</h3>
        <p class="package-desc">${p.description}</p>
        <ul>
          ${(p.includes || []).map(item => `<li>${item}</li>`).join('')}
        </ul>
        <span class="package-price">${p.price}</span>
        <a href="contact.html" class="btn ${p.featured ? 'btn-primary' : 'btn-outline'}">Inquire</a>
      </div>
    `).join('');
  },

  // Load testimonials dynamically
  loadTestimonials() {
    if (!this.adminData || !Array.isArray(this.adminData.testimonials)) return;

    const testimonials = this.adminData.testimonials.sort((a, b) => (a.order || 99) - (b.order || 99));
    const container = document.querySelector('.testimonials-slider');

    if (!container || testimonials.length === 0) return;

    container.innerHTML = testimonials.map((t, i) => `
      <div class="testimonial ${i === 0 ? 'active' : ''}">
        <blockquote><p>"${t.quote}"</p></blockquote>
        <div class="testimonial-author">
          <div class="author-avatar">${t.initials || t.name.charAt(0)}</div>
          <div class="author-info">
            <strong>${t.name}</strong>
            <span>${t.event}</span>
          </div>
        </div>
      </div>
    `).join('');

    // Setup testimonial navigation
    const dotsContainer = document.querySelector('.testimonial-nav');
    if (dotsContainer) {
      dotsContainer.innerHTML = testimonials.map((_, i) =>
        `<button class="nav-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></button>`
      ).join('');

      document.querySelectorAll('.nav-dot').forEach(dot => {
        dot.addEventListener('click', function() {
          const idx = parseInt(this.dataset.index);
          document.querySelectorAll('.nav-dot').forEach(d => d.classList.remove('active'));
          this.classList.add('active');

          document.querySelectorAll('.testimonial').forEach((t, i) => {
            if (i === idx) {
              t.classList.add('active');
              t.style.opacity = '1';
              t.style.visibility = 'visible';
            } else {
              t.classList.remove('active');
              t.style.opacity = '0';
              t.style.visibility = 'hidden';
            }
          });
        });
      });
    }
  },

  // Load gallery items dynamically
  loadGallery() {
    if (!this.adminData || !this.adminData.gallery) return;

    const gallery = this.adminData.gallery;
    const container = document.querySelector('.gallery-grid');

    if (!container) return;

    const items = Object.values(gallery).filter(item => item && item.url);

    container.innerHTML = items.map(item => `
      <div class="gallery-item" data-category="${item.category || 'all'}">
        <img src="${item.url}" alt="${item.title || 'Gallery item'}" data-image-id="${item.id}">
        <div class="gallery-overlay">
          <h3>${item.title || ''}</h3>
          <p>${item.category || ''}</p>
        </div>
      </div>
    `).join('');

    // Setup gallery filters if they exist
    const filterButtons = document.querySelectorAll('[data-filter]');
    if (filterButtons.length > 0) {
      filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
          const filter = this.dataset.filter;
          filterButtons.forEach(b => b.classList.remove('active'));
          this.classList.add('active');

          document.querySelectorAll('.gallery-item').forEach(item => {
            if (filter === 'all' || item.dataset.category === filter) {
              item.style.display = 'block';
            } else {
              item.style.display = 'none';
            }
          });
        });
      });
    }
  },

  // Load FAQ dynamically
  loadFaq() {
    if (!this.adminData || !Array.isArray(this.adminData.faq)) return;

    const faq = this.adminData.faq;
    const container = document.getElementById('faq-list');

    if (!container) return;

    container.innerHTML = faq.map(f => `
      <div class="faq-item">
        <h4>${f.question}</h4>
        <p>${f.answer}</p>
      </div>
    `).join('');
  },

  // Initialize everything
  async init() {
    console.log('🚀 Initializing ContentLoader...');

    // Load master admin.json file
    await this.loadAdminData();

    if (!this.adminData) {
      console.error('Failed to load admin.json - pages may display incorrectly');
      return;
    }

    // Apply theme first (before any rendering)
    this.loadTheme();

    // Load all content in parallel
    await Promise.all([
      Promise.resolve(this.loadTextContent()),
      Promise.resolve(this.loadImages()),
      Promise.resolve(this.loadServices()),
      Promise.resolve(this.loadPackages()),
      Promise.resolve(this.loadTestimonials()),
      Promise.resolve(this.loadGallery()),
      Promise.resolve(this.loadFaq())
    ]);

    console.log('✓ All content loaded from admin.json');
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ContentLoader.init());
} else {
  ContentLoader.init();
}
