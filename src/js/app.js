import { Capacitor } from '@capacitor/core';
import html2pdf from 'html2pdf.js';
    let NOTIFICATIONS = [];
    let CLIENTS = [];
    let NOTES = [];
    let STORIES = [];
    let SETTINGS = { theme: 'light', brand: 'ember', signedIn: false, account: null, userName: null, lastSync: null };

    let flowState = { general: [], special: [], sports: [], rehab: [] };
    let flowMode = 'browse'; // 'browse' | 'newClient' | 'editClient'
    let flowClientId = null;
    let pendingNewClient = {};
    let currentClientId = null;
    let currentSheetMode = null;
    let currentSheetClientId = null;
    let currentHistoryIndex = null;
    let pendingStoryImage = null;
    let pendingNoteImage = null;
    let navStack = [];
    let memoryStore = {}; // fallback when window.storage is unavailable
    let SELECT_MODE = false;
    let SELECT_TYPE = null;
    let SELECTED_IDS = new Set();
    const CAT_META = {
      general: { label: 'General Fitness', accent: 'ember', icon: 'fa-fire', ctaEmpty: 'Select at least one focus area' },
      special: { label: 'Special Population', accent: 'pulse', icon: 'fa-heart-pulse', ctaEmpty: 'Select at least one condition' },
      sports: { label: 'Sports / Athlete', accent: 'crimson', icon: 'fa-medal', ctaEmpty: 'Select an athlete type' },
      rehab: { label: 'Rehabilitation', accent: 'moss', icon: 'fa-kit-medical', ctaEmpty: 'Select at least one item' }
    };
    const TAB_SCREEN = { home: 'screen-home', clients: 'screen-clients', stories: 'screen-stories', notes: 'screen-notes' };
    const SCREEN_TAB = { 'screen-home': 'home', 'screen-clients': 'clients', 'screen-stories': 'stories', 'screen-notes': 'notes' };
    const BRAND_HEX = { 
      candy: { color: '#C06C84', gradient: 'linear-gradient(135deg, #FF6B6B, #C06C84, #6C5B7B)' }, 
      ocean: { color: '#2193b0', gradient: 'linear-gradient(135deg, #2193b0, #6dd5ed)' }, 
      sunset: { color: '#FF4E50', gradient: 'linear-gradient(135deg, #FF4E50, #F9D423)' }, 
      emerald: { color: '#11998e', gradient: 'linear-gradient(135deg, #11998e, #38ef7d)' } 
    };

    /* ===================== Seed data ===================== */
    function seedDates(n) {
      const arr = [];
      let d = new Date();
      d.setDate(d.getDate() - 2);
      for (let i = 0; i < n; i++) {
        arr.push(d.toISOString().slice(0, 10));
        d.setDate(d.getDate() - (3 + Math.floor(Math.random() * 3)));
      }
      return arr;
    }

    function seedClients() {
      return [
        {
          id: 'c1', name: 'Rohan S.', category: 'general', tags: ['Weight Loss', 'Endurance', 'Anterior Pelvic Tilt'], height: 175, weight: 82,
          nutrition: { current: 'Calorie deficit, ~1900 kcal/day, high protein.', history: [{ date: seedDates(1)[0], text: 'Calorie deficit, ~1900 kcal/day, high protein.' }, { date: seedDates(6)[5], text: 'Started with a basic portion-control plan.' }] },
          workout: { current: '4x/week: hip flexor mobility plus posterior chain strength.', history: [{ date: seedDates(1)[0], text: '4x/week: hip flexor mobility plus posterior chain strength.' }] },
          sessionsTotal: 16, sessionsLog: seedDates(9), photo: null, createdAt: seedDates(20)[19]
        },
        {
          id: 'c2', name: 'Anjali R.', category: 'general', tags: ['Weight Loss', 'Basic'], height: 160, weight: 68,
          nutrition: { current: 'Portion-controlled home meals, cut added sugar.', history: [{ date: seedDates(1)[0], text: 'Portion-controlled home meals, cut added sugar.' }] },
          workout: { current: '3x/week full body circuit.', history: [{ date: seedDates(1)[0], text: '3x/week full body circuit.' }] },
          sessionsTotal: 20, sessionsLog: seedDates(14), photo: null, createdAt: seedDates(30)[29]
        },
        {
          id: 'c3', name: 'Kabir M.', category: 'general', tags: ['Kyphosis', 'Basic'], height: 178, weight: 79,
          nutrition: { current: 'Maintenance calories, more vegetables at lunch.', history: [{ date: seedDates(1)[0], text: 'Maintenance calories, more vegetables at lunch.' }] },
          workout: { current: 'Desk-break mobility plus 2x/week strength.', history: [{ date: seedDates(1)[0], text: 'Desk-break mobility plus 2x/week strength.' }] },
          sessionsTotal: 12, sessionsLog: seedDates(5), photo: null, createdAt: seedDates(15)[14]
        },

        {
          id: 'c4', name: 'Meera K.', category: 'special', tags: ['PCOS'], height: 162, weight: 71,
          nutrition: { current: 'Low-GI meals, consistent meal timing.', history: [{ date: seedDates(1)[0], text: 'Low-GI meals, consistent meal timing.' }, { date: seedDates(6)[5], text: 'Started tracking meal timing only.' }] },
          workout: { current: '3x/week resistance training plus daily walking.', history: [{ date: seedDates(1)[0], text: '3x/week resistance training plus daily walking.' }] },
          sessionsTotal: 24, sessionsLog: seedDates(18), photo: null, createdAt: seedDates(40)[39]
        },
        {
          id: 'c5', name: 'Ayesha N.', category: 'special', tags: ['Hypothyroidism'], height: 158, weight: 66,
          nutrition: { current: 'Iodine-conscious meals, steady calorie intake.', history: [{ date: seedDates(1)[0], text: 'Iodine-conscious meals, steady calorie intake.' }] },
          workout: { current: 'Low-impact cardio plus light resistance, 3x/week.', history: [{ date: seedDates(1)[0], text: 'Low-impact cardio plus light resistance, 3x/week.' }] },
          sessionsTotal: 18, sessionsLog: seedDates(6), photo: null, createdAt: seedDates(12)[11]
        },
        {
          id: 'c6', name: 'Vikram T.', category: 'special', tags: ['Type 2 Diabetes', 'Hypertension'], height: 172, weight: 88,
          nutrition: { current: 'Low-sodium, carb-controlled meals.', history: [{ date: seedDates(1)[0], text: 'Low-sodium, carb-controlled meals.' }] },
          workout: { current: 'Brisk walking plus supervised resistance; BP checked pre and post.', history: [{ date: seedDates(1)[0], text: 'Brisk walking plus supervised resistance; BP checked pre and post.' }] },
          sessionsTotal: 20, sessionsLog: seedDates(10), photo: null, createdAt: seedDates(25)[24]
        },

        {
          id: 'c7', name: 'Farhan S.', category: 'sports', tags: ['Combat & Martial Arts Athletes'], height: 174, weight: 70,
          nutrition: { current: 'Camp-cycle nutrition, weight-category conscious.', history: [{ date: seedDates(1)[0], text: 'Camp-cycle nutrition, weight-category conscious.' }, { date: seedDates(6)[5], text: 'General performance diet, no weight-category focus yet.' }] },
          workout: { current: 'Camp block 3: reaction drills plus conditioning.', history: [{ date: seedDates(1)[0], text: 'Camp block 3: reaction drills plus conditioning.' }] },
          sessionsTotal: 30, sessionsLog: seedDates(22), photo: null, createdAt: seedDates(50)[49]
        },
        {
          id: 'c8', name: 'Neha D.', category: 'sports', tags: ['Track & Field Athletes'], height: 168, weight: 58,
          nutrition: { current: 'Performance-timed carb intake around sessions.', history: [{ date: seedDates(1)[0], text: 'Performance-timed carb intake around sessions.' }] },
          workout: { current: 'Sprint mechanics plus plyometrics, 5x/week.', history: [{ date: seedDates(1)[0], text: 'Sprint mechanics plus plyometrics, 5x/week.' }] },
          sessionsTotal: 28, sessionsLog: seedDates(20), photo: null, createdAt: seedDates(35)[34]
        },
        {
          id: 'c9', name: 'Arjun M.', category: 'sports', tags: ['Team Sport Athletes'], height: 180, weight: 75,
          nutrition: { current: 'Match-day fueling protocol.', history: [{ date: seedDates(1)[0], text: 'Match-day fueling protocol.' }] },
          workout: { current: 'Position-specific conditioning, 4x/week.', history: [{ date: seedDates(1)[0], text: 'Position-specific conditioning, 4x/week.' }] },
          sessionsTotal: 24, sessionsLog: seedDates(15), photo: null, createdAt: seedDates(28)[27]
        },

        {
          id: 'c10', name: 'Priya N.', category: 'rehab', tags: ['Post ACL / Knee'], height: 165, weight: 58,
          nutrition: { current: 'Anti-inflammatory focus, adequate protein for tissue repair.', history: [{ date: seedDates(1)[0], text: 'Anti-inflammatory focus, adequate protein for tissue repair.' }, { date: seedDates(6)[5], text: 'Standard post-op diet, protein target lower.' }] },
          workout: { current: '8 months post-op: jogging progression, quad and hamstring strength.', history: [{ date: seedDates(1)[0], text: '8 months post-op: jogging progression, quad and hamstring strength.' }] },
          sessionsTotal: 24, sessionsLog: seedDates(16), photo: null, createdAt: seedDates(45)[44]
        },
        {
          id: 'c11', name: 'Suresh P.', category: 'rehab', tags: ['Chronic Lower Back Pain'], height: 170, weight: 80,
          nutrition: { current: 'Anti-inflammatory focus, weight management.', history: [{ date: seedDates(1)[0], text: 'Anti-inflammatory focus, weight management.' }] },
          workout: { current: 'Core stability plus hip mobility; avoiding loaded flexion.', history: [{ date: seedDates(1)[0], text: 'Core stability plus hip mobility; avoiding loaded flexion.' }] },
          sessionsTotal: 16, sessionsLog: seedDates(4), photo: null, createdAt: seedDates(10)[9]
        },
        {
          id: 'c12', name: 'Kavya R.', category: 'rehab', tags: ['Diastasis Recti'], height: 160, weight: 63,
          nutrition: { current: 'Balanced post-partum recovery nutrition.', history: [{ date: seedDates(1)[0], text: 'Balanced post-partum recovery nutrition.' }] },
          workout: { current: 'Deep core plus pelvic floor coordination, progressing gradually.', history: [{ date: seedDates(1)[0], text: 'Deep core plus pelvic floor coordination, progressing gradually.' }] },
          sessionsTotal: 12, sessionsLog: seedDates(3), photo: null, createdAt: seedDates(8)[7]
        }
      ];
    }

    function seedNotes() {
      return [
        { id: 'n1', clientId: 'c10', clientName: 'Priya N.', category: 'rehab', text: '8 months post-ACL, cleared for jogging progression, mild swelling post-session.', image: null, date: seedDates(1)[0] },
        { id: 'n2', clientId: 'c4', clientName: 'Meera K.', category: 'special', text: 'PCOS — energy steady, added two resistance sessions per week.', image: null, date: seedDates(2)[1] },
        { id: 'n3', clientId: 'c1', clientName: 'Rohan S.', category: 'general', text: 'Posture correction — anterior pelvic tilt improving, hip flexor mobility work.', image: null, date: seedDates(3)[2] },
        { id: 'n4', clientId: 'c7', clientName: 'Farhan S.', category: 'sports', text: 'Combat conditioning — camp block 3, reaction drills increased.', image: null, date: seedDates(4)[3] }
      ];
    }

    function seedStories() {
      return [
        { id: 's1', clientId: 'c2', name: 'Anjali R.', category: 'general', result: '12kg down in 6 months, training four times a week and loving it.', image: null, stars: 5, date: seedDates(5)[4] },
        { id: 's2', clientId: 'c4', name: 'Meera K.', category: 'special', result: 'More energy, steadier cycles, and finally consistent with training.', image: null, stars: 5, date: seedDates(6)[5] },
        { id: 's3', clientId: 'c7', name: 'Farhan S.', category: 'sports', result: 'Selected for the state camp after four months of sport-specific conditioning.', image: null, stars: 5, date: seedDates(7)[6] },
        { id: 's4', clientId: 'c10', name: 'Priya N.', category: 'rehab', result: 'Running my first 10K again, eight months post-ACL reconstruction.', image: null, stars: 5, date: seedDates(8)[7] },
        { id: 's5', clientId: 'c3', name: 'Kabir M.', category: 'general', result: 'Pain-free at my desk job after three months of posture correction work.', image: null, stars: 4, date: seedDates(9)[8] }
      ];
    }

    /* ===================== Storage ===================== */
    async function persist() {
      try {
        if (window.storage) {
          await window.storage.set('truefit_state', JSON.stringify({ CLIENTS, NOTES, STORIES, SETTINGS }));
        }
      } catch (e) { console.warn('persist failed', e); }
    }

    async function hydrate() {
      CLIENTS = [];
      NOTES = [];
      STORIES = [];
      try {
        if (window.storage) {
          const res = await window.storage.get('truefit_state');
          if (res && res.value) {
            const data = JSON.parse(res.value);
            if (data.CLIENTS && data.CLIENTS.length) CLIENTS = data.CLIENTS;
            if (data.NOTES) NOTES = data.NOTES;
            if (data.NOTIFICATIONS) NOTIFICATIONS = data.NOTIFICATIONS;
            if (data.STORIES) STORIES = data.STORIES;
            if (data.SETTINGS) SETTINGS = Object.assign(SETTINGS, data.SETTINGS);
          }
        }
      } catch (e) { /* first run, nothing stored yet */ }
    }

    /* ===================== Utils ===================== */
    function escapeHTML(str) {
      return String(str).replace(/[&<>"']/g, function (m) {
        return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
      });
    }
    function initials(name) {
      const parts = String(name).split(' ').filter(Boolean).map(function (w) { return w[0]; });
      return (parts.slice(0, 2).join('').toUpperCase()) || 'NC';
    }
    function uid(prefix) { return prefix + '_' + Date.now().toString(36) + Math.floor(Math.random() * 1000); }
    function fmtDate(iso) {
      if (!iso) return '';
      const d = new Date(iso + 'T00:00:00');
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    function starsHTML(n) {
      let h = '';
      for (let i = 0; i < 5; i++) { h += i < n ? '<i class="fa-solid fa-star"></i>' : '<i class="fa-regular fa-star"></i>'; }
      return h;
    }
    function categoryCount(cat) { return CLIENTS.filter(function (c) { return c.category === cat; }).length; }

    /* ===================== Navigation ===================== */
    function goTo(id, opts) {
      opts = opts || {};
      const current = document.querySelector('.app-screen.active');
      if (!opts.reset && !opts.replace && current && current.id !== id) {
        navStack.push(current.id);
      }
      if (opts.reset) navStack = [];
      document.querySelectorAll('.app-screen').forEach(function (s) { s.classList.remove('active'); });
      const target = document.getElementById(id);
      if (target) target.classList.add('active');
      document.getElementById('appScreens').scrollTop = 0;
      const tabbar = document.getElementById('tabbar');
      const tabName = SCREEN_TAB[id];
      if (id === 'screen-splash' || id === 'screen-signin') {
        tabbar.classList.add('hidden');
      } else if (tabName) {
        tabbar.classList.remove('hidden');
        setActiveTab(tabName);
      } else {
        tabbar.classList.add('hidden');
      }
    }
    function goBack(fallback) {
      const prev = navStack.pop();
      goTo(prev || fallback || 'screen-home', { replace: true });
    }
    function goToTab(name) {
      flowMode = 'browse';
      goTo(TAB_SCREEN[name], { reset: true });
      if (name === 'clients') setClientsHeaderMode('browse');
      if (name === 'home') renderHome();
      if (name === 'stories') renderStories();
      if (name === 'notes') renderNotes();
    }
    function setActiveTab(name) {
      document.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.toggle('active', b.dataset.tab === name); });
    }

    /* ===================== Home ===================== */
    function renderHome() {
      const now = new Date();
      const h = now.getHours();
      const greeting = h < 12 ? 'Good morning' : (h < 17 ? 'Good afternoon' : 'Good evening');
      document.getElementById('homeGreeting').innerHTML = greeting + ', <span id="userNameDisplay">' + escapeHTML(SETTINGS.userName || 'Trainer') + '</span>';
      document.getElementById('homeDate').textContent = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

      const total = CLIENTS.length;
      const counts = { general: categoryCount('general'), special: categoryCount('special'), sports: categoryCount('sports'), rehab: categoryCount('rehab') };
      document.getElementById('statActiveClients').textContent = total;

      let sessionsToday = 0;
      const todayISO = now.toISOString().slice(0, 10);
      CLIENTS.forEach(function (c) { if (c.sessionsLog.indexOf(todayISO) > -1) sessionsToday++; });
      document.getElementById('statSessionsToday').textContent = sessionsToday;
      document.getElementById('statAssessedWeek').textContent = NOTES.length;

      const pct = {
        general: total ? (counts.general / total * 100) : 0,
        special: total ? (counts.special / total * 100) : 0,
        sports: total ? (counts.sports / total * 100) : 0,
        rehab: total ? (counts.rehab / total * 100) : 0
      };
      document.getElementById('mixGeneral').style.width = pct.general + '%';
      document.getElementById('mixSpecial').style.width = pct.special + '%';
      document.getElementById('mixSports').style.width = pct.sports + '%';
      document.getElementById('mixRehab').style.width = pct.rehab + '%';
      document.getElementById('legendGeneral').textContent = 'General ' + counts.general;
      document.getElementById('legendSpecial').textContent = 'Special ' + counts.special;
      document.getElementById('legendSports').textContent = 'Sports ' + counts.sports;
      document.getElementById('legendRehab').textContent = 'Rehab ' + counts.rehab;

      const sorted = NOTES.slice().sort(function (a, b) { return (a.date < b.date) ? 1 : -1; }).slice(0, 3);
      const activityEl = document.getElementById('activityList');
      activityEl.innerHTML = sorted.map(function (n) {
        const meta = CAT_META[n.category];
        return '<div class="activity-row"><span class="activity-dot"></span><div><p>Note logged — ' + escapeHTML(n.clientName) + ' <span class="tag-inline">' + meta.label + '</span></p><span class="activity-time">' + fmtDate(n.date) + '</span></div></div>';
      }).join('') || '<p class="screen-sub">No activity yet.</p>';

      updateCategoryCardCounts();
    }

    function updateCategoryCardCounts() {
      document.querySelectorAll('#screen-clients .category-card').forEach(function (card) {
        const cat = card.dataset.cat;
        const countEl = card.querySelector('.cat-count');
        if (countEl) countEl.textContent = categoryCount(cat) + ' active';
      });
    }

    /* ===================== Clients: category select ===================== */
    function setClientsHeaderMode(mode) {
      const title = document.getElementById('clientsScreenTitle');
      const sub = document.getElementById('clientsScreenSub');
      if (mode === 'newClient') {
        title.textContent = 'New Client';
        sub.textContent = 'Which category fits this client?';
      } else {
        title.textContent = 'Select Client Type';
        sub.textContent = "Choose a category to see that group's clients.";
      }
    }

    function startAddClient() {
      flowMode = 'newClient';
      flowClientId = null;
      pendingNewClient = {};
      setClientsHeaderMode('newClient');
      goTo('screen-clients');
    }

    function startAddClientInCategory(cat) {
      flowMode = 'newClient';
      flowClientId = null;
      pendingNewClient = {};
      resetTaxonomyScreen(cat);
      goTo('screen-' + cat);
    }

    function handleCategoryCardTap(cat) {
      if (flowMode === 'newClient') {
        resetTaxonomyScreen(cat);
        goTo('screen-' + cat);
      } else {
        renderClientList(cat);
        goTo('screen-client-list');
      }
    }

    /* ===================== Taxonomy pickers (general/special/sports/rehab) ===================== */
    function resetTaxonomyScreen(cat) {
      flowState[cat] = [];
      document.querySelectorAll('#screen-' + cat + ' [data-label]').forEach(function (el) { el.classList.remove('selected'); });
      document.querySelectorAll('#screen-' + cat + ' .accordion-body').forEach(function (body) { body.classList.remove('open'); if (body.previousElementSibling) body.previousElementSibling.classList.remove('open'); });
      refreshCTA(cat);
    }

    function prefillTaxonomy(cat, tags) {
      flowState[cat] = tags.slice();
      document.querySelectorAll('#screen-' + cat + ' [data-label]').forEach(function (el) {
        const on = tags.indexOf(el.dataset.label) > -1;
        el.classList.toggle('selected', on);
        if (on) {
          const body = el.closest('.accordion-body');
          if (body) { body.classList.add('open'); if (body.previousElementSibling) body.previousElementSibling.classList.add('open'); }
        }
      });
      refreshCTA(cat);
    }

    function toggleMulti(cat, label, el) {
      el.classList.toggle('selected');
      const arr = flowState[cat];
      const idx = arr.indexOf(label);
      if (idx > -1) { arr.splice(idx, 1); } else { arr.push(label); }
      refreshCTA(cat);
    }

    function toggleSingle(cat, label, el) {
      const group = el.closest('.option-group');
      const prev = group.querySelector('.selected');
      if (prev && prev !== el) {
        const prevLabel = prev.dataset.label;
        const idx = flowState[cat].indexOf(prevLabel);
        if (idx > -1) { flowState[cat].splice(idx, 1); }
        prev.classList.remove('selected');
      }
      if (!el.classList.contains('selected')) {
        el.classList.add('selected');
        flowState[cat].push(label);
      }
      refreshCTA(cat);
    }

    function refreshCTA(cat) {
      const btn = document.getElementById('cta-' + cat);
      if (!btn) return;
      const n = flowState[cat].length;
      btn.disabled = n === 0;
      const labelEl = btn.querySelector('.cta-label');
      if (flowMode === 'editClient') {
        labelEl.textContent = n > 0 ? ('Save Changes (' + n + ' selected)') : 'Select at least one';
      } else {
        labelEl.textContent = n > 0 ? ('Continue (' + n + ' selected)') : CAT_META[cat].ctaEmpty;
      }
    }

    function toggleAccordion(headerEl) {
      const body = headerEl.nextElementSibling;
      const open = body.classList.toggle('open');
      headerEl.classList.toggle('open', open);
    }

    function filterConditions(q) {
      q = q.trim().toLowerCase();
      document.querySelectorAll('#screen-special .list-row').forEach(function (row) {
        const label = (row.dataset.label || '').toLowerCase();
        row.style.display = label.indexOf(q) > -1 ? '' : 'none';
      });
      document.querySelectorAll('#screen-special .group-block').forEach(function (block) {
        const rows = block.querySelectorAll('.list-row');
        let anyVisible = false;
        rows.forEach(function (r) { if (r.style.display !== 'none') anyVisible = true; });
        block.style.display = anyVisible ? '' : 'none';
      });
    }

    function handleTaxonomyCTA(cat) {
      const items = flowState[cat];
      if (items.length === 0) return;
      if (flowMode === 'editClient') {
        const c = CLIENTS.find(function (x) { return x.id === flowClientId; });
        c.tags = items.slice();
        persist();
        renderClientDetail(c.id);
        goTo('screen-client-detail', { replace: true });
        toast('Tags updated');
      } else {
        pendingNewClient.category = cat;
        pendingNewClient.tags = items.slice();
        renderNewClientInfoHeader();
        goTo('screen-new-client-info');
      }
    }

    /* ===================== Client list ===================== */
    function renderClientList(cat) {
      const meta = CAT_META[cat];
      document.getElementById('clientListTitle').textContent = meta.label;
      const header = document.getElementById('clientListHeader');
      header.className = 'detail-header';
      document.getElementById('clientListAddBtn').dataset.cat = cat;
      const list = CLIENTS.filter(function (c) { return c.category === cat; });
      const body = document.getElementById('clientListBody');
      if (list.length === 0) {
        body.innerHTML = '<p class="screen-sub">No clients in this category yet. Tap + to add one.</p>';
        return;
      }
      body.innerHTML = list.map(function (c) {
        const pct = c.sessionsTotal ? Math.round((c.sessionsLog.length / c.sessionsTotal) * 100) : 0;
        const tagPreview = c.tags.slice(0, 2).join(', ');
        return '' +
          '<button class="client-row ' + (SELECT_MODE && SELECTED_IDS.has(c.id) ? 'selected-item' : '') + '" onpointerdown="startPress(\'' + c.id + '\', \'client\')" onpointerup="cancelPress()" onpointercancel="cancelPress()" onpointermove="cancelPress()" onclick="handleItemClick(\'' + c.id + '\', \'client\')">' +
          '<div class="avatar">' + escapeHTML(initials(c.name)) + '</div>' +
          '<div class="client-row-body">' +
          '<div class="client-row-top"><span class="client-row-name">' + escapeHTML(c.name) + '</span><span class="cat-chev"><i class="fa-solid fa-chevron-right"></i></span></div>' +
          '<span class="client-row-tags">' + escapeHTML(tagPreview) + '</span>' +
          '<div class="mini-progress"><div class="mini-progress-fill" style="width:' + pct + '%"></div></div>' +
          '<span class="client-row-sessions">' + c.sessionsLog.length + ' / ' + c.sessionsTotal + ' sessions</span>' +
          '</div>' +
          '</button>';
      }).join('');
    }

    /* ===================== New client info ===================== */
    function renderNewClientInfoHeader() {
      const meta = CAT_META[pendingNewClient.category];
      const screenEl = document.getElementById('screen-new-client-info');
      screenEl.classList.remove('accent-ember', 'accent-pulse', 'accent-crimson', 'accent-moss');
      document.getElementById('newClientCatBadge').innerHTML = '<span class="badge">' + meta.label + '</span>';
      document.getElementById('newClientTagsPreview').innerHTML = pendingNewClient.tags.map(function (t) { return '<span class="tag">' + escapeHTML(t) + '</span>'; }).join('');
    }

    function saveNewClient() {
      const name = document.getElementById('nciName').value.trim();
      if (!name) { document.getElementById('nciName').focus(); return; }
      const height = parseFloat(document.getElementById('nciHeight').value) || null;
      const weight = parseFloat(document.getElementById('nciWeight').value) || null;
      const nutrition = document.getElementById('nciNutrition').value.trim();
      const workout = document.getElementById('nciWorkout').value.trim();
      const sessionsTotal = parseInt(document.getElementById('nciSessions').value, 10) || 0;
      const today = new Date().toISOString().slice(0, 10);
      const client = {
        id: uid('c'),
        name: name,
        category: pendingNewClient.category,
        tags: pendingNewClient.tags,
        height: height, weight: weight,
        nutrition: { current: nutrition, history: nutrition ? [{ date: today, text: nutrition }] : [] },
        workout: { current: workout, history: workout ? [{ date: today, text: workout }] : [] },
        sessionsTotal: sessionsTotal, sessionsLog: [], photo: null, createdAt: today
      };
      CLIENTS.push(client);
      persist();
      ['nciName', 'nciHeight', 'nciWeight', 'nciNutrition', 'nciWorkout', 'nciSessions'].forEach(function (id) { document.getElementById(id).value = ''; });
      flowMode = 'browse';
      renderClientDetail(client.id);
      goTo('screen-client-detail', { reset: true });
      toast('Client added');
    }

    /* ===================== Client detail ===================== */

    function renderActivityLog(log) {
      if (!log || log.length === 0) return '<p class="screen-sub">No activity yet.</p>';
      return log.map(function(item) {
        return '<div class="history-entry"><span class="history-date">' + fmtDate(item.date) + '</span><span class="history-text">' + escapeHTML(item.text) + '</span></div>';
      }).join('');
    }

    function openClientDetail(id) {
      renderClientDetail(id);
      goTo('screen-client-detail');
    }

    function editClientTags() {
      const c = CLIENTS.find(function (x) { return x.id === currentClientId; });
      flowMode = 'editClient';
      flowClientId = c.id;
      resetTaxonomyScreen(c.category);
      prefillTaxonomy(c.category, c.tags);
      goTo('screen-' + c.category);
    }

    function markSession() {
      const c = CLIENTS.find(function (x) { return x.id === currentClientId; });
      if (c.sessionsLog.length >= c.sessionsTotal) { toast('All sessions already marked'); return; }
      const today = new Date().toISOString().slice(0, 10);
      if (c.sessionsLog.indexOf(today) === -1) c.sessionsLog.push(today);
      persist();
      renderClientDetail(c.id);
      toast('Session marked');
    }

    function renderClientDetail(id) {
      currentClientId = id;
      const c = CLIENTS.find(function (x) { return x.id === id; });
      if (!c) return;
      const meta = CAT_META[c.category];
      const pct = c.sessionsTotal ? Math.min(100, Math.round((c.sessionsLog.length / c.sessionsTotal) * 100)) : 0;
      const clientNotes = NOTES.filter(function (n) { return n.clientId === id; }).sort(function (a, b) { return (a.date < b.date) ? 1 : -1; });

      const html = '' +
        '<div class="detail-header">' +
        '<div class="client-detail-top"><div class="avatar">' + escapeHTML(initials(c.name)) + '</div>' +
        '<div class="client-detail-title"><h2>' + escapeHTML(c.name) + '</h2><span class="badge">' + meta.label + '</span></div>' +
        '</div>' +
        '</div>' +
        '<div class="profile-action-row" style="display:flex; gap:12px; margin-bottom: 24px;">' +
        '<button class="btn-ghost" style="flex:1; padding: 12px 10px; font-size: 13px;" onclick="openEditSheet(\'profile\')"><i class="fa-solid fa-pen"></i> Edit Profile</button>' +
        '<button class="btn-ghost" style="flex:1; padding: 12px 10px; font-size: 13px;" onclick="exportClientPDF()"><i class="fa-solid fa-file-pdf"></i> Export PDF</button>' +
        '</div>' +

        '<div class="tag-row">' + c.tags.map(function (t) { return '<span class="tag">' + escapeHTML(t) + '</span>'; }).join('') + '<button class="edit-icon-btn" onclick="editClientTags()"><i class="fa-solid fa-pen"></i> Edit</button></div>' +

        '<div class="card">' +
        '<p class="card-title">Body</p>' +
        '<div class="stat-inline-row">' +
        '<div><span class="stat-inline-num">' + (c.height || '—') + '</span><span class="stat-inline-lbl">Height (cm)</span></div>' +
        '<div><span class="stat-inline-num">' + (c.weight || '—') + '</span><span class="stat-inline-lbl">Weight (kg)</span></div>' +
        '<button class="edit-icon-btn" onclick="openEditSheet(\'bodystats\')"><i class="fa-solid fa-pen"></i> Edit</button>' +
        '</div>' +
        '</div>' +

        '<div class="card">' +
        '<p class="card-title">Sessions</p>' +
        '<div class="progress-bar"><div class="progress-fill" style="width:' + pct + '%"></div></div>' +
        '<p class="screen-sub" style="margin:8px 0 12px;">' + c.sessionsLog.length + ' of ' + c.sessionsTotal + ' attended</p>' +
        '<button class="btn-primary full" onclick="markSession()"><i class="fa-solid fa-check"></i> Mark Today\u2019s Session</button>' +
        '</div>' +

        '<div class="card">' +
        '<div class="card-title-row"><p class="card-title">Nutrition</p><button class="edit-icon-btn" onclick="openEditSheet(\'nutrition\')"><i class="fa-solid fa-pen"></i> Edit</button></div>' +
        '<p class="screen-sub">' + escapeHTML(c.nutrition.current || 'Not set yet.') + '</p>' +
        renderHistoryLog(c.nutrition.history, 'nutrition') +
        '</div>' +

        '<div class="card">' +
        '<div class="card-title-row"><p class="card-title">Workout</p><button class="edit-icon-btn" onclick="openEditSheet(\'workout\')"><i class="fa-solid fa-pen"></i> Edit</button></div>' +
        '<p class="screen-sub">' + escapeHTML(c.workout.current || 'Not set yet.') + '</p>' +
        renderHistoryLog(c.workout.history, 'workout') +
        '</div>' +

        '<div class="card-title-row" style="margin-top:22px;"><p class="section-label" style="margin:0;">Notes &amp; Photos</p></div>' +
        clientNotes.map(renderNoteCard).join('') +
        (clientNotes.length === 0 ? '<p class="screen-sub">No notes for this client yet.</p>' : '');

      document.getElementById('clientDetailBody').innerHTML = html;
    }

    function renderHistoryLog(history, category) {
      if (!history || history.length === 0) return '';
      return '<div class="history-log">' + history.slice(0, 4).map(function (h, i) {
        return '<div class="history-entry">' +
               '<div style="flex:1;"><span class="history-date">' + fmtDate(h.date) + '</span><span class="history-text">' + escapeHTML(h.text) + '</span></div>' +
               (category ? '<button class="icon-btn" style="color:var(--text-faint); margin-left:auto; width:28px; height:28px; background:none; border:none;" onclick="editHistoryLog(\'' + category + '\', ' + i + ')"><i class="fa-solid fa-pen"></i></button>' : '') +
               '</div>';
      }).join('') + '</div>';
    }

    /* ===================== Generic edit sheet (body stats / nutrition / workout) ===================== */
    function openEditSheet(kind) {
      currentSheetMode = kind;
      currentSheetClientId = currentClientId;
      const c = CLIENTS.find(function (x) { return x.id === currentClientId; });
      let html = '';
      if (kind === 'profile') {
        html = '<h3>Edit Profile</h3>' +
               '<div class="form-field"><label for="sheetName">Name</label><input type="text" id="sheetName" value="' + escapeHTML(c.name) + '"></div>' +
               '<div class="form-field"><label for="sheetCategory">Category</label><select id="sheetCategory">' +
                 Object.keys(CAT_META).map(k => '<option value="'+k+'" '+(k===c.category?'selected':'')+'>'+CAT_META[k].label+'</option>').join('') +
               '</select></div>' +
               '<div class="form-field"><label for="sheetTotalSessions">Total Sessions</label><input type="number" id="sheetTotalSessions" value="' + c.sessionsTotal + '"></div>';
      } else if (kind === 'nutrition') {
        html = '<h3>Edit Nutrition</h3><div class="form-field"><label for="sheetTextarea">Notes</label><textarea id="sheetTextarea" rows="4" placeholder="Current nutrition guidance">' + escapeHTML(c.nutrition.current || '') + '</textarea></div>';
      } else if (kind === 'workout') {
        html = '<h3>Edit Workout</h3><div class="form-field"><label for="sheetTextarea">Notes</label><textarea id="sheetTextarea" rows="4" placeholder="Current workout guidance">' + escapeHTML(c.workout.current || '') + '</textarea></div>';
      } else if (kind === 'bodystats') {
        html = '<h3>Edit Body Stats</h3><div class="form-field"><label for="sheetHeight">Height (cm)</label><input type="number" id="sheetHeight" value="' + (c.height || '') + '"></div><div class="form-field"><label for="sheetWeight">Weight (kg)</label><input type="number" id="sheetWeight" value="' + (c.weight || '') + '"></div>';
      }
      html += '<div class="sheet-actions"><button class="btn-ghost" onclick="closeSheet()">Cancel</button><button class="btn-primary" onclick="saveEditSheet()">Save</button></div>';
      document.getElementById('sheetBody').innerHTML = html;
      document.getElementById('sheetOverlay').classList.add('active');
    }

    function saveEditSheet() {
      const c = CLIENTS.find(function (x) { return x.id === currentSheetClientId; });
      const today = new Date().toISOString().slice(0, 10);
      if (currentSheetMode === 'profile') {
        const newName = document.getElementById('sheetName').value.trim();
        const newCat = document.getElementById('sheetCategory').value;
        const newTotal = parseInt(document.getElementById('sheetTotalSessions').value, 10);
        if(newName) c.name = newName;
        if(newCat) c.category = newCat;
        if(!isNaN(newTotal) && newTotal >= 0) c.sessionsTotal = newTotal;
      } else if (currentSheetMode === 'nutrition' || currentSheetMode === 'workout') {
        const val = document.getElementById('sheetTextarea').value.trim();
        if (!val) return;
        const field = c[currentSheetMode];
        field.current = val;
        field.history.unshift({ date: today, text: val });
        c.activityLog = c.activityLog || [];
        c.activityLog.unshift({ type: 'update', text: 'Updated ' + currentSheetMode, date: today });
      } else if (currentSheetMode === 'bodystats') {
        const h = parseFloat(document.getElementById('sheetHeight').value);
        const w = parseFloat(document.getElementById('sheetWeight').value);
        if (h) c.height = h;
        if (w) c.weight = w;
      }
      persist();
      renderClientDetail(c.id);
      closeSheet();
      toast('Saved');
    }

    function openSheet() { document.getElementById('sheetOverlay').classList.add('active'); }
    function closeSheet() { document.getElementById('sheetOverlay').classList.remove('active'); }

    /* ===================== Images ===================== */
    function handleImagePick(event, target) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function (ev) {
        const dataUrl = ev.target.result;
        if (target === 'story') { pendingStoryImage = dataUrl; document.getElementById('storyImagePreview').innerHTML = '<img src="' + dataUrl + '" alt="">'; }
        if (target === 'note') { pendingNoteImage = dataUrl; document.getElementById('noteImagePreview').innerHTML = '<img src="' + dataUrl + '" alt="">'; }
      };
      reader.readAsDataURL(file);
    }

    /* ===================== Notes ===================== */
    function populateNoteClientSelect() {
      const sel = document.getElementById('noteClientSelect');
      sel.innerHTML = '<option value="">General note (no client)</option>' + CLIENTS.map(function (c) {
        return '<option value="' + c.id + '">' + escapeHTML(c.name) + ' \u2014 ' + CAT_META[c.category].label + '</option>';
      }).join('');
    }

    function renderNoteCard(n) {
      const meta = CAT_META[n.category];
      return '' +
        '<div class="assess-row ' + (SELECT_MODE && SELECTED_IDS.has(n.id) ? 'selected-item' : '') + '" onpointerdown="startPress(\'' + n.id + '\', \'note\')" onpointerup="cancelPress()" onpointercancel="cancelPress()" onpointermove="cancelPress()" onclick="handleItemClick(\'' + n.id + '\', \'note\')">' +
        '<div class="avatar">' + escapeHTML(initials(n.clientName)) + '</div>' +
        '<div class="assess-body">' +
        '<div class="assess-top"><span class="assess-name">' + escapeHTML(n.clientName) + '</span><span class="badge">' + meta.label + '</span></div>' +
        '<p class="assess-note">' + escapeHTML(n.text) + '</p>' +
        (n.image ? '<div class="note-photo"><img src="' + n.image + '" alt=""></div>' : '') +
        '<span class="assess-time">' + fmtDate(n.date) + '</span>' +
        '</div>' +
        '</div>';
    }

    function renderNotes() {
      populateNoteClientSelect();
      const sorted = NOTES.slice().sort(function (a, b) { return (a.date < b.date) ? 1 : -1; });
      document.getElementById('recentNotes').innerHTML = sorted.map(renderNoteCard).join('') || '<p class="screen-sub">No notes yet.</p>';
    }

    function saveNote() {
      const sel = document.getElementById('noteClientSelect');
      const clientId = sel.value || null;
      const text = document.getElementById('notesTextarea').value.trim();
      if (!text) { document.getElementById('notesTextarea').focus(); return; }
      let clientName = 'General';
      let category = 'general';
      if (clientId) {
        const c = CLIENTS.find(function (x) { return x.id === clientId; });
        if (c) { clientName = c.name; category = c.category; c.activityLog = c.activityLog || []; c.activityLog.unshift({type: 'note', text: 'Note: ' + text, date: new Date().toISOString()}); }
      }
      NOTES.unshift({ id: uid('n'), clientId: clientId, clientName: clientName, category: category, text: text, image: pendingNoteImage, date: new Date().toISOString().slice(0, 10) });
      addNotification("Note added for " + clientName);
      persist();
      document.getElementById('notesTextarea').value = '';
      document.getElementById('noteImagePreview').innerHTML = '';
      pendingNoteImage = null;
      sel.value = '';
      renderNotes();
      if (currentClientId && clientId === currentClientId) renderClientDetail(currentClientId);
      toast('Note saved');
    }

    /* ===================== Stories ===================== */
    function renderStories() {
      const sorted = STORIES.slice().sort(function (a, b) { return (a.date < b.date) ? 1 : -1; });
      document.getElementById('storiesList').innerHTML = sorted.map(function (s) {
        const meta = CAT_META[s.category];
        return '' +
          '<div class="testimonial-card ' + (SELECT_MODE && SELECTED_IDS.has(s.id) ? 'selected-item' : '') + '" onpointerdown="startPress(\'' + s.id + '\', \'story\')" onpointerup="cancelPress()" onpointercancel="cancelPress()" onpointermove="cancelPress()" onclick="handleItemClick(\'' + s.id + '\', \'story\', \'\')">' +
          '<div class="avatar">' + escapeHTML(initials(s.name)) + '</div>' +
          '<div class="testi-body">' +
          '<div class="testi-top"><span class="testi-name">' + escapeHTML(s.name) + '</span><span class="badge">' + meta.label + '</span></div>' +
          '<p class="testi-quote">' + escapeHTML(s.result) + '</p>' +
          (s.image ? '<div class="note-photo"><img src="' + s.image + '" alt=""></div>' : '') +
          '<div class="stars">' + starsHTML(s.stars) + '</div>' +
          '</div>' +
          '</div>';
      }).join('');
    }

    function openAddStorySheet() {
      pendingStoryImage = null;
      const clientOptions = CLIENTS.map(function (c) { return '<option value="' + c.id + '">' + escapeHTML(c.name) + '</option>'; }).join('');
      const html = '' +
        '<h3>Add Success Story</h3>' +
        '<div class="form-field"><label for="storyClientSelect">Client</label><select id="storyClientSelect" onchange="onStoryClientChange()">' + clientOptions + '</select></div>' +
        '<div class="form-field"><label for="storyResult">Result</label><input type="text" id="storyResult" placeholder="e.g., Back to 5K runs pain-free"></div>' +
        '<div class="form-field"><label>Photo</label><div class="image-input"><input type="file" accept="image/*" id="storyImageFile" onchange="handleImagePick(event,\'story\')" style="display:none"><button type="button" class="image-pick-btn" onclick="document.getElementById(\'storyImageFile\').click()"><i class="fa-solid fa-camera"></i> Add Photo</button><div class="image-preview" id="storyImagePreview"></div></div></div>' +
        '<div class="sheet-actions"><button class="btn-ghost" onclick="closeSheet()">Cancel</button><button class="btn-primary" onclick="saveStory()">Save Story</button></div>';
      document.getElementById('sheetBody').innerHTML = html;
      document.getElementById('sheetOverlay').classList.add('active');
    }

    function onStoryClientChange() { /* no-op, category is derived on save from the selected client */ }

    function saveStory() {
      const clientId = document.getElementById('storyClientSelect').value;
      const result = document.getElementById('storyResult').value.trim();
      const c = CLIENTS.find(function (x) { return x.id === clientId; });
      if (!c || !result) return;
      STORIES.unshift({ id: uid('s'), clientId: c.id, name: c.name, category: c.category, result: result, image: pendingStoryImage, stars: 5, date: new Date().toISOString().slice(0, 10) });
      addNotification("Story added for " + c.name);
      persist();
      closeSheet();
      renderStories();
      toast('Story added');
    }

    /* ===================== Settings ===================== */
    function openSettings() {
      applySettingsToUI();
      goTo('screen-settings');
    }

    function applySettingsToUI() {
      document.querySelectorAll('#screen-settings .seg-btn[data-theme]').forEach(function (b) {
        b.classList.toggle('selected', b.dataset.theme === SETTINGS.theme);
      });
      document.querySelectorAll('#screen-settings .swatch').forEach(function (b) {
        b.classList.toggle('selected', b.dataset.brand === SETTINGS.brand);
      });
      const acctBox = document.getElementById('accountBox');
      if (SETTINGS.signedIn) {
        acctBox.innerHTML = '<p class="screen-sub">Signed in as <strong>' + escapeHTML(SETTINGS.account) + '</strong></p><button class="btn-primary full" onclick="syncNow()"><i class="fa-solid fa-rotate"></i> Sync Now</button><p class="screen-sub" id="lastSyncLine">' + (SETTINGS.lastSync ? ('Last synced: ' + SETTINGS.lastSync) : 'Not synced yet') + '</p>';
      } else {
        acctBox.innerHTML = '<button class="btn-primary full" onclick="goTo(\'screen-signin\', {reset:true})">Sign In to continue</button>';
      }
    }

    function setTheme(mode, el) {
      SETTINGS.theme = mode;
      document.querySelectorAll('#screen-settings .seg-btn[data-theme]').forEach(function (b) { b.classList.toggle('selected', b === el); });
      document.querySelector('.screen').setAttribute('data-theme', mode);
      persist();
    }

    function setBrand(brand, el) {
      SETTINGS.brand = brand;
      const theme = BRAND_HEX[brand] || BRAND_HEX.candy;
      document.querySelectorAll('#screen-settings .swatch').forEach(function (b) { b.classList.toggle('selected', b === el); });
      document.querySelector('.screen').style.setProperty('--brand', theme.color);
      document.querySelector('.screen').style.setProperty('--accent', theme.color);
      document.querySelector('.screen').style.setProperty('--accent-gradient', theme.gradient);
      persist();
    }

    function exportData() {
      const data = { clients: CLIENTS, notes: NOTES, stories: STORIES, exportedAt: new Date().toISOString() };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'true-fit-data.json';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast('Data exported');
    }

    function getUsers() {
      try { return JSON.parse(localStorage.getItem('TRUEFIT_USERS')) || {}; } 
      catch(e) { return {}; }
    }
    
    function saveUsers(users) {
      localStorage.setItem('TRUEFIT_USERS', JSON.stringify(users));
    }

    function signUp() {
      const phone = document.getElementById('signUpPhone').value.trim();
      const pwd = document.getElementById('signUpPassword').value;
      const conf = document.getElementById('signUpConfirm').value;
      if (!phone) { toast('Enter phone number'); return; }
      if (!pwd || pwd.length < 4) { toast('Password too short'); return; }
      if (pwd !== conf) { toast('Passwords do not match'); return; }
      const users = getUsers();
      if (users[phone]) { toast('Account already exists'); return; }
      users[phone] = { password: pwd, name: '' };
      saveUsers(users);
      SETTINGS.signedIn = true;
      SETTINGS.account = phone;
      SETTINGS.userName = '';
      persist();
      toast('Account created');
      goTo('screen-profile', {reset:true});
    }

    function signIn() {
      const phone = document.getElementById('signInPhone').value.trim();
      const pwd = document.getElementById('signInPassword').value;
      if (!phone || !pwd) { toast('Enter phone and password'); return; }
      const users = getUsers();
      if (!users[phone] || users[phone].password !== pwd) { toast('Invalid credentials'); return; }
      SETTINGS.signedIn = true;
      SETTINGS.account = phone;
      SETTINGS.userName = users[phone].name || '';
      persist();
      toast('Signed in');
      if (!SETTINGS.userName) {
        goTo('screen-profile', {reset:true});
      } else {
        goTo('screen-home', {reset:true});
        renderHome();
      }
    }

    function saveProfile() {
      const name = document.getElementById('profileName').value.trim();
      if (!name) { toast('Please enter your name'); return; }
      const users = getUsers();
      if (users[SETTINGS.account]) {
        users[SETTINGS.account].name = name;
        saveUsers(users);
      }
      SETTINGS.userName = name;
      persist();
      goTo('screen-home', {reset:true});
      renderHome();
    }

    function syncNow() {
      SETTINGS.lastSync = 'just now';
      persist();
      toast('Syncing…');
      setTimeout(function () {
        document.getElementById('lastSyncLine').textContent = 'Last synced: just now';
      }, 700);
    }

    function signOut() {
      SETTINGS.signedIn = false;
      SETTINGS.account = null;
      SETTINGS.userName = null;
      persist();
      goTo('screen-signin', { reset: true });
    }

    /* ===================== Multi-Select & Long Press ===================== */
    let pressTimer = null;
    function startPress(id, type) {
      if (SELECT_MODE && SELECT_TYPE === type) return;
      pressTimer = setTimeout(function() {
        SELECT_MODE = true;
        SELECT_TYPE = type;
        SELECTED_IDS.clear();
        SELECTED_IDS.add(id);
        if ('vibrate' in navigator) navigator.vibrate(50);
        updateSelectBar();
        reRenderList(type);
      }, 500);
    }
    function cancelPress() {
      if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
    }
    function handleItemClick(id, type) {
      if (SELECT_MODE) {
        if (SELECT_TYPE !== type) return;
        if (SELECTED_IDS.has(id)) {
          SELECTED_IDS.delete(id);
          if (SELECTED_IDS.size === 0) exitSelectMode();
          else updateSelectBar();
        } else {
          SELECTED_IDS.add(id);
          updateSelectBar();
        }
        reRenderList(type);
        return;
      }
      if (type === 'client') openClientDetail(id);
    }
    function updateSelectBar() {
      let bar = document.getElementById('multiSelectBar');
      if (!bar) {
        bar = document.createElement('div');
        bar.id = 'multiSelectBar';
        bar.className = 'multi-select-bar';
        document.body.appendChild(bar);
      }
      if (SELECT_MODE) {
        bar.innerHTML = '<button class="icon-btn" onclick="exitSelectMode()"><i class="fa-solid fa-xmark"></i></button>' +
                        '<span style="font-weight:600;font-size:17px;color:var(--text);">' + SELECTED_IDS.size + ' Selected</span>' +
                        '<button class="icon-btn" onclick="deleteSelected()" style="color:var(--crimson);"><i class="fa-solid fa-trash"></i></button>';
        bar.classList.add('active');
      } else {
        bar.classList.remove('active');
      }
    }
    function exitSelectMode() {
      SELECT_MODE = false;
      const type = SELECT_TYPE;
      SELECT_TYPE = null;
      SELECTED_IDS.clear();
      updateSelectBar();
      if (type) reRenderList(type);
    }
    function deleteSelected() {
      if (confirm('Delete ' + SELECTED_IDS.size + ' item(s)?')) {
        if (SELECT_TYPE === 'client') CLIENTS = CLIENTS.filter(function(x) { return !SELECTED_IDS.has(x.id); });
        else if (SELECT_TYPE === 'story') STORIES = STORIES.filter(function(x) { return !SELECTED_IDS.has(x.id); });
        else if (SELECT_TYPE === 'note') NOTES = NOTES.filter(function(x) { return !SELECTED_IDS.has(x.id); });
        persist();
        exitSelectMode();
        toast('Deleted successfully');
      }
    }
    function reRenderList(type) {
      if (type === 'client') {
        const cat = document.getElementById('clientListAddBtn') ? document.getElementById('clientListAddBtn').dataset.cat : null;
        if (cat) renderClientList(cat);
      } else if (type === 'story') renderStories();
      else if (type === 'note') renderNotes();
    }

    /* ===================== Toast ===================== */
    let toastTimer;
    function toast(msg) {
      const t = document.getElementById('toast');
      t.textContent = msg;
      t.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function () { t.classList.remove('show'); }, 1800);
    }

    function addNotification(msg) {
      NOTIFICATIONS.unshift({ id: uid('notif'), text: msg, date: new Date().toISOString() });
      const dots = document.querySelectorAll('.bellDot');
      dots.forEach(function(dot) { dot.style.display = 'block'; });
      persist();
    }

    function openNotifications() {
      const dots = document.querySelectorAll('.bellDot');
      dots.forEach(function(dot) { dot.style.display = 'none'; });
      let html = '<h3>Notifications</h3><div style="display:flex;flex-direction:column;gap:12px;">';
      if (NOTIFICATIONS.length === 0) {
        html += '<p class="screen-sub">No recent notifications.</p>';
      } else {
        html += NOTIFICATIONS.map(function(n) { return '<div class="history-entry"><span class="history-date">' + fmtDate(n.date) + '</span><span class="history-text">' + escapeHTML(n.text) + '</span></div>'; }).join('');
      }
      html += '</div><div class="sheet-actions" style="margin-top:16px;"><button class="btn-ghost" onclick="closeSheet()">Close</button></div>';
      document.getElementById('sheetBody').innerHTML = html;
      document.getElementById('sheetOverlay').classList.add('active');
    }

    document.addEventListener('DOMContentLoaded', function () {
      hydrate().then(function () {
        if (!BRAND_HEX[SETTINGS.brand]) SETTINGS.brand = 'candy';
        const theme = BRAND_HEX[SETTINGS.brand];
        document.querySelector('.screen').setAttribute('data-theme', SETTINGS.theme);
        document.querySelector('.screen').style.setProperty('--brand', theme.color);
        document.querySelector('.screen').style.setProperty('--accent', theme.color);
        document.querySelector('.screen').style.setProperty('--accent-gradient', theme.gradient);
        renderHome();
        renderNotes();
        renderStories();
        applySettingsToUI();
        goTo('screen-splash', { reset: true });
        setTimeout(function () {
          if (document.getElementById('screen-splash').classList.contains('active')) {
            goTo('screen-signin', { reset: true });
          }
        }, 2200);
      });
    });

