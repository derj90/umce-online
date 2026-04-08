/**
 * UMCE.online — Chatbot Client V2
 * Floating FAB + inline mode, role detection, enhanced context
 */
(function () {
  'use strict';

  const SESSION_KEY = 'umce_chat_session';
  const CONSENT_KEY = 'umce_chat_beta_consent';
  let sessionToken = null;
  let sending = false;
  let userRole = 'public';
  let userEmail = null;
  let userName = null;
  let isFloating = true;
  let isOpen = false;
  let hasConsent = false;

  // DOM refs
  let fab, fabOpen, fabClose, panel, messages, form, input, sendBtn, quickActions, closeBtn, roleBadge, subtitle;

  function initDom() {
    fab = document.getElementById('chat-fab');
    fabOpen = document.getElementById('chat-fab-open');
    fabClose = document.getElementById('chat-fab-close');
    panel = document.getElementById('chat-panel');
    messages = document.getElementById('chat-messages');
    form = document.getElementById('chat-form');
    input = document.getElementById('chat-input');
    sendBtn = document.getElementById('chat-send');
    quickActions = document.getElementById('chat-quick-actions');
    closeBtn = document.getElementById('chat-close');
    roleBadge = document.getElementById('chat-role-badge');
    subtitle = document.getElementById('chat-subtitle');
    return !!(panel && form && input);
  }

  // ==========================================
  // Mode Detection
  // ==========================================
  function detectMode() {
    const container = document.getElementById('umce-chatbot');
    if (!container) return;
    const mode = container.getAttribute('data-mode');
    isFloating = mode !== 'inline';

    if (!isFloating) {
      // Inline mode: panel always visible, no FAB
      isOpen = true;
    }
  }

  // ==========================================
  // FAB Toggle
  // ==========================================
  function toggleChat() {
    if (!isFloating) return;

    isOpen = !isOpen;
    panel.classList.toggle('open', isOpen);

    if (fabOpen) fabOpen.classList.toggle('hidden', isOpen);
    if (fabClose) fabClose.classList.toggle('hidden', !isOpen);
    if (fab) fab.setAttribute('aria-label', isOpen ? 'Cerrar asistente' : 'Abrir asistente');

    if (isOpen) {
      if (hasConsent) {
        input.focus();
        ensureSession();
      }
    }
  }

  function closeChat() {
    if (!isFloating) return;
    isOpen = false;
    panel.classList.remove('open');
    if (fabOpen) fabOpen.classList.remove('hidden');
    if (fabClose) fabClose.classList.add('hidden');
    if (fab) fab.setAttribute('aria-label', 'Abrir asistente');
  }

  // ==========================================
  // Auth & Role Detection
  // ==========================================
  async function detectUserRole() {
    try {
      const res = await fetch('/auth/me');
      if (!res.ok) return;
      const user = await res.json();
      if (!user || !user.email) return;

      userEmail = user.email;
      userName = user.name || user.email.split('@')[0];

      // Check role
      const roleRes = await fetch('/api/admin/check');
      if (roleRes.ok) {
        const roleData = await roleRes.json();
        if (roleData.isAdmin) {
          userRole = 'admin';
        } else {
          userRole = 'user'; // logged in but not admin — student or teacher
        }
      } else {
        userRole = 'user';
      }

      updateUIForRole();
    } catch {
      // Not logged in — keep public role
    }
  }

  function updateUIForRole() {
    // Update subtitle
    if (subtitle && userName) {
      subtitle.textContent = 'Hola ' + userName.split(' ')[0];
    }

    // Show role badge
    if (roleBadge && userRole !== 'public') {
      const labels = {
        user: 'Conectado con @umce.cl',
        admin: 'Administrador UDFV'
      };
      const classes = {
        user: 'role-student',
        admin: 'role-admin'
      };
      roleBadge.textContent = labels[userRole] || '';
      roleBadge.className = 'px-4 py-1.5 text-[11px] text-center ' + (classes[userRole] || '');
      roleBadge.classList.remove('hidden');
    }

    // Update quick action chips based on role
    updateQuickActions();
  }

  function updateQuickActions() {
    if (!quickActions) return;

    const chips = {
      public: [
        { text: '\u00bfQu\u00e9 cursos hay?', q: '\u00bfQu\u00e9 cursos hay disponibles?' },
        { text: '\u00bfC\u00f3mo me inscribo?', q: '\u00bfC\u00f3mo me inscribo en un curso?' },
        { text: 'No puedo ingresar', q: 'No puedo ingresar a Moodle' },
        { text: 'Estado plataformas', q: '\u00bfCu\u00e1l es el estado de las plataformas Moodle?' },
      ],
      user: [
        { text: 'Mis cursos', q: '\u00bfCu\u00e1les son mis cursos?' },
        { text: 'Mis calificaciones', q: '\u00bfC\u00f3mo veo mis calificaciones?' },
        { text: 'Tareas pendientes', q: '\u00bfTengo tareas pendientes?' },
        { text: 'No puedo ingresar', q: 'No puedo ingresar a Moodle' },
      ],
      admin: [
        { text: 'Estado plataformas', q: '\u00bfCu\u00e1l es el estado de las plataformas?' },
        { text: 'Buscar usuario', q: 'Necesito buscar un usuario en Moodle' },
        { text: 'Estad\u00edsticas', q: '\u00bfCu\u00e1ntos cursos y usuarios hay en total?' },
        { text: 'Mis cursos', q: '\u00bfCu\u00e1les son mis cursos?' },
      ],
    };

    const roleChips = chips[userRole] || chips.public;
    quickActions.innerHTML = roleChips.map(c =>
      '<button class="chat-chip" data-query="' + c.q.replace(/"/g, '&quot;') + '">' + c.text + '</button>'
    ).join('');
  }

  // ==========================================
  // Session Management
  // ==========================================
  async function ensureSession() {
    if (sessionToken) return;
    const saved = localStorage.getItem(SESSION_KEY);
    if (saved) {
      sessionToken = saved;
      loadHistory();
      return;
    }
    try {
      const resp = await fetch('/api/chat/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_email: userEmail })
      });
      if (!resp.ok) throw new Error('session error');
      const data = await resp.json();
      sessionToken = data.session_token;
      localStorage.setItem(SESSION_KEY, sessionToken);
    } catch (err) {
      console.warn('Chat session error:', err.message);
    }
  }

  async function loadHistory() {
    if (!sessionToken) return;
    try {
      const resp = await fetch('/api/chat/history?session_token=' + encodeURIComponent(sessionToken));
      if (!resp.ok) return;
      var history = await resp.json();
      if (history.length > 0) {
        messages.innerHTML = '';
        history.forEach(function (msg) { appendMessage(msg.role, msg.content); });
        hideQuickActions();
        scrollToBottom();
      }
    } catch (err) {
      console.warn('Chat history error:', err.message);
    }
  }

  // ==========================================
  // Messages
  // ==========================================
  function appendMessage(role, text) {
    var wrapper = document.createElement('div');
    wrapper.className = 'chat-msg ' + role;
    var bubble = document.createElement('div');
    bubble.className = role === 'user'
      ? 'px-4 py-3 text-sm max-w-[85%]'
      : 'bg-gray-50 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-gray-700 max-w-[85%]';
    bubble.innerHTML = formatResponse(text);
    wrapper.appendChild(bubble);
    messages.appendChild(wrapper);
    scrollToBottom();
    return bubble;
  }

  function showTyping() {
    var wrapper = document.createElement('div');
    wrapper.className = 'chat-msg assistant';
    wrapper.id = 'chat-typing-indicator';
    wrapper.innerHTML =
      '<div class="bg-gray-50 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-gray-700 max-w-[85%]">' +
        '<div class="chat-typing"><span></span><span></span><span></span></div>' +
      '</div>';
    messages.appendChild(wrapper);
    scrollToBottom();
  }

  function hideTyping() {
    var el = document.getElementById('chat-typing-indicator');
    if (el) el.remove();
  }

  function scrollToBottom() {
    requestAnimationFrame(function () {
      messages.scrollTop = messages.scrollHeight;
    });
  }

  function hideQuickActions() {
    if (quickActions) quickActions.style.display = 'none';
  }

  function formatResponse(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n- /g, '\n&#8226; ')
      .replace(/\n\d+\.\s/g, function (m) { return '\n' + m.trim() + ' '; })
      .replace(/\n/g, '<br>')
      .replace(/`(.+?)`/g, '<code style="background:#F3F4F6;padding:1px 4px;border-radius:3px;font-size:12px;">$1</code>');
  }

  // ==========================================
  // Send Message
  // ==========================================
  async function sendMessage(text) {
    if (sending || !text.trim()) return;
    sending = true;
    input.disabled = true;
    sendBtn.disabled = true;

    await ensureSession();
    hideQuickActions();

    appendMessage('user', text);
    input.value = '';
    showTyping();

    try {
      var body = {
        session_token: sessionToken,
        message: text.trim(),
        user_role: userRole,
        user_email: userEmail
      };
      if (window.CHATBOT_CONTEXT_LINK_ID) {
        body.context_link_id = window.CHATBOT_CONTEXT_LINK_ID;
      }

      var resp = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      hideTyping();

      if (!resp.ok) {
        var err = await resp.json().catch(function () { return {}; });
        if (resp.status === 429) {
          appendMessage('assistant', 'Has alcanzado el l\u00edmite de mensajes por hora. Intenta de nuevo m\u00e1s tarde.');
        } else {
          appendMessage('assistant', err.error || 'Ocurri\u00f3 un error. Intenta de nuevo.');
        }
        return;
      }

      var data = await resp.json();
      appendMessage('assistant', data.response || 'No pude generar una respuesta.');
    } catch (err) {
      hideTyping();
      appendMessage('assistant', 'Error de conexi\u00f3n. Verifica tu internet e intenta de nuevo.');
    } finally {
      sending = false;
      input.disabled = false;
      sendBtn.disabled = !input.value.trim();
      input.focus();
    }
  }

  // ==========================================
  // Initialize (with retry — chatbot HTML loads async via shared.js)
  // ==========================================
  function init(attempt) {
    attempt = attempt || 0;
    if (!initDom()) {
      if (attempt < 15) { // retry up to 15 times (3 seconds total)
        setTimeout(function () { init(attempt + 1); }, 200);
      }
      return;
    }
    setup();
  }

  function setup() {
    detectMode();
    bindEvents();
    detectUserRole();
    checkBetaConsent();

    // Auto-init session for inline mode (only if consent given)
    if (!isFloating && hasConsent) {
      ensureSession();
    }
  }

  // ==========================================
  // Beta Consent Gate
  // ==========================================
  function checkBetaConsent() {
    hasConsent = localStorage.getItem(CONSENT_KEY) === 'accepted';
    var consentScreen = document.getElementById('chat-beta-consent');
    var messagesEl = document.getElementById('chat-messages');
    var quickActionsEl = document.getElementById('chat-quick-actions');
    var inputArea = document.getElementById('chat-input-area');
    var acceptBtn = document.getElementById('chat-accept-beta');

    if (hasConsent) {
      // Already consented — show chat, hide consent
      if (consentScreen) consentScreen.style.display = 'none';
      if (messagesEl) messagesEl.style.display = '';
      if (quickActionsEl) quickActionsEl.style.display = '';
      if (inputArea) inputArea.style.display = '';
    } else {
      // Show consent screen
      if (consentScreen) consentScreen.style.display = '';
      if (messagesEl) messagesEl.style.display = 'none';
      if (quickActionsEl) quickActionsEl.style.display = 'none';
      if (inputArea) inputArea.style.display = 'none';
    }

    if (acceptBtn) {
      acceptBtn.addEventListener('click', function () {
        localStorage.setItem(CONSENT_KEY, 'accepted');
        hasConsent = true;
        if (consentScreen) consentScreen.style.display = 'none';
        if (messagesEl) messagesEl.style.display = '';
        if (quickActionsEl) quickActionsEl.style.display = '';
        if (inputArea) inputArea.style.display = '';
        ensureSession();
        if (input) input.focus();
      });
    }
  }

  function bindEvents() {
    // FAB toggle
    if (fab) fab.addEventListener('click', toggleChat);

    // Close button
    if (closeBtn) closeBtn.addEventListener('click', closeChat);

    // Form submit
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      sendMessage(input.value);
    });

    // Enable/disable send button
    input.addEventListener('input', function () {
      sendBtn.disabled = !input.value.trim() || sending;
    });

    // Quick action chips (use data-query attribute or text content)
    if (quickActions) {
      quickActions.addEventListener('click', function (e) {
        var chip = e.target.closest('.chat-chip');
        if (chip) {
          var query = chip.getAttribute('data-query') || chip.textContent;
          sendMessage(query);
        }
      });
    }

    // Close on Escape (floating mode only)
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isFloating && isOpen) {
        closeChat();
      }
    });
  }

  // Wait for DOM + partials
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(init, 200); });
  } else {
    setTimeout(init, 200);
  }
})();
