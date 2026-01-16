/**
 * JLC Studio Content Loader
 * Loads content from admin.json - Single Source of Truth
 */

const ContentLoader = {
  dataPath: '/_data',
  adminData: null,

  async loadAdminData() {
    try {
      const response = await fetch(`${this.dataPath}/admin.json?t=${Date.now()}`);
      if (!response.ok) throw new Error('Failed to load admin.json');
      this.adminData = await response.json();
      console.log('Admin data loaded from single source of truth');
      return this.adminData;
    } catch (error) {
      console.warn('Failed to load admin.json:', error);
      return null;
    }
  },

  async loadSettings() {
    if (!this.adminData) return;
    const settings = this.adminData.settings;
    if (!settings) return;

    // Update phone numbers
    document.querySelectorAll('[data-content="phone"]').forEach(el => {
      el.textContent = settings.phone;
      if (el.href) el.href = `tel:${settings.phone.replace(/\D/g, '')}`;
    });

    // Update email
    document.querySelectorAll('[data-content="email"]').forEach(el => {
      el.textContent = settings.email;
      if (el.href) el.href = `mailto:${settings.email}`;
    });

    // Update address
    document.querySelectorAll('[data-content="address"]').forEach(el => {
      el.textContent = settings.address;
    });
  },

  async loadHero() {
    if (!this.adminData) return;
    const hero = this.adminData.hero;
    if (!hero) return;

    const selectors = {
      'hero-badge': 'badge',
      'hero-title-1': 'titleLine1',
      'hero-title-2': 'titleLine2',
      'hero-subtitle': 'subtitle',
      'hero-description': 'description',
      'hero-btn-primary': 'primaryBtn',
      'hero-btn-secondary': 'secondaryBtn'
    };

    Object.entries(selectors).forEach(([selector, key]) => {
      const el = document.querySelector(`[data-content="${selector}"]`);
      if (el && hero[key]) el.textContent = hero[key];
    });

    // Update hero image
    const heroImg = document.querySelector('[data-content="hero-image"]');
    if (heroImg && hero.heroImage) {
      heroImg.src = hero.heroImage;
    }
  },

  async loadAbout() {
    if (!this.adminData) return;
    const about = this.adminData.about;
    if (!about) return;

    // Update name
    document.querySelectorAll('[data-content="about-name"]').forEach(el => {
      el.textContent = about.name;
    });

    // Update title
    document.querySelectorAll('[data-content="about-title"]').forEach(el => {
      el.textContent = about.title;
    });

    // Update bio
    const shortBio = document.querySelector('[data-content="about-short-bio"]');
    if (shortBio) shortBio.textContent = about.bio || '';

    const fullBio = document.querySelector('[data-content="about-full-bio"]');
    if (fullBio && about.bio) fullBio.textContent = about.bio;

    // Update stats
    const yearsEl = document.querySelector('[data-content="years-experience"]');
    if (yearsEl) yearsEl.setAttribute('data-count', about.years || 15);

    const eventsEl = document.querySelector('[data-content="events-created"]');
    if (eventsEl) eventsEl.setAttribute('data-count', about.events || 500);

    // Update photo from images.json in admin data
    if (this.adminData.images && this.adminData.images.about && this.adminData.images.about.profile) {
      const photoUrl = this.adminData.images.about.profile.url;
      const photo = document.querySelector('[data-content="about-photo"]');
      if (photo && photoUrl) photo.src = photoUrl;
    }
  },

  async loadImages() {
    if (!this.adminData || !this.adminData.images) return;

    const images = this.adminData.images;

    // Flatten images object to lookup by ID
    const flatImages = {};
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

    // Update all images with data-image-id
    document.querySelectorAll('[data-image-id]').forEach(img => {
      const id = img.getAttribute('data-image-id');
      if (flatImages[id]) {
        img.src = flatImages[id];
      }
    });
  },

  async loadTestimonials() {
    try {
      if (!this.adminData || !Array.isArray(this.adminData.testimonials)) return;

      const testimonials = this.adminData.testimonials.sort((a, b) => (a.order || 99) - (b.order || 99));

      const container = document.querySelector('.testimonials-slider');
      if (!container || testimonials.length === 0) return;

      container.innerHTML = testimonials.map((t, i) => `
        <div class="testimonial ${i === 0 ? 'active' : ''}">
          <blockquote><p>"${t.quote}"</p></blockquote>
          <div class="testimonial-author">
            <div class="author-avatar">${t.initials}</div>
            <div class="author-info">
              <strong>${t.name}</strong>
              <span>${t.event}</span>
            </div>
          </div>
        </div>
      `).join('');

    } catch (error) {
      console.warn('Could not load testimonials', error);
    }
  },

  async init() {
    // Load the single master admin.json file
    await this.loadAdminData();

    // Load all content sections
    await Promise.all([
      this.loadSettings(),
      this.loadHero(),
      this.loadAbout(),
      this.loadImages(),
      this.loadTestimonials()
    ]);

    console.log('JLC Studio content loaded from admin.json');
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  ContentLoader.init();
});