/* ===================== Window Exports ===================== */
window.toggleAccordion = toggleAccordion;
window.signUp = signUp;
window.signIn = signIn;
window.saveProfile = saveProfile;
window.setClientsHeaderMode = setClientsHeaderMode;
window.pendingNewClient = pendingNewClient;
window.pendingNoteImage = pendingNoteImage;
window.renderClientList = renderClientList;
window.renderNoteCard = renderNoteCard;
window.STORIES = STORIES;
window.editClientTags = editClientTags;
window.pendingStoryImage = pendingStoryImage;
window.flowMode = flowMode;
window.SELECT_MODE = SELECT_MODE;
window.handleTaxonomyCTA = handleTaxonomyCTA;
window.NOTIFICATIONS = NOTIFICATIONS;
window.goTo = goTo;
window.currentSheetClientId = currentSheetClientId;
window.SETTINGS = SETTINGS;
window.escapeHTML = escapeHTML;
window.handleImagePick = handleImagePick;
window.goToTab = goToTab;
window.startAddClientInCategory = startAddClientInCategory;
window.updateCategoryCardCounts = updateCategoryCardCounts;
window.setActiveTab = setActiveTab;
window.initials = initials;
window.toggleSingle = toggleSingle;
window.applySettingsToUI = applySettingsToUI;
window.uid = uid;
window.exportClientPDF = async function() {
  const c = CLIENTS.find(function (x) { return x.id === currentClientId; });
  if (!c) return;
  
  const container = document.getElementById('pdf-report-container');
  const today = new Date().toLocaleDateString();
  const clientNotes = NOTES.filter(function (n) { return n.clientId === c.id; }).sort(function (a, b) { return (a.date < b.date) ? 1 : -1; });
  
  const html = '<div class="pdf-report">' +
               '<div class="pdf-header">' +
               '<div class="pdf-header-left">' +
               '<img src="./TrueFit.png" alt="TrueFit Logo" class="pdf-logo" />' +
               '<h1>Client Progress Report</h1>' +
               '<p>TrueFit Personal Training</p>' +
               '</div>' +
               '<div class="pdf-header-right">' +
               '<p><strong>Date:</strong> ' + today + '</p>' +
               '<p><strong>Sessions:</strong> ' + c.sessionsLog.length + ' / ' + c.sessionsTotal + '</p>' +
               '</div>' +
               '</div>' +
               
               '<div class="pdf-section-title">Client Overview</div>' +
               '<table class="pdf-table">' +
               '<tr><th>Name</th><td>' + escapeHTML(c.name) + '</td></tr>' +
               '<tr><th>Category</th><td>' + escapeHTML(CAT_META[c.category] ? CAT_META[c.category].label : c.category) + '</td></tr>' +
               '<tr><th>Height / Weight</th><td>' + (c.height || '—') + ' cm / ' + (c.weight || '—') + ' kg</td></tr>' +
               '</table>' +
               
               '<div class="pdf-section-title">Active Protocols</div>' +
               '<table class="pdf-table">' +
               '<tr><th>Nutrition Protocol</th><td>' + escapeHTML(c.nutrition.current || 'Not set yet.') + '</td></tr>' +
               '<tr><th>Training Protocol</th><td>' + escapeHTML(c.workout.current || 'Not set yet.') + '</td></tr>' +
               '</table>' +
               
               '<div class="pdf-section-title">Assessment History Ledger</div>' +
               (clientNotes.length > 0 
                 ? '<table class="pdf-table pdf-table-history">' +
                   '<tr><th>Date</th><th>Assessment Notes</th></tr>' +
                   clientNotes.map(function(n) { 
                     return '<tr><td>' + fmtDate(n.date) + '</td><td>' + escapeHTML(n.text) + '</td></tr>'; 
                   }).join('') +
                   '</table>' 
                 : '<div class="pdf-text-block">No assessment notes recorded for this client.</div>') +
               '</div>';
               
  container.innerHTML = html;
  container.style.display = 'block';

  const opt = {
    margin:       10,
    filename:     c.name.replace(/\s+/g, '_') + '_Report.pdf',
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2 },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  try {
    await html2pdf().set(opt).from(container).save();
  } catch (err) {
    console.error("PDF Export failed:", err);
  }
  
  container.style.display = 'none';
  container.innerHTML = '';
};
window.openClientDetail = openClientDetail;
window.currentSheetMode = currentSheetMode;
window.CLIENTS = CLIENTS;
window.toggleMulti = toggleMulti;
window.categoryCount = categoryCount;
window.saveNote = saveNote;
window.populateNoteClientSelect = populateNoteClientSelect;
window.seedStories = seedStories;
window.signOut = signOut;
window.fmtDate = fmtDate;
window.renderClientDetail = renderClientDetail;
window.openSheet = openSheet;
window.refreshCTA = refreshCTA;
window.filterConditions = filterConditions;
window.startPress = startPress;
window.cancelPress = cancelPress;
window.handleItemClick = handleItemClick;
window.exitSelectMode = exitSelectMode;
window.deleteSelected = deleteSelected;
window.SCREEN_TAB = SCREEN_TAB;
window.starsHTML = starsHTML;
window.NOTES = NOTES;
window.openEditSheet = openEditSheet;
window.saveEditSheet = saveEditSheet;
window.toast = toast;
window.exportData = exportData;
window.saveStory = saveStory;
window.goBack = goBack;
window.markSession = markSession;
window.BRAND_HEX = BRAND_HEX;
window.editHistoryLog = function(category, index) {
  currentSheetMode = 'history-' + category;
  currentHistoryIndex = index;
  const c = CLIENTS.find(function(x) { return x.id === currentClientId; });
  const entry = c[category].history[index];
  
  let html = '<h3>Edit Log</h3>' +
             '<div class="form-field"><label>Notes</label><textarea id="sheetTextarea" rows="4">' + escapeHTML(entry.text) + '</textarea></div>' +
             '<div class="sheet-actions" style="display:flex; gap:12px;">' +
             '<button class="btn-ghost" style="flex:1; border-color:#FF3B30; color:#FF3B30;" onclick="deleteHistoryLog(\'' + category + '\', ' + index + ')">Delete</button>' +
             '<button class="btn-primary" style="flex:1;" onclick="saveEditHistory()">Save</button>' +
             '</div>';
             
  document.getElementById('sheetBody').innerHTML = html;
  document.getElementById('sheetOverlay').classList.add('active');
};

