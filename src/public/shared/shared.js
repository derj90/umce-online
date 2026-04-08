/**
 * UMCE.online — Shared JavaScript
 * Partial loader, navigation, scroll observer, utilities
 */

(function () {
  'use strict';

  // ==========================================
  // Analytics (GA4 + Clarity) — carga siempre
  // ==========================================
  (function loadAnalytics() {
    var s = document.createElement('script');
    s.src = '/shared/analytics.js';
    s.async = true;
    document.head.appendChild(s);
  })();

  // Enable fade-up animations (content visible by default for crawlers/print)
  document.documentElement.classList.add('js-loaded');

  // ==========================================
  // Partial Loader
  // ==========================================
  async function loadPartial(placeholderId, url) {
    const el = document.getElementById(placeholderId);
    if (!el) return;
    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`Failed to load ${url}`);
      el.innerHTML = await resp.text();
    } catch (err) {
      console.warn(`Could not load partial ${url}:`, err.message);
    }
  }

  async function loadSharedComponents() {
    const loadPromises = [
      loadPartial('nav-placeholder', '/shared/nav.html'),
      loadPartial('footer-placeholder', '/shared/footer.html'),
    ];
    // Load chatbot on all pages (auto-create placeholder if missing)
    if (!document.getElementById('chatbot-placeholder')) {
      var cp = document.createElement('div');
      cp.id = 'chatbot-placeholder';
      document.body.appendChild(cp);
    }
    loadPromises.push(loadPartial('chatbot-placeholder', '/shared/chatbot.html'));
    await Promise.all(loadPromises);

    // Initialize nav after loading
    initNavigation();
    // Initialize scroll observer
    initScrollObserver();
    // Check admin role and show admin button
    checkAdminAccess();
    // Update nav for logged-in users
    checkAuthState();

    // Set chatbot mode: inline on /ayuda and /virtualizacion/asistente, floating FAB everywhere else
    const chatContainer = document.getElementById('umce-chatbot');
    if (chatContainer) {
      const path = window.location.pathname;
      const isInline = path === '/ayuda' || path === '/ayuda/' ||
                       path === '/virtualizacion/asistente' || path === '/virtualizacion/asistente/';
      chatContainer.setAttribute('data-mode', isInline ? 'inline' : 'floating');
    }
  }

  // ==========================================
  // Navigation
  // ==========================================
  function initNavigation() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    // Highlight current page
    const currentPath = window.location.pathname;
    navbar.querySelectorAll('.nav-link[data-page]').forEach(link => {
      const href = link.getAttribute('href');
      if (
        (href === '/' && currentPath === '/') ||
        (href !== '/' && currentPath.startsWith(href))
      ) {
        link.classList.add('active');
      }
    });

    // Nav: glass over dark hero, solid on other pages or after scroll
    const hasHero = !!document.querySelector('[data-hero-bg]');
    const solidBg = 'rgba(17,24,39,0.97)';
    const glassBg = 'rgba(0,0,0,0.15)';

    function setNavBg(bg) {
      navbar.style.background = bg;
      navbar.style.backdropFilter = 'blur(12px)';
      navbar.style.webkitBackdropFilter = 'blur(12px)';
    }

    // Pages without hero: always solid dark
    if (!hasHero) setNavBg(solidBg);

    function onScroll() {
      if (window.scrollY > 80) {
        navbar.classList.add('nav-scrolled');
        setNavBg(solidBg);
      } else {
        navbar.classList.remove('nav-scrolled');
        setNavBg(hasHero ? glassBg : solidBg);
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Mobile menu toggle
    const menuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    if (menuBtn && mobileMenu) {
      menuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
      });
      mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => mobileMenu.classList.add('hidden'));
      });
    }
  }

  // ==========================================
  // Scroll Observer (fade-up animations)
  // ==========================================
  function initScrollObserver() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));

    // Re-observe if new elements are added dynamically
    window._umceObserver = observer;
  }

  // ==========================================
  // Admin Access Button
  // ==========================================
  async function checkAdminAccess() {
    try {
      const res = await fetch('/api/admin/role');
      if (!res.ok) return;
      const data = await res.json();
      if (!data.role) return;

      // Inject admin + PIAC buttons in desktop nav (before CTA div)
      const cta = document.querySelector('#navbar .flex.items-center.gap-3:last-child');
      if (cta) {
        // PIAC panel button
        const piacBtn = document.createElement('a');
        piacBtn.href = '/piac';
        piacBtn.className = 'inline-flex items-center gap-1.5 bg-white/15 text-white font-medium text-xs px-3 py-2 rounded-lg hover:bg-white/25 transition-colors border border-white/20';
        piacBtn.innerHTML = '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg> PIAC';
        cta.insertBefore(piacBtn, cta.firstChild);

        // Admin button
        const btn = document.createElement('a');
        btn.href = '/admin';
        btn.className = 'inline-flex items-center gap-1.5 bg-white/15 text-white font-medium text-xs px-3 py-2 rounded-lg hover:bg-white/25 transition-colors border border-white/20';
        btn.innerHTML = '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg> Admin';
        cta.insertBefore(btn, cta.firstChild);
      }

      // Inject in mobile menu too
      const mobileMenu = document.querySelector('#mobile-menu .flex.flex-col');
      if (mobileMenu) {
        const mobilePiacBtn = document.createElement('a');
        mobilePiacBtn.href = '/piac';
        mobilePiacBtn.className = 'mt-2 inline-flex items-center justify-center gap-2 bg-white/15 text-white font-bold text-sm px-5 py-2.5 rounded-lg border border-white/20';
        mobilePiacBtn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg> Panel PIAC';
        mobileMenu.appendChild(mobilePiacBtn);

        const mobileBtn = document.createElement('a');
        mobileBtn.href = '/admin';
        mobileBtn.className = 'mt-2 inline-flex items-center justify-center gap-2 bg-white/15 text-white font-bold text-sm px-5 py-2.5 rounded-lg border border-white/20';
        mobileBtn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg> Panel Admin';
        mobileMenu.appendChild(mobileBtn);
      }
    } catch { /* not logged in or no role — silently ignore */ }
  }

  // ==========================================
  // Auth State — update nav when logged in
  // ==========================================
  async function checkAuthState() {
    try {
      const res = await fetch('/auth/me');
      if (!res.ok) return;
      const user = await res.json();
      if (!user || !user.email) return;

      // Expose auth state globally so other page scripts can detect login
      window._umceAuth = user;
      window.umceUser = user;
      // Dispatch event so pages listening for auth resolution can react
      document.dispatchEvent(new CustomEvent('umce:auth-ready', { detail: user }));

      const initial = (user.name || user.email)[0].toUpperCase();
      const firstName = (user.name || user.email.split('@')[0]).split(' ')[0];

      // Desktop: replace "Mis cursos" CTA with user menu
      const cta = document.querySelector('#navbar .flex.items-center.gap-3:last-child');
      if (cta) {
        const misCursosBtn = cta.querySelector('a[href="/mis-cursos"]');
        if (misCursosBtn) {
          misCursosBtn.outerHTML =
            '<a href="/mis-cursos" class="hidden sm:inline-flex items-center gap-2 font-heading font-bold text-sm px-4 py-2.5 rounded-lg transition-colors" style="background: var(--palette-accent); color: #001D5C;">' +
              '<div class="w-6 h-6 rounded-full bg-black/20 flex items-center justify-center text-xs font-bold" style="color: #001D5C;">' + initial + '</div>' +
              firstName +
            '</a>' +
            '<button onclick="if(confirm(\'¿Cerrar sesión?\'))window.location=\'/auth/logout\'" class="hidden sm:inline-flex items-center text-white/50 hover:text-white/90 text-[11px] transition-colors cursor-pointer bg-transparent border-0 px-2 py-1">' +
              'Salir' +
            '</button>';
        }
      }

      // Mobile: update mis-cursos link
      const mobileMenu = document.querySelector('#mobile-menu .flex.flex-col');
      if (mobileMenu) {
        const mobileBtn = mobileMenu.querySelector('a[href="/mis-cursos"]');
        if (mobileBtn) {
          mobileBtn.innerHTML =
            '<div class="w-6 h-6 rounded-full bg-black/20 flex items-center justify-center text-xs font-bold" style="color: #001D5C;">' + initial + '</div> ' +
            'Mis cursos';
        }
        // Add logout link with confirmation
        const logoutLink = document.createElement('button');
        logoutLink.className = 'py-2 text-white/50 hover:text-white text-sm text-left bg-transparent border-0 cursor-pointer';
        logoutLink.textContent = 'Cerrar sesión';
        logoutLink.onclick = function() { if (confirm('¿Cerrar sesión?')) window.location = '/auth/logout'; };
        mobileMenu.appendChild(logoutLink);
      }
    } catch { /* not logged in — keep default nav */ }
  }

  // ==========================================
  // Utilities
  // ==========================================

  /** Format date to Chilean locale */
  function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  /** Format short date */
  function formatDateShort(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  /** Truncate text */
  function truncate(text, maxLen = 150) {
    if (!text || text.length <= maxLen) return text || '';
    return text.substring(0, maxLen).replace(/\s+\S*$/, '') + '...';
  }

  /** Strip HTML tags */
  function stripHtml(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || '';
  }

  /** Escape HTML entities (XSS prevention) */
  function esc(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /** Get URL parameter */
  function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  /** Get slug from URL path (e.g., /programa/diplomado-ia → diplomado-ia) */
  function getSlugFromPath() {
    const parts = window.location.pathname.split('/').filter(Boolean);
    return parts.length >= 2 ? parts[parts.length - 1] : null;
  }

  /** Generate badge class from type */
  function typeBadgeClass(type) {
    const map = {
      diplomado: 'badge-diplomado',
      curso_abierto: 'badge-curso',
      ruta_formativa: 'badge-ruta',
      magister: 'badge-magister',
      prosecucion: 'badge-prosecucion',
      certificacion: 'badge-certificacion',
      postitulo: 'badge-diplomado',
    };
    return map[type] || 'badge-curso';
  }

  /** Generate human-readable type label */
  function typeLabel(type) {
    const map = {
      diplomado: 'Diplomado',
      curso_abierto: 'Curso',
      ruta_formativa: 'Ruta Formativa',
      magister: 'Magíster',
      prosecucion: 'Prosecución',
      postitulo: 'Postítulo',
      certificacion: 'Certificación',
    };
    return map[type] || type;
  }

  /** Status badge class */
  function statusBadgeClass(status) {
    const map = {
      active: 'badge-active',
      upcoming: 'badge-upcoming',
      closed: 'badge-closed',
      informativo: 'badge-closed',
    };
    return map[status] || 'badge-closed';
  }

  /** Status label */
  function statusLabel(status) {
    const map = {
      active: 'Inscripciones abiertas',
      upcoming: 'Próximamente',
      closed: 'Finalizado',
      informativo: 'Informativo',
      in_progress: 'En curso',
    };
    return map[status] || status;
  }

  /** Create skeleton loading cards */
  function renderSkeletons(container, count = 6) {
    container.innerHTML = Array.from({ length: count }, () => `
      <div class="bg-white rounded-2xl overflow-hidden border border-gray-100">
        <div class="skeleton h-36"></div>
        <div class="p-5 space-y-3">
          <div class="skeleton h-4 w-20"></div>
          <div class="skeleton h-5 w-3/4"></div>
          <div class="skeleton h-4 w-full"></div>
          <div class="skeleton h-4 w-1/2"></div>
        </div>
      </div>
    `).join('');
  }

  /** Observe new elements for fade-up animation */
  function observeNewElements(container) {
    if (!container) return;
    const elements = container.querySelectorAll('.fade-up');
    if (window._umceObserver) {
      elements.forEach(el => window._umceObserver.observe(el));
    } else {
      // Observer not ready yet — make elements visible immediately
      elements.forEach(el => el.classList.add('visible'));
    }
  }

  // ==========================================
  // Expose API
  // ==========================================
  window.UMCE = {
    loadSharedComponents,
    loadPartial,
    formatDate,
    formatDateShort,
    truncate,
    stripHtml,
    getParam,
    getSlugFromPath,
    typeBadgeClass,
    typeLabel,
    statusBadgeClass,
    statusLabel,
    renderSkeletons,
    observeNewElements,
    esc,
  };

  // ==========================================
  // Capacitor App — Link Interceptor
  // ==========================================
  // When running inside the native app, intercept target="_blank" links
  // so internal domains stay in the WebView instead of opening system browser.
  function initAppLinkInterceptor() {
    var isApp = window.Capacitor && window.Capacitor.isNativePlatform &&
                window.Capacitor.isNativePlatform();
    if (!isApp) return;

    // Domains that should stay inside the WebView
    var internalPatterns = [
      /\.udfv\.cloud$/,
      /\.umce\.cl$/,
      /^virtual\.udfv\.cloud$/,
      /^dashboard\.udfv\.cloud$/,
      /^evirtual\.umce\.cl$/,
      /^evirtual-practica\.umce\.cl$/,
      /^evirtual-pregrado\.umce\.cl$/,
      /^evirtual-postgrado\.umce\.cl$/,
      /^virtual\.umce\.cl$/,
      /^ucampus\.umce\.cl$/,
      /^postgrado\.umce\.cl$/,
      /^www\.umce\.cl$/,
    ];

    function isInternal(hostname) {
      for (var i = 0; i < internalPatterns.length; i++) {
        if (internalPatterns[i].test(hostname)) return true;
      }
      return false;
    }

    // --- Intercept target="_blank" links for internal domains ---
    document.addEventListener('click', function (e) {
      var link = e.target.closest('a[target="_blank"]');
      if (!link) return;

      var href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;

      try {
        var url = new URL(href, window.location.origin);

        if (isInternal(url.hostname)) {
          // Internal domain — navigate within the WebView
          e.preventDefault();
          window.location.href = url.href;
        }
        // External domains (Google Docs, Telegram, etc.) — let Capacitor
        // open them in the system browser, which is the correct UX for
        // truly external content.
      } catch (_) {
        // Malformed URL — ignore
      }
    }, true);

    // --- Intercept Google OAuth login to use ASWebAuthenticationSession ---
    // Google blocks OAuth inside WebViews (403 disallowed_useragent).
    // We open it in the system auth browser via a native plugin, then
    // exchange the resulting one-time token for a session cookie.
    var OAuthPlugin = window.Capacitor.Plugins.OAuthPlugin;
    if (OAuthPlugin) {
      document.addEventListener('click', function (e) {
        var link = e.target.closest('a[href^="/auth/login"]');
        if (!link) return;

        e.preventDefault();
        var href = link.getAttribute('href');
        var separator = href.indexOf('?') !== -1 ? '&' : '?';
        var oauthUrl = window.location.origin + href + separator + 'from_app=1';

        OAuthPlugin.startOAuth({
          url: oauthUrl,
          callbackScheme: 'cl.umce.virtual'
        }).then(function (result) {
          // result.url = 'cl.umce.virtual://auth-complete?token=XXX'
          try {
            var parsed = new URL(result.url);
            var token = parsed.searchParams.get('token');
            if (token) {
              window.location.href = '/auth/app-session?token=' + encodeURIComponent(token);
            }
          } catch (_) {}
        }).catch(function (err) {
          console.warn('[OAuth] Auth cancelled or failed:', err);
        });
      }, true);
    }
  }

  // ==========================================
  // Capacitor App — Native App Mode Setup
  // ==========================================
  function initNativeAppMode() {
    // Capacitor bridge may not be injected yet on remote URLs.
    // Retry a few times before giving up.
    function checkCapacitor(attempts) {
      var isApp = window.Capacitor && window.Capacitor.isNativePlatform &&
                  window.Capacitor.isNativePlatform();
      if (!isApp) {
        if (attempts > 0) {
          setTimeout(function () { checkCapacitor(attempts - 1); }, 200);
        }
        return;
      }
      setupNativeApp();
    }
    checkCapacitor(10); // Try for up to 2 seconds
  }

  function setupNativeApp() {
    if (document.body.classList.contains('is-native-app')) return;

    // Mark body so CSS can apply app-specific overrides
    document.body.classList.add('is-native-app');

    // Inject bottom navigation bar
    var currentPath = window.location.pathname;
    function isActive(path) {
      if (path === '/' && currentPath === '/') return true;
      if (path !== '/' && currentPath.startsWith(path)) return true;
      return false;
    }
    function cls(path) {
      return isActive(path) ? 'active' : '';
    }

    var nav = document.createElement('nav');
    nav.id = 'app-bottom-nav';
    nav.setAttribute('aria-label', 'Navegación principal');
    nav.innerHTML =
      '<a href="/" class="' + cls('/') + '" aria-label="Inicio">' +
        '<svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955a1.126 1.126 0 0 1 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/></svg>' +
        '<span>Inicio</span>' +
      '</a>' +
      '<a href="/mis-cursos" class="' + cls('/mis-cursos') + '" aria-label="Mis Cursos">' +
        '<svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a23.838 23.838 0 0 0-1.012 5.434l-.122.06c-.467.218-.954.43-1.458.637a.75.75 0 0 1-.76-.056l-.072-.054A25.03 25.03 0 0 0 4.26 10.147M12 3v1.5M12 3c2.662 0 5.247.428 7.644 1.22M12 3c-2.662 0-5.247.428-7.644 1.22M12 4.5c2.01 0 3.96.273 5.818.795M12 4.5c-2.01 0-3.96.273-5.818.795"/></svg>' +
        '<span>Mis Cursos</span>' +
      '</a>' +
      '';

    document.body.appendChild(nav);

    // Full-screen chat on Ayuda page
    if (currentPath === '/ayuda' || currentPath === '/ayuda.html') {
      setupAyudaAppMode();
    }
  }

  function setupAyudaAppMode() {
    // Wait for chatbot to load (it's loaded async via shared components)
    var attempts = 0;
    var interval = setInterval(function () {
      var panel = document.getElementById('chat-panel');
      attempts++;
      if (!panel && attempts < 30) return;
      clearInterval(interval);
      if (!panel) return;

      // Hide everything except the chatbot
      var hero = document.querySelector('.ayuda-hero');
      var quickLinks = document.querySelector('.ayuda-quick-links');
      var sections = document.querySelectorAll('#sistemas, #equipo, #faq, #contacto');
      if (hero) hero.style.display = 'none';
      if (quickLinks) quickLinks.style.display = 'none';
      sections.forEach(function (s) { s.style.display = 'none'; });

      // Hide chatbot section title
      var chatSection = document.querySelector('.ayuda-chatbot-section');
      if (chatSection) {
        var titleDiv = chatSection.querySelector('.text-center');
        if (titleDiv) titleDiv.style.display = 'none';
      }

      // Body: white bg, no scroll
      document.body.style.cssText += '; background:#fff; overflow:hidden;';

      // CSS overrides are in chatbot.html <style> block (body.is-native-app selectors)

      // Ensure send button is visible
      var sendBtn = document.getElementById('chat-send');
      if (sendBtn) {
        sendBtn.style.flexShrink = '0';
        sendBtn.style.minWidth = '44px';
      }

      // Hide body scroll since chat is fixed full screen
      document.querySelector('.ayuda-main').style.cssText = 'padding:0; margin:0; max-width:100%; overflow:hidden;';

    }, 200);
  }

  // Auto-load shared components on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      loadSharedComponents();
      initAppLinkInterceptor();
      initNativeAppMode();
    });
  } else {
    loadSharedComponents();
    initAppLinkInterceptor();
    initNativeAppMode();
  }

  // ==========================================
  // Content Protection (skip for admins)
  // ==========================================
  function initContentProtection() {
    // Wait for auth check — if admin, skip protection entirely
    function isAdmin() {
      var u = window._umceAuth || window.umceUser;
      return u && u.email && (
        u.email === 'david.reyes_j@umce.cl' ||
        u.email === 'udfv@umce.cl'
      );
    }

    // Delay to let checkAuthState() resolve first
    setTimeout(function () {
      if (isAdmin()) {
        // Remove CSS protection for admin
        document.body.style.userSelect = 'auto';
        document.body.style.webkitUserSelect = 'auto';
        return;
      }

      // Disable right-click context menu (except on inputs)
      document.addEventListener('contextmenu', function (e) {
        var tag = (e.target.tagName || '').toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
        e.preventDefault();
      });

      // Disable common copy shortcuts on page content (allow in inputs)
      document.addEventListener('keydown', function (e) {
        var tag = (e.target.tagName || '').toLowerCase();
        if (tag === 'input' || tag === 'textarea') return;
        if ((e.ctrlKey || e.metaKey) && ['c', 'u', 's', 'a'].includes(e.key.toLowerCase())) {
          if (e.key.toLowerCase() === 'c' && e.target.closest('#chat-messages')) return;
          e.preventDefault();
        }
        if (e.key === 'F12') e.preventDefault();
      });

      // Disable image dragging
      document.addEventListener('dragstart', function (e) {
        if (e.target.tagName === 'IMG') e.preventDefault();
      });
    }, 1500); // wait for auth check
  }
  initContentProtection();
})();
