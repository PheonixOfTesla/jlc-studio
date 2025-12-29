/**
 * JLC Studio Content Loader
 * Loads content from JSON files managed by Decap CMS
 */

const ContentLoader = {
  dataPath: '/_data',

  async loadJSON(file) {
    try {
      const response = await fetch(`${this.dataPath}/${file}`);
      if (!response.ok) throw new Error(`Failed to load ${file}`);
      return await response.json();
    } catch (error) {
      console.warn(`Content not loaded: ${file}`, error);
      return null;
    }
  },

  async loadSettings() {
    const settings = await this.loadJSON('settings.json');
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
    const hero = await this.loadJSON('hero.json');
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
    const about = await this.loadJSON('about.json');
    if (!about) return;

    // Update name
    document.querySelectorAll('[data-content="about-name"]').forEach(el => {
      el.textContent = about.name;
    });

    // Update bio
    const shortBio = document.querySelector('[data-content="about-short-bio"]');
    if (shortBio) shortBio.textContent = about.shortBio;

    const fullBio = document.querySelector('[data-content="about-full-bio"]');
    if (fullBio) fullBio.innerHTML = about.fullBio.replace(/\n\n/g, '</p><p>');

    // Update stats
    const yearsEl = document.querySelector('[data-content="years-experience"]');
    if (yearsEl) yearsEl.setAttribute('data-count', about.yearsExperience);

    const eventsEl = document.querySelector('[data-content="events-created"]');
    if (eventsEl) eventsEl.setAttribute('data-count', about.eventsCreated);

    // Update photo
    const photo = document.querySelector('[data-content="about-photo"]');
    if (photo && about.photo) photo.src = about.photo;
  },

  async loadTestimonials() {
    try {
      // Load all testimonials
      const testimonials = [];
      const files = ['sarah-michael.json', 'lauren.json', 'emily.json'];

      for (const file of files) {
        const data = await this.loadJSON(`testimonials/${file}`);
        if (data) testimonials.push(data);
      }

      testimonials.sort((a, b) => a.order - b.order);

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
    // Load all content sections
    await Promise.all([
      this.loadSettings(),
      this.loadHero(),
      this.loadAbout(),
      this.loadTestimonials()
    ]);

    console.log('JLC Studio content loaded');
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  ContentLoader.init();
});
