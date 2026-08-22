(function () {
  const STORAGE_KEY = 'sentius-cookie-consent';

  const defaults = { necessary: true, analytics: false, marketing: false };

  function getConsent() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function setConsent(consent) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...consent, necessary: true, updatedAt: Date.now() }));
    applyConsent(consent);
  }

  // Hook point: load/unload analytics or marketing scripts based on consent.
  // Example:
  // if (consent.analytics) { /* load Google Analytics, etc. */ }
  function applyConsent(consent) {
    document.dispatchEvent(new CustomEvent('cookieconsentchange', { detail: consent }));
  }

  function buildBanner() {
    const banner = document.createElement('div');
    banner.className = 'cookie-banner';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Cookie consent');
    banner.innerHTML = `
      <div class="cookie-banner-inner">
        <p>We use cookies to keep this site working reliably and to understand how it's used. You can accept all cookies, reject non-essential ones, or manage your preferences.</p>
        <div class="cookie-banner-actions">
          <button type="button" class="btn btn-outline" data-cookie-action="manage">Manage preferences</button>
          <button type="button" class="btn btn-outline" data-cookie-action="reject">Reject non-essential</button>
          <button type="button" class="btn btn-primary" data-cookie-action="accept">Accept all</button>
        </div>
      </div>
    `;
    return banner;
  }

  function buildModal() {
    const overlay = document.createElement('div');
    overlay.className = 'cookie-modal-overlay';
    overlay.innerHTML = `
      <div class="cookie-modal" role="dialog" aria-modal="true" aria-labelledby="cookie-modal-title">
        <button type="button" class="cookie-modal-close" data-cookie-action="close" aria-label="Close">&times;</button>
        <h3 id="cookie-modal-title">Cookie preferences</h3>
        <p class="cookie-modal-intro">Choose which categories of cookies you're happy for us to use. You can change these at any time via "Cookie Settings" in the footer.</p>

        <div class="cookie-category">
          <div class="cookie-category-head">
            <span>Necessary</span>
            <span class="cookie-toggle cookie-toggle-locked" aria-hidden="true"><span class="cookie-toggle-dot"></span></span>
          </div>
          <p>Required for the site to function &mdash; always on.</p>
        </div>

        <div class="cookie-category">
          <div class="cookie-category-head">
            <label for="cookie-analytics">Analytics</label>
            <button type="button" class="cookie-toggle" id="cookie-analytics" role="switch" aria-checked="false" data-category="analytics"><span class="cookie-toggle-dot"></span></button>
          </div>
          <p>Helps us understand how visitors use the site, so we can improve it.</p>
        </div>

        <div class="cookie-category">
          <div class="cookie-category-head">
            <label for="cookie-marketing">Marketing</label>
            <button type="button" class="cookie-toggle" id="cookie-marketing" role="switch" aria-checked="false" data-category="marketing"><span class="cookie-toggle-dot"></span></button>
          </div>
          <p>Used to measure the effectiveness of our outreach. Currently unused on this site.</p>
        </div>

        <div class="cookie-modal-actions">
          <button type="button" class="btn btn-outline" data-cookie-action="reject">Reject non-essential</button>
          <button type="button" class="btn btn-primary" data-cookie-action="save">Save preferences</button>
        </div>
      </div>
    `;
    return overlay;
  }

  function init() {
    const banner = buildBanner();
    const modalOverlay = buildModal();
    document.body.appendChild(banner);
    document.body.appendChild(modalOverlay);

    const toggles = modalOverlay.querySelectorAll('.cookie-toggle[data-category]');

    function setToggleState(consent) {
      toggles.forEach((t) => {
        const on = !!consent[t.dataset.category];
        t.classList.toggle('is-on', on);
        t.setAttribute('aria-checked', String(on));
      });
    }

    function showBanner() { banner.classList.add('is-visible'); }
    function hideBanner() { banner.classList.remove('is-visible'); }
    function openModal() {
      const current = getConsent() || defaults;
      setToggleState(current);
      modalOverlay.classList.add('is-visible');
    }
    function closeModal() { modalOverlay.classList.remove('is-visible'); }

    toggles.forEach((t) => {
      t.addEventListener('click', () => {
        const on = !t.classList.contains('is-on');
        t.classList.toggle('is-on', on);
        t.setAttribute('aria-checked', String(on));
      });
    });

    document.addEventListener('click', (e) => {
      const action = e.target.closest('[data-cookie-action]')?.dataset.cookieAction;
      if (!action) return;

      if (action === 'accept') {
        setConsent({ analytics: true, marketing: true });
        hideBanner();
        closeModal();
      } else if (action === 'reject') {
        setConsent({ analytics: false, marketing: false });
        hideBanner();
        closeModal();
      } else if (action === 'manage') {
        openModal();
      } else if (action === 'save') {
        const consent = {};
        toggles.forEach((t) => { consent[t.dataset.category] = t.classList.contains('is-on'); });
        setConsent(consent);
        hideBanner();
        closeModal();
      } else if (action === 'close') {
        closeModal();
      }
    });

    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });

    // Footer "Cookie Settings" link reopens preferences at any time.
    document.querySelectorAll('[data-cookie-settings]').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        openModal();
      });
    });

    const existing = getConsent();
    if (existing) {
      applyConsent(existing);
    } else {
      showBanner();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
