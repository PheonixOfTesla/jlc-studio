/**
 * JLC Studio Content Loader
 * SINGLE SOURCE OF TRUTH: admin.json
 * ALL content on the site comes from this file
 * Changes in admin portal → admin.json → instant site update
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

    console.log('✓ Theme colors applied');
  },

  // Universal text content loader
  setContent(selector, value) {
    if (!value) return;
    const elements = document.querySelectorAll(`[data-content="${selector}"]`);
    elements.forEach(el => {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.value = value;
      } else {
        el.textContent = value;
      }
    });
  },

  // Load all text content
  loadTextContent() {
    if (!this.adminData) return;

    const { hero, about, settings, labels } = this.adminData;

    // Hero content
    if (hero) {
      this.setContent('hero-badge', hero.badge);
      this.setContent('hero-title-1', hero.titleLine1);
      this.setContent('hero-title-2', hero.titleLine2);
      this.setContent('hero-subtitle', hero.subtitle);
      this.setContent('hero-description', hero.description);
      this.setContent('hero-btn-primary', hero.primaryBtn);
      this.setContent('hero-btn-secondary', hero.secondaryBtn);
    }

    // About content
    if (about) {
      this.setContent('about-name', about.name);
      this.setContent('about-title', about.title);
      this.setContent('about-short-bio', about.bio);
      this.setContent('about-full-bio', about.bio);
      this.setContent('about-quote', about.quote);

      // Stats with data-count attribute
      const yearsEl = document.querySelector('[data-content="years-experience"]');
      if (yearsEl) yearsEl.setAttribute('data-count', about.years || 15);

      const eventsEl = document.querySelector('[data-content="events-created"]');
      if (eventsEl) eventsEl.setAttribute('data-count', about.events || 500);
    }

    // Settings/Contact content - used everywhere (footer, contact page, etc.)
    if (settings) {
      this.setContent('business-name', settings.businessName);
      this.setContent('businessName', settings.businessName);
      this.setContent('tagline', settings.tagline);
      this.setContent('phone', settings.phone);
      this.setContent('email', settings.email);
      this.setContent('address', settings.address);
      this.setContent('hours', settings.hours);
      this.setContent('service-area', settings.serviceArea);

      // Update all phone links
      document.querySelectorAll('[data-link="phone"]').forEach(el => {
        el.href = `tel:${settings.phone.replace(/\D/g, '')}`;
        el.textContent = settings.phone;
      });

      // Update all email links
      document.querySelectorAll('[data-link="email"]').forEach(el => {
        el.href = `mailto:${settings.email}`;
        el.textContent = settings.email;
      });

      // Update email icon (just href, keep the @ symbol)
      document.querySelectorAll('[data-link="email-icon"]').forEach(el => {
        el.href = `mailto:${settings.email}`;
      });

      // Update social links
      document.querySelectorAll('[data-link="instagram"]').forEach(el => {
        el.href = settings.instagram || '#';
      });
      document.querySelectorAll('[data-link="pinterest"]').forEach(el => {
        el.href = settings.pinterest || '#';
      });
    }

    // Labels - section headings, etc.
    if (labels) {
      // Hero labels
      if (labels.hero) {
        this.setContent('hero-craft', labels.hero.craft);
        this.setContent('hero-craftTitle', labels.hero.craftTitle);
      }

      // Services labels
      if (labels.services) {
        this.setContent('services-expertise', labels.services.expertise);
        this.setContent('services-expertiseTitle', labels.services.expertiseTitle);
        this.setContent('services-expertiseDesc', labels.services.expertiseDesc);
        this.setContent('services-floral', labels.services.floral);
        this.setContent('services-decor', labels.services.decor);
        this.setContent('services-tailoring', labels.services.tailoring);
        this.setContent('services-floralLead', labels.services.floralLead);
        this.setContent('services-floralDesc', labels.services.floralDesc);
        this.setContent('services-decorLead', labels.services.decorLead);
        this.setContent('services-decorDesc', labels.services.decorDesc);
        this.setContent('services-tailoringLead', labels.services.tailoringLead);
        this.setContent('services-tailoringDesc', labels.services.tailoringDesc);
      }

      // Testimonials labels
      if (labels.testimonials) {
        this.setContent('testimonials-heading', labels.testimonials.heading);
        this.setContent('testimonials-subheading', labels.testimonials.subheading);
      }

      // Packages labels
      if (labels.packages) {
        this.setContent('packages-heading', labels.packages.heading);
        this.setContent('packages-title', labels.packages.title);
        this.setContent('packages-description', labels.packages.description);
      }

      // FAQ labels
      if (labels.faq) {
        this.setContent('faq-label', labels.faq.label);
        this.setContent('faq-title', labels.faq.title);
      }

      // Contact labels
      if (labels.contact) {
        this.setContent('contact-label', labels.contact.label);
        this.setContent('contact-heading', labels.contact.heading);
        this.setContent('contact-subtitle', labels.contact.subtitle);
        this.setContent('contact-infoTitle', labels.contact.infoTitle);
        this.setContent('contact-infoLead', labels.contact.infoLead);
      }

      // CTA labels
      if (labels.cta) {
        this.setContent('cta-heading', labels.cta.heading);
        this.setContent('cta-description', labels.cta.description);
      }

      // About page labels
      if (labels.about) {
        this.setContent('about-designer', labels.about.designer);
        this.setContent('about-journey', labels.about.journey);
        this.setContent('about-background', labels.about.background);
        this.setContent('about-expertise', labels.about.expertise);
        this.setContent('about-skillsLabel', labels.about.skillsLabel);
        this.setContent('about-skillsTitle', labels.about.skillsTitle);
      }

      // Page labels
      if (labels.pages) {
        this.setContent('pages-services', labels.pages.services);
        this.setContent('pages-servicesTitle', labels.pages.servicesTitle);
      }

      // Portfolio labels
      if (labels.portfolio) {
        this.setContent('portfolio-label', labels.portfolio.label);
        this.setContent('portfolio-title', labels.portfolio.title);
        this.setContent('portfolio-description', labels.portfolio.description);
      }

      // Booking labels
      if (labels.booking) {
        this.setContent('booking-label', labels.booking.label);
        this.setContent('booking-title', labels.booking.title);
        this.setContent('booking-subtitle', labels.booking.subtitle);
        this.setContent('booking-consultationsTitle', labels.booking.consultationsTitle);
        this.setContent('booking-consultationsDesc', labels.booking.consultationsDesc);
      }

      // Process section labels
      if (labels.process) {
        this.setContent('process-label', labels.process.label);
        this.setContent('process-title', labels.process.title);
        this.setContent('process-step1Title', labels.process.step1Title);
        this.setContent('process-step1Desc', labels.process.step1Desc);
        this.setContent('process-step2Title', labels.process.step2Title);
        this.setContent('process-step2Desc', labels.process.step2Desc);
        this.setContent('process-step3Title', labels.process.step3Title);
        this.setContent('process-step3Desc', labels.process.step3Desc);
        this.setContent('process-step4Title', labels.process.step4Title);
        this.setContent('process-step4Desc', labels.process.step4Desc);
      }

      // About features
      if (labels.aboutFeatures) {
        this.setContent('about-feature1', labels.aboutFeatures.feature1);
        this.setContent('about-feature2', labels.aboutFeatures.feature2);
        this.setContent('about-feature3', labels.aboutFeatures.feature3);
      }
    }

    console.log('✓ Text content loaded');
  },

  // Load images via data-image-id attributes
  loadImages() {
    if (!this.adminData) return;

    const imageMap = this.adminData.imageMap || {};

    document.querySelectorAll('[data-image-id]').forEach(img => {
      const id = img.getAttribute('data-image-id');
      if (imageMap[id]) {
        img.src = imageMap[id];
      }
    });

    // imageMap is the single source of truth for all images

    console.log('✓ Images loaded');
  },

  // Load services by category
  loadServices() {
    if (!this.adminData?.services) return;

    const services = this.adminData.services;

    ['floral', 'decor', 'tailoring'].forEach(category => {
      const container = document.querySelector(`[data-service-category="${category}"]`);
      if (!container) return;

      const categoryServices = services.filter(s => s.category === category);
      container.innerHTML = `
        <div class="offerings">
          ${categoryServices.map(s => `
            <div class="offering">
              <h5>${s.type}</h5>
              <p>${s.desc}</p>
              <span class="price">${s.price}</span>
            </div>
          `).join('')}
        </div>
      `;
    });

    console.log('✓ Services loaded');
  },

  // Load packages
  loadPackages() {
    if (!this.adminData?.packages) return;

    const packages = this.adminData.packages.sort((a, b) => (a.order || 99) - (b.order || 99));
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
        <a href="booking.html" class="btn ${p.featured ? 'btn-primary' : 'btn-outline'}">Inquire</a>
      </div>
    `).join('');

    console.log('✓ Packages loaded');
  },

  // Load testimonials
  loadTestimonials() {
    if (!this.adminData?.testimonials) return;

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

    // Setup navigation dots
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
            t.classList.toggle('active', i === idx);
            t.style.opacity = i === idx ? '1' : '0';
            t.style.visibility = i === idx ? 'visible' : 'hidden';
          });
        });
      });
    }

    console.log('✓ Testimonials loaded');
  },

  // Load FAQ - used on contact page
  loadFaq() {
    if (!this.adminData?.faq) return;

    const faq = this.adminData.faq.sort((a, b) => (a.order || 99) - (b.order || 99));

    // Try multiple possible containers
    const container = document.getElementById('faq-list') || document.querySelector('.faq-grid');

    if (!container) return;

    container.innerHTML = faq.map(f => `
      <div class="faq-item">
        <h4>${f.question}</h4>
        <p>${f.answer}</p>
      </div>
    `).join('');

    console.log('✓ FAQ loaded');
  },

  // Load gallery
  loadGallery() {
    if (!this.adminData?.gallery) return;

    const gallery = Array.isArray(this.adminData.gallery)
      ? this.adminData.gallery
      : Object.values(this.adminData.gallery);

    // Check for category-specific gallery containers first
    const categoryContainers = document.querySelectorAll('[data-gallery-category]');

    if (categoryContainers.length > 0) {
      // Load filtered gallery for category sub-pages
      categoryContainers.forEach(container => {
        const category = container.getAttribute('data-gallery-category');
        const filteredGallery = gallery.filter(item => item && item.url && item.category === category);
        const isCarousel = container.classList.contains('gallery-carousel');

        if (filteredGallery.length === 0) {
          const target = isCarousel ? container.querySelector('[data-carousel-track]') : container;
          if (target) target.innerHTML = `
            <div class="gallery-empty">
              <p>No items in this category yet. Check back soon!</p>
            </div>
          `;
        } else if (isCarousel) {
          // Render as carousel
          const track = container.querySelector('[data-carousel-track]');
          const dotsContainer = container.querySelector('[data-carousel-dots]');

          if (track) {
            track.innerHTML = filteredGallery.map(item => `
              <div class="carousel-slide">
                <img src="${item.url}" alt="${item.title || 'Gallery item'}">
              </div>
            `).join('');
          }

          if (dotsContainer) {
            dotsContainer.innerHTML = filteredGallery.map((_, i) => `
              <button class="carousel-dot ${i === 0 ? 'active' : ''}" data-slide="${i}"></button>
            `).join('');
          }

          // Initialize carousel
          this.initCarousel(container);
        } else {
          container.innerHTML = filteredGallery.map(item => `
            <div class="gallery-item" data-category="${item.category || 'all'}">
              <img src="${item.url}" alt="${item.title || 'Gallery item'}">
              <div class="gallery-overlay">
                <h3>${item.title || ''}</h3>
                <p>${item.category || ''}</p>
              </div>
            </div>
          `).join('');
        }
      });

      console.log('✓ Category gallery loaded');
      return;
    }

    // Standard gallery grid (for pages without category filter)
    const container = document.querySelector('.gallery-grid');

    if (!container) return;

    container.innerHTML = gallery.filter(item => item && item.url).map(item => `
      <div class="gallery-item" data-category="${item.category || 'all'}">
        <img src="${item.url}" alt="${item.title || 'Gallery item'}">
        <div class="gallery-overlay">
          <h3>${item.title || ''}</h3>
          <p>${item.category || ''}</p>
        </div>
      </div>
    `).join('');

    // Setup gallery filters
    document.querySelectorAll('[data-filter]').forEach(btn => {
      btn.addEventListener('click', function() {
        const filter = this.dataset.filter;
        document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
        this.classList.add('active');

        document.querySelectorAll('.gallery-item').forEach(item => {
          item.style.display = (filter === 'all' || item.dataset.category === filter) ? 'block' : 'none';
        });
      });
    });

    // Auto-select category from URL parameter (e.g., ?category=florals)
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');
    if (categoryParam) {
      const filterBtn = document.querySelector(`[data-filter="${categoryParam}"]`);
      if (filterBtn) {
        filterBtn.click();
      }
    }

    console.log('✓ Gallery loaded');
  },

  // Load about page specific content (experience, skills, education)
  loadAboutPage() {
    if (!this.adminData?.about) return;

    const about = this.adminData.about;

    // Experience timeline
    const timelineContainer = document.getElementById('experience-timeline');
    if (timelineContainer && about.experience) {
      timelineContainer.innerHTML = about.experience.map(exp => `
        <div class="experience-item">
          <div class="experience-years">${exp.years}</div>
          <div class="experience-content">
            <h3>${exp.title}</h3>
            <h4>${exp.role}</h4>
            <p>${exp.description}</p>
          </div>
        </div>
      `).join('');
    }

    // Skills
    const skillsContainer = document.getElementById('skills-list');
    if (skillsContainer && about.skills) {
      skillsContainer.innerHTML = about.skills.map(skill => `
        <div class="skill-item">
          <div class="skill-header">
            <span class="skill-name">${skill.name}</span>
            <span class="skill-level">${skill.level}%</span>
          </div>
          <div class="skill-bar">
            <div class="skill-progress" style="width: ${skill.level}%"></div>
          </div>
        </div>
      `).join('');
    }

    // Education
    if (about.education) {
      const edu = about.education;
      const degreeEl = document.getElementById('education-degree');
      const fieldEl = document.getElementById('education-field');
      const instEl = document.getElementById('education-institution');

      if (degreeEl) degreeEl.textContent = edu.degree;
      if (fieldEl) fieldEl.textContent = edu.field;
      if (instEl) instEl.textContent = edu.institution;
    }

    console.log('✓ About page content loaded');
  },

  // Load footer on all pages
  loadFooter() {
    if (!this.adminData?.settings) return;

    const settings = this.adminData.settings;

    // Update all footer contact info
    document.querySelectorAll('.footer-contact address').forEach(address => {
      address.innerHTML = `
        <p data-content="address">${settings.address}</p>
        <p><a href="tel:${settings.phone.replace(/\D/g, '')}" data-link="phone">${settings.phone}</a></p>
        <p><a href="mailto:${settings.email}" data-link="email">${settings.email}</a></p>
      `;
    });

    // Update footer logo/brand
    document.querySelectorAll('.footer-logo').forEach(el => {
      el.textContent = settings.businessName;
    });

    console.log('✓ Footer loaded');
  },

  // Initialize carousel functionality
  initCarousel(container) {
    const track = container.querySelector('[data-carousel-track]');
    const slides = track ? track.querySelectorAll('.carousel-slide') : [];
    const prevBtn = container.querySelector('[data-carousel-prev]');
    const nextBtn = container.querySelector('[data-carousel-next]');
    const dots = container.querySelectorAll('.carousel-dot');

    if (slides.length === 0) return;

    let currentIndex = 0;

    const updateCarousel = () => {
      track.style.transform = `translateX(-${currentIndex * 100}%)`;
      dots.forEach((dot, i) => dot.classList.toggle('active', i === currentIndex));
    };

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + slides.length) % slides.length;
        updateCarousel();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % slides.length;
        updateCarousel();
      });
    }

    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        currentIndex = i;
        updateCarousel();
      });
    });

    console.log('✓ Carousel initialized with', slides.length, 'slides');
  },

  // Initialize everything
  async init() {
    console.log('🚀 ContentLoader initializing...');

    await this.loadAdminData();

    if (!this.adminData) {
      console.error('❌ Failed to load admin.json - site may display incorrectly');
      return;
    }

    // Apply in correct order
    this.loadTheme();
    this.loadTextContent();
    this.loadImages();
    this.loadServices();
    this.loadPackages();
    this.loadTestimonials();
    this.loadFaq();
    this.loadGallery();
    this.loadAboutPage();
    this.loadFooter();

    console.log('✅ All content loaded from admin.json');
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ContentLoader.init());
} else {
  ContentLoader.init();
}