window.deleteHistoryLog = function(category, index) {
  if (!confirm('Are you sure you want to delete this log entry?')) return;
  const c = CLIENTS.find(function(x) { return x.id === currentClientId; });
  c[category].history.splice(index, 1);
  
  // If we just deleted the ONLY entry, clear current
  if (c[category].history.length === 0) {
    c[category].current = '';
  } else if (index === 0) {
    // If we deleted the first entry, promote the next one to current
    c[category].current = c[category].history[0].text;
  }
  
  window.persist();
  window.renderClientDetail(currentClientId);
  window.closeSheet();
};

window.saveEditHistory = function() {
  const c = CLIENTS.find(function(x) { return x.id === currentClientId; });
  const val = document.getElementById('sheetTextarea').value.trim();
  if(!val) return;
  
  const category = currentSheetMode.replace('history-', '');
  c[category].history[currentHistoryIndex].text = val;
  
  if (currentHistoryIndex === 0) {
    c[category].current = val;
  }
  
  window.persist();
  window.renderClientDetail(currentClientId);
  window.closeSheet();
};

window.syncNow = syncNow;
window.navStack = navStack;
window.renderHistoryLog = renderHistoryLog;
window.openAddStorySheet = openAddStorySheet;
window.prefillTaxonomy = prefillTaxonomy;
window.SELECTED_IDS = SELECTED_IDS;
window.seedClients = seedClients;
window.renderNewClientInfoHeader = renderNewClientInfoHeader;
window.setTheme = setTheme;
window.flowState = flowState;
window.currentClientId = currentClientId;
window.renderHome = renderHome;
window.renderStories = renderStories;
window.onStoryClientChange = onStoryClientChange;
window.seedNotes = seedNotes;
window.handleCategoryCardTap = handleCategoryCardTap;
window.openSettings = openSettings;
window.flowClientId = flowClientId;
window.closeSheet = closeSheet;
window.startAddClient = startAddClient;
window.resetTaxonomyScreen = resetTaxonomyScreen;
window.saveNewClient = saveNewClient;
window.setBrand = setBrand;
window.memoryStore = memoryStore;
window.renderNotes = renderNotes;
window.addNotification = addNotification;
window.TAB_SCREEN = TAB_SCREEN;
window.SELECT_TYPE = SELECT_TYPE;
window.renderActivityLog = renderActivityLog;
window.CAT_META = CAT_META;
window.openNotifications = openNotifications;
window.seedDates = seedDates;
