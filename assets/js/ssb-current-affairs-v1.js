(function () {
  'use strict';
  const root = document.getElementById('ssb-current-affairs');
  const panel = document.getElementById('panel-currentaffairs');
  if (!root || !panel) return;
  const categories = [
    { id: 'defence', name: 'Defence & National Security', colour: '#2454a5', tint: '#eef4fc' },
    { id: 'international', name: 'International Relations', colour: '#7043a0', tint: '#f4effa' },
    { id: 'society', name: 'India, Society & Youth', colour: '#00767a', tint: '#eef8f8' },
    { id: 'economy', name: 'Economy & Technology', colour: '#a55514', tint: '#fcf4ec' },
    { id: 'environment', name: 'Environment, Energy & Sports', colour: '#267542', tint: '#eff8f1' }
  ];
  const pointColours = ['#2454a5', '#00767a', '#7043a0', '#a64b24', '#267542', '#193f68', '#8e356b', '#006784', '#876113', '#435a72'];
  const tabs = Array.from(root.querySelectorAll('[data-ca-category]'));
  const listView = document.getElementById('ca-list-view');
  const cards = document.getElementById('ca-cards');
  const detail = document.getElementById('ca-detail-view');
  const search = document.getElementById('ca-search');
  const title = document.getElementById('ca-category-title');
  const summary = document.getElementById('ca-list-summary');
  const status = document.getElementById('ca-status');
  let data = null;
  let loading = null;
  let currentCategory = 'defence';
  let currentTopic = null;
  let lastCard = null;
  const escape = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  const categoryOf = topic => categories[Math.floor((topic.id - 1) / 10)];
  const selectedCategory = () => categories.find(category => category.id === currentCategory) || categories[0];
  const sourceUrl = value => { try { const url = new URL(value); return url.protocol === 'https:' ? url.href : ''; } catch (_) { return ''; } };
  function setCategory(id) {
    currentCategory = categories.some(category => category.id === id) ? id : 'defence';
    const category = selectedCategory();
    root.style.setProperty('--ca-accent', category.colour);
    root.style.setProperty('--ca-tint', category.tint);
    tabs.forEach(tab => {
      const selected = tab.dataset.caCategory === currentCategory;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
  }
  function updateUrl(topicId, replace) {
    const url = new URL(location.href);
    url.searchParams.set('ca_category', currentCategory);
    if (topicId) url.searchParams.set('ca_topic', String(topicId));
    else url.searchParams.delete('ca_topic');
    const query = search.value.trim();
    if (query) url.searchParams.set('ca_search', query); else url.searchParams.delete('ca_search');
    url.hash = 'currentaffairs';
    history[replace ? 'replaceState' : 'pushState']({ ca: true }, '', url.href);
  }
  function cardMarkup(topic) {
    const category = categoryOf(topic);
    const url = new URL(location.href);
    url.searchParams.set('ca_category', category.id);
    url.searchParams.set('ca_topic', String(topic.id));
    url.hash = 'currentaffairs';
    const source = data.sources[topic.src];
    return '<a class="ca-topic-card" data-ca-topic="' + topic.id + '" href="' + escape(url.href) + '" style="--card-accent:' + category.colour + '">' +
      '<div class="ca-card-meta"><strong>TOPIC ' + String(topic.id).padStart(2, '0') + '</strong>' + (topic.focus ? '<span class="ca-priority">Start here</span>' : '<span>10 points</span>') + '</div>' +
      '<h4>' + escape(topic.title) + '</h4><p>' + escape(topic.hook) + '</p>' +
      '<div class="ca-card-footer"><span>Read topic · ' + escape(source[1]) + '</span><span aria-hidden="true">→</span></div></a>';
  }
  function renderList(focusCard) {
    currentTopic = null;
    listView.hidden = false;
    detail.hidden = true;
    listView.setAttribute('aria-labelledby', 'ca-tab-' + currentCategory);
    tabs.forEach(tab => tab.setAttribute('aria-controls', 'ca-list-view'));
    const query = search.value.trim().toLocaleLowerCase();
    const selected = selectedCategory();
    const pool = query ? data.topics : data.topics.filter(topic => categoryOf(topic).id === currentCategory);
    const matches = pool.filter(topic => !query || [topic.title, topic.hook, topic.q, categoryOf(topic).name, ...topic.points].join(' ').toLocaleLowerCase().includes(query));
    title.textContent = query ? 'Search results' : selected.name;
    summary.textContent = query ? matches.length + ' topic' + (matches.length === 1 ? '' : 's') + ' across all five categories' : '10 topics · Choose a card to read its ten points';
    cards.innerHTML = matches.length ? matches.map(cardMarkup).join('') : '<div class="ca-empty">No topics match your search. Try a shorter word or choose another category.</div>';
    status.textContent = matches.length + ' topics shown';
    if (focusCard) {
      const card = root.querySelector('[data-ca-topic="' + focusCard + '"]');
      if (card) card.focus(); else title.focus();
    }
  }
  function pointMarkup(point, index) {
    const separator = point.indexOf(': ');
    const heading = separator >= 0 ? point.slice(0, separator) : '';
    const text = separator >= 0 ? point.slice(separator + 2) : point;
    const colour = pointColours[index % pointColours.length];
    return '<li class="ca-point" style="--point-colour:' + colour + ';--point-bg:' + colour + '07;--point-border:' + colour + '1c"><span class="ca-point-number" aria-hidden="true">' + (index + 1) + '</span><div>' + (heading ? '<strong>' + escape(heading) + ':</strong> ' : '') + escape(text) + '</div></li>';
  }
  function sourceMarkup(topic) {
    const keys = [topic.src].concat(data.background[String(topic.id)] || []);
    return keys.map(key => {
      const source = data.sources[key];
      if (!source) return '';
      const url = sourceUrl(source[2]);
      if (!url) return '';
      return '<li><a href="' + escape(url) + '" target="_blank" rel="noopener noreferrer">' + escape(source[0]) + '<span class="sr-only"> (opens in a new tab)</span></a><small>' + escape(source[1]) + '</small></li>';
    }).join('');
  }
  function openTopic(id, navigate, focus) {
    const topic = data.topics.find(item => item.id === Number(id));
    if (!topic) { renderList(); return; }
    currentTopic = topic.id;
    setCategory(categoryOf(topic).id);
    if (navigate) updateUrl(topic.id, false);
    listView.hidden = true;
    detail.hidden = false;
    tabs.forEach(tab => tab.setAttribute('aria-controls', 'ca-detail-view'));
    const category = categoryOf(topic);
    detail.innerHTML = '<div class="ca-detail-top"><button type="button" class="ca-back" data-ca-back>← Back to topics</button><span class="ca-detail-count">Topic ' + topic.id + ' of 50</span></div>' +
      '<div class="ca-detail-heading"><p class="ca-eyebrow">' + escape(category.name) + '</p><h3 id="ca-topic-title" tabindex="-1">' + escape(topic.title) + '</h3><p class="ca-detail-intro"><strong>Recent update · ' + escape(data.sources[topic.src][1]) + '</strong>' + escape(topic.hook) + '</p></div>' +
      '<div class="ca-detail-layout"><div class="ca-points-wrap"><h4>10 important points to understand the topic</h4><ol class="ca-points">' + topic.points.map(pointMarkup).join('') + '</ol></div>' +
      '<aside class="ca-study-sidebar" aria-label="SSB practice and sources"><section class="ca-study-box"><h4>Interview practice</h4><p>' + escape(topic.q) + '</p></section>' +
      '<section class="ca-study-box ca-view"><h4>A balanced view</h4><p>' + escape(topic.view) + '</p></section>' +
      '<section class="ca-study-box"><h4>Group discussion leads</h4><ul class="ca-gd-leads">' + topic.gd.split('|').map(lead => '<li>' + escape(lead.trim()) + '</li>').join('') + '</ul></section>' +
      '<section class="ca-study-box"><h4>Try a three-minute talk</h4><p class="ca-lecturette-tip">Explain the meaning, mention the update, develop two or three points, acknowledge one challenge and give your conclusion.</p></section>' +
      '<section class="ca-study-box"><h4>Read the sources</h4><ul class="ca-source-list">' + sourceMarkup(topic) + '</ul></section></aside></div>' +
      '<nav class="ca-detail-nav" aria-label="Topic navigation"><button type="button" data-ca-step="-1"' + (topic.id === 1 ? ' disabled' : '') + '>← Previous topic</button><button type="button" data-ca-step="1"' + (topic.id === 50 ? ' disabled' : '') + '>Next topic →</button></nav>' +
      '<p class="ca-note">Use these points to form your own understanding. Topics and practice questions are preparation priorities, not guaranteed SSB questions. Recheck changing developments before your interview.</p>';
    status.textContent = topic.title + ', ten points';
    if (focus && !panel.hidden) {
      document.getElementById('ca-topic-title').focus();
      detail.scrollIntoView({ block: 'start', behavior: 'auto' });
    }
  }
  function showCategories(navigate) {
    currentTopic = null;
    listView.hidden = true;
    detail.hidden = true;
    search.value = '';
    tabs.forEach((tab, index) => {
      tab.setAttribute('aria-selected', 'false');
      tab.setAttribute('aria-controls', 'ca-list-view');
      tab.tabIndex = index === 0 ? 0 : -1;
    });
    status.textContent = 'Choose one of the five categories to see its topics';
    if (navigate) {
      const url = new URL(location.href);
      ['ca_category', 'ca_topic', 'ca_search'].forEach(key => url.searchParams.delete(key));
      url.hash = 'currentaffairs';
      history.pushState({ ca: true }, '', url.href);
      tabs[0].focus();
    }
  }
  function syncFromUrl(focus) {
    if (!data) return;
    const url = new URL(location.href);
    setCategory(url.searchParams.get('ca_category'));
    search.value = url.searchParams.get('ca_search') || '';
    const id = Number(url.searchParams.get('ca_topic'));
    if (Number.isInteger(id) && id >= 1 && id <= 50) openTopic(id, false, focus);
    else if (categories.some(category => category.id === url.searchParams.get('ca_category'))) renderList();
    else showCategories(false);
  }
  async function ensureLoaded() {
    if (data) return;
    if (loading) return loading;
    cards.innerHTML = '<div class="ca-loading">Loading your current-affairs topics…</div>';
    root.setAttribute('aria-busy', 'true');
    loading = (async () => {
      try {
        const response = await fetch('assets/data/ssb-current-affairs-v1.json?v=1', { credentials: 'same-origin' });
        if (!response.ok) throw new Error('Content unavailable');
        const result = await response.json();
        if (!Array.isArray(result.topics) || result.topics.length !== 50 || !result.sources || !result.background || !result.topics.every(topic => Array.isArray(topic.points) && topic.points.length === 10 && result.sources[topic.src])) throw new Error('Invalid content');
        data = result;
        syncFromUrl(false);
      } catch (_) {
        cards.innerHTML = '<div class="ca-error">The topics could not load. Please try again.<br><button type="button" data-ca-retry>Retry loading topics</button></div>';
        status.textContent = 'Topics could not load';
      } finally {
        root.setAttribute('aria-busy', 'false');
        loading = null;
      }
    })();
    return loading;
  }
  root.addEventListener('click', event => {
    if (event.target.closest('[data-ca-categories]')) { showCategories(true); return; }
    const categoryTab = event.target.closest('[data-ca-category]');
    if (categoryTab) {
      setCategory(categoryTab.dataset.caCategory);
      search.value = '';
      if (data) renderList();
      else { listView.hidden = false; detail.hidden = true; }
      updateUrl(null, false);
      if (!data) void ensureLoaded();
      if (typeof categoryTab.scrollIntoView === 'function') categoryTab.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      return;
    }
    const card = event.target.closest('[data-ca-topic]');
    if (card && data && !event.ctrlKey && !event.metaKey && !event.shiftKey && event.button === 0) {
      event.preventDefault(); lastCard = Number(card.dataset.caTopic); openTopic(lastCard, true, true); return;
    }
    if (event.target.closest('[data-ca-back]') && data) {
      updateUrl(null, false); renderList(lastCard); return;
    }
    const step = event.target.closest('[data-ca-step]');
    if (step && !step.disabled && data && currentTopic) {
      openTopic(currentTopic + Number(step.dataset.caStep), true, true); return;
    }
    if (event.target.closest('[data-ca-retry]')) void ensureLoaded();
  });
  tabs.forEach((tab, index) => tab.addEventListener('keydown', event => {
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else return;
    event.preventDefault();tabs[next].focus();tabs[next].click();
  }));
  search.addEventListener('input', () => { if (data) { renderList(); updateUrl(null, true); } });
  window.addEventListener('popstate', () => { syncFromUrl(!panel.hidden); });
  window.addEventListener('hashchange', () => { if (location.hash === '#currentaffairs') { void ensureLoaded(); if (data) syncFromUrl(false); } });
  new MutationObserver(() => { if (!panel.hidden) void ensureLoaded(); }).observe(panel, { attributes: true, attributeFilter: ['hidden'] });
  if (!panel.hidden) void ensureLoaded();
})();
