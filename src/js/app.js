import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';

/* ===================== State ===================== */
    // Placeholder Firebase Config
    const firebaseConfig = {
      apiKey: "AIzaSyDPImklFAlLTY1ETkV4YCBRDN9b7VWeHcE",
      authDomain: "truefit-442a3.firebaseapp.com",
      projectId: "truefit-442a3",
      storageBucket: "truefit-442a3.firebasestorage.app",
      messagingSenderId: "716212569927",
      appId: "1:716212569927:android:50c85c84a4b0a657fcee62"
    };
    if(firebase.apps.length === 0) { firebase.initializeApp(firebaseConfig); }
    const auth = firebase.auth();
    const googleProvider = new firebase.auth.GoogleAuthProvider();

    let NOTIFICATIONS = [];
    let CLIENTS = [];
    let NOTES = [];
    let STORIES = [];
    let SETTINGS = { theme: 'light', brand: 'ember', signedIn: false, account: null, lastSync: null };

    let flowState = { general: [], special: [], sports: [], rehab: [] };
    let flowMode = 'browse'; // 'browse' | 'newClient' | 'editClient'
    let flowClientId = null;
    let pendingNewClient = {};
    let currentClientId = null;
    let currentSheetMode = null;
    let currentSheetClientId = null;
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
    const BRAND_HEX = { ember: '#F0653A', pulse: '#2FA89F', crimson: '#E2445E', moss: '#3FA669', neon: '#00F0FF', royal: '#7B2CBF' };

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
      const greeting = h < 12 ? 'Good morning, Divya' : (h < 17 ? 'Good afternoon, Divya' : 'Good evening, Divya');
      document.getElementById('homeGreeting').textContent = greeting;
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
        return '<div class="activity-row"><span class="activity-dot accent-' + meta.accent + '"></span><div><p>Note logged — ' + escapeHTML(n.clientName) + ' <span class="tag-inline accent-' + meta.accent + '">' + meta.label + '</span></p><span class="activity-time">' + fmtDate(n.date) + '</span></div></div>';
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
      header.className = 'detail-header accent-' + meta.accent;
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
          '<div class="mini-progress"><div class="mini-progress-fill accent-' + meta.accent + '" style="width:' + pct + '%"></div></div>' +
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
      screenEl.classList.add('accent-' + meta.accent);
      document.getElementById('newClientCatBadge').innerHTML = '<span class="badge accent-' + meta.accent + '">' + meta.label + '</span>';
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
        '<div class="detail-header accent-' + meta.accent + '">' +
        '<button class="back-btn" onclick="goBack(\'screen-client-list\')"><i class="fa-solid fa-arrow-left"></i></button>' +
        '<div class="avatar avatar-lg">' + escapeHTML(initials(c.name)) + '</div>' +
        '<div class="client-detail-title"><h2>' + escapeHTML(c.name) + '</h2><span class="badge accent-' + meta.accent + '">' + meta.label + '</span></div>' +
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
        '<div class="progress-bar"><div class="progress-fill accent-' + meta.accent + '" style="width:' + pct + '%"></div></div>' +
        '<p class="screen-sub" style="margin:8px 0 12px;">' + c.sessionsLog.length + ' of ' + c.sessionsTotal + ' attended</p>' +
        '<button class="btn-primary full accent-' + meta.accent + '" onclick="markSession()"><i class="fa-solid fa-check"></i> Mark Today\u2019s Session</button>' +
        '</div>' +

        '<div class="card">' +
        '<div class="card-title-row"><p class="card-title">Nutrition</p><button class="edit-icon-btn" onclick="openEditSheet(\'nutrition\')"><i class="fa-solid fa-pen"></i> Edit</button></div>' +
        '<p class="screen-sub">' + escapeHTML(c.nutrition.current || 'Not set yet.') + '</p>' +
        renderHistoryLog(c.nutrition.history) +
        '</div>' +

        '<div class="card">' +
        '<div class="card-title-row"><p class="card-title">Workout</p><button class="edit-icon-btn" onclick="openEditSheet(\'workout\')"><i class="fa-solid fa-pen"></i> Edit</button></div>' +
        '<p class="screen-sub">' + escapeHTML(c.workout.current || 'Not set yet.') + '</p>' +
        renderHistoryLog(c.workout.history) +
        '</div>' +

        '<div class="card-title-row" style="margin-top:22px;"><p class="section-label" style="margin:0;">Notes &amp; Photos</p></div>' +
        clientNotes.map(renderNoteCard).join('') +
        (clientNotes.length === 0 ? '<p class="screen-sub">No notes for this client yet.</p>' : '');

      document.getElementById('clientDetailBody').innerHTML = html;
    }

    function renderHistoryLog(history) {
      if (!history || history.length === 0) return '';
      return '<div class="history-log">' + history.slice(0, 4).map(function (h) {
        return '<div class="history-entry"><span class="history-date">' + fmtDate(h.date) + '</span><span class="history-text">' + escapeHTML(h.text) + '</span></div>';
      }).join('') + '</div>';
    }

    /* ===================== Generic edit sheet (body stats / nutrition / workout) ===================== */
    function openEditSheet(kind) {
      currentSheetMode = kind;
      currentSheetClientId = currentClientId;
      const c = CLIENTS.find(function (x) { return x.id === currentClientId; });
      let html = '';
      if (kind === 'nutrition') {
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
      if (currentSheetMode === 'nutrition' || currentSheetMode === 'workout') {
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
        '<div class="assess-top"><span class="assess-name">' + escapeHTML(n.clientName) + '</span><span class="badge accent-' + meta.accent + '">' + meta.label + '</span></div>' +
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
          '<div class="testi-top"><span class="testi-name">' + escapeHTML(s.name) + '</span><span class="badge accent-' + meta.accent + '">' + meta.label + '</span></div>' +
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
        '<div class="sheet-actions"><button class="btn-ghost" onclick="closeSheet()">Cancel</button><button class="btn-primary accent-ember" onclick="saveStory()">Save Story</button></div>';
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
        acctBox.innerHTML = '<p class="screen-sub">Signed in as <strong>' + escapeHTML(SETTINGS.account) + '</strong></p><button class="btn-primary full accent-ember" onclick="syncNow()"><i class="fa-solid fa-rotate"></i> Sync Now</button><p class="screen-sub" id="lastSyncLine">' + (SETTINGS.lastSync ? ('Last synced: ' + SETTINGS.lastSync) : 'Not synced yet') + '</p><button class="btn-ghost full" onclick="signOut()" style="margin-top:8px;">Sign Out</button>';
      } else {
        acctBox.innerHTML = googleButtonHTML('signInFromSettings()');
      }
    }

    function googleButtonHTML(onclick) {
      return '<button class="google-btn" onclick="' + onclick + '">' + googleGlyph() + '<span>Continue with Google</span></button>';
    }

    function googleGlyph() {
      return '<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z"/><path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.98v2.33A9 9 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.98A9 9 0 0 0 0 9c0 1.45.35 2.83.98 4.03l2.97-2.33z"/><path fill="#EA4335" d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .98 4.97l2.97 2.33C4.66 5.17 6.65 3.58 9 3.58z"/></svg>';
    }

    function setTheme(mode, el) {
      SETTINGS.theme = mode;
      document.querySelectorAll('#screen-settings .seg-btn[data-theme]').forEach(function (b) { b.classList.toggle('selected', b === el); });
      document.querySelector('.screen').setAttribute('data-theme', mode);
      persist();
    }

    function setBrand(brand, el) {
      SETTINGS.brand = brand;
      document.querySelectorAll('#screen-settings .swatch').forEach(function (b) { b.classList.toggle('selected', b === el); });
      document.querySelector('.screen').style.setProperty('--brand', BRAND_HEX[brand]);
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

    let confirmationResult = null;
    let verificationId = null;

    async function sendSmsCode() {
      const phone = document.getElementById('phoneInput').value.trim();
      if (!phone) { toast('Enter a phone number'); return; }

      toast('Sending SMS...');
      if (Capacitor.isNativePlatform()) {
        try {
          const result = await FirebaseAuthentication.signInWithPhoneNumber({ phoneNumber: phone });
          verificationId = result.verificationId;
          document.getElementById('phoneInputSection').style.display = 'none';
          document.getElementById('otpInputSection').style.display = 'block';
          toast('SMS Sent');
        } catch(err) {
          console.error(err);
          const errMsg = document.getElementById('errorScreenMsg');
          if (errMsg) errMsg.textContent = err.message || "Native SMS error.";
          goTo('screen-error', { reset: true });
        }
      } else {
        try {
          if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', { size: 'invisible' });
          }
          confirmationResult = await auth.signInWithPhoneNumber(phone, window.recaptchaVerifier);
          document.getElementById('phoneInputSection').style.display = 'none';
          document.getElementById('otpInputSection').style.display = 'block';
          toast('SMS Sent');
        } catch(err) {
          console.error(err);
          const errMsg = document.getElementById('errorScreenMsg');
          if (errMsg) errMsg.textContent = err.message || "Web SMS error.";
          goTo('screen-error', { reset: true });
        }
      }
    }

    async function verifySmsCode() {
      const code = document.getElementById('otpInput').value.trim();
      if (!code || code.length < 6) { toast('Enter the 6-digit code'); return; }
      
      toast('Verifying...');
      try {
        let user;
        if (Capacitor.isNativePlatform()) {
          const result = await FirebaseAuthentication.signInWithPhoneNumber({ verificationId, smsCode: code });
          // Link Capacitor session with Firebase JS SDK
          const credential = firebase.auth.PhoneAuthProvider.credential(verificationId, code);
          const userCredential = await auth.signInWithCredential(credential);
          user = userCredential.user;
        } else {
          const userCredential = await confirmationResult.confirm(code);
          user = userCredential.user;
        }
        
        SETTINGS.signedIn = true;
        SETTINGS.account = user.phoneNumber;
        persist();
        toast('Signed in');
        goTo('screen-home', { reset: true });
        renderHome();
      } catch(err) {
        console.error(err);
        const errMsg = document.getElementById('errorScreenMsg');
        if (errMsg) errMsg.textContent = err.message || "Invalid OTP Code.";
        goTo('screen-error', { reset: true });
      }
    }

    function signInFromSettings() {
      SETTINGS.signedIn = true;
      SETTINGS.account = 'divya.trainer@gmail.com';
      persist();
      applySettingsToUI();
      toast('Signed in');
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
      firebase.auth().signOut().then(function() {
        goTo('screen-signin', { reset: true });
      });
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
        document.querySelector('.screen').setAttribute('data-theme', SETTINGS.theme);
        document.querySelector('.screen').style.setProperty('--brand', BRAND_HEX[SETTINGS.brand]);
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
window.sendSmsCode = sendSmsCode;
window.verifySmsCode = verifySmsCode;
window.setClientsHeaderMode = setClientsHeaderMode;
window.pendingNewClient = pendingNewClient;
window.pendingNoteImage = pendingNoteImage;
window.signInFromSettings = signInFromSettings;
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
window.googleButtonHTML = googleButtonHTML;
window.goToTab = goToTab;
window.startAddClientInCategory = startAddClientInCategory;
window.updateCategoryCardCounts = updateCategoryCardCounts;
window.setActiveTab = setActiveTab;
window.initials = initials;
window.toggleSingle = toggleSingle;
window.applySettingsToUI = applySettingsToUI;
window.uid = uid;
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
window.googleGlyph = googleGlyph;
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
