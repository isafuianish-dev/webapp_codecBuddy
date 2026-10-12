(function () {
  'use strict';

  var APP_KEY = 'webapp_codecBuddy';
  var APP_VERSION = '001.001';
  var ACTIVE_TOOL_KEY = APP_KEY + '.activeTool.v1';
  var JSON_MODE_KEY = APP_KEY + '.jsonMode.v1';
  var TOOLS = ['base64', 'url', 'hex', 'jwt', 'json', 'replicate', 'regex'];

  var ICONS = Buddy.ICONS;
  var escapeHtml = Buddy.escapeHtml;

  var FLAG_INFO = [
    { id: 'g', title: 'Global — find all matches, not just the first' },
    { id: 'i', title: 'Ignore case' },
    { id: 'm', title: 'Multiline — ^ and $ match line boundaries' },
    { id: 's', title: 'Dot matches newline (dotAll)' },
    { id: 'u', title: 'Unicode mode' },
    { id: 'y', title: 'Sticky — match only starting at lastIndex' }
  ];

  var SAMPLE_PATTERNS = [
    { name: 'Email address', pattern: '[\\w.+-]+@[\\w-]+\\.[a-zA-Z]{2,}', flags: 'g' },
    { name: 'URL (http/https)', pattern: 'https?:\\/\\/[^\\s]+', flags: 'g' },
    { name: 'IPv4 address', pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b', flags: 'g' },
    { name: 'Phone number (US)', pattern: '\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}', flags: 'g' },
    { name: 'Date (YYYY-MM-DD)', pattern: '\\d{4}-\\d{2}-\\d{2}', flags: 'g' },
    { name: 'Hex color', pattern: '#(?:[0-9a-fA-F]{3}){1,2}\\b', flags: 'g' },
    { name: 'Digits only', pattern: '^\\d+$', flags: 'gm' },
    { name: 'Whitespace', pattern: '\\s+', flags: 'g' },
    { name: 'Alphanumeric + _ -', pattern: '^[a-zA-Z0-9_-]+$', flags: 'gm' },
    { name: 'US ZIP code', pattern: '^\\d{5}(-\\d{4})?$', flags: 'gm' }
  ];

  var dom = {};
  var state = { activeTool: 'base64', jsonMode: 'beautify', regexFlags: { g: true } };
  var regexMatchTimer = null;

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    cacheDom();
    initStaticIcons();
    bindGlobalEvents();
    wireCodecPair(dom.base64Plain, dom.base64Encoded, dom.base64PlainError, dom.base64EncodedError, toBase64, fromBase64);
    wireCodecPair(dom.urlPlain, dom.urlEncoded, dom.urlPlainError, dom.urlEncodedError, toUrlEncoded, fromUrlEncoded);
    wireCodecPair(dom.hexPlain, dom.hexEncoded, dom.hexPlainError, dom.hexEncodedError, toHex, fromHex);
    dom.jwtInput.addEventListener('input', renderJwt);

    dom.jsonInput.addEventListener('input', renderJson);
    dom.btnJsonMinify.addEventListener('click', function () { setJsonMode('minify'); });
    dom.btnJsonBeautify.addEventListener('click', function () { setJsonMode('beautify'); });
    state.jsonMode = loadJsonMode();
    updateJsonModeButtons();

    dom.btnReplicateGenerate.addEventListener('click', function () {
      dom.replicateOutput.value = generateReplicateOutput();
    });
    [dom.replicateData, dom.replicateTemplate].forEach(function (el) {
      el.addEventListener('animationend', function () {
        el.classList.remove('flash-error');
      });
    });

    renderFlagChips();
    renderPatternPickerMenu();
    dom.regexPatternInput.addEventListener('input', scheduleMatch);
    dom.regexTestInput.addEventListener('input', scheduleMatch);
    dom.regexReplaceInput.addEventListener('input', scheduleMatch);
    dom.btnPatternPicker.addEventListener('click', function (e) {
      e.stopPropagation();
      togglePatternPicker();
    });
    document.addEventListener('click', function (e) {
      if (dom.patternPickerMenu.hidden) return;
      if (e.target.closest('.pattern-picker')) return;
      closePatternPicker();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !dom.patternPickerMenu.hidden) closePatternPicker();
    });
    runMatch();

    state.activeTool = loadActiveTool();
    setActiveTool(state.activeTool);
  }

  function cacheDom() {
    dom.btnSettings = document.getElementById('btnSettings');

    dom.toolList = document.getElementById('toolList');
    dom.toolSearch = document.getElementById('toolSearch');
    dom.toolListEmpty = document.getElementById('toolListEmpty');
    dom.iconToolBase64 = document.getElementById('iconToolBase64');
    dom.iconToolUrl = document.getElementById('iconToolUrl');
    dom.iconToolHex = document.getElementById('iconToolHex');
    dom.iconToolJwt = document.getElementById('iconToolJwt');
    dom.iconToolJson = document.getElementById('iconToolJson');
    dom.iconToolReplicate = document.getElementById('iconToolReplicate');
    dom.iconToolRegex = document.getElementById('iconToolRegex');

    dom.toolBodies = {
      base64: document.getElementById('toolBase64'),
      url: document.getElementById('toolUrl'),
      hex: document.getElementById('toolHex'),
      jwt: document.getElementById('toolJwt'),
      json: document.getElementById('toolJson'),
      replicate: document.getElementById('toolReplicate'),
      regex: document.getElementById('toolRegex')
    };

    dom.base64Plain = document.getElementById('base64Plain');
    dom.base64Encoded = document.getElementById('base64Encoded');
    dom.base64PlainError = document.getElementById('base64PlainError');
    dom.base64EncodedError = document.getElementById('base64EncodedError');

    dom.urlPlain = document.getElementById('urlPlain');
    dom.urlEncoded = document.getElementById('urlEncoded');
    dom.urlPlainError = document.getElementById('urlPlainError');
    dom.urlEncodedError = document.getElementById('urlEncodedError');

    dom.hexPlain = document.getElementById('hexPlain');
    dom.hexEncoded = document.getElementById('hexEncoded');
    dom.hexPlainError = document.getElementById('hexPlainError');
    dom.hexEncodedError = document.getElementById('hexEncodedError');

    dom.jwtInput = document.getElementById('jwtInput');
    dom.jwtError = document.getElementById('jwtError');
    dom.jwtHeader = document.getElementById('jwtHeader');
    dom.jwtPayload = document.getElementById('jwtPayload');
    dom.jwtSignature = document.getElementById('jwtSignature');

    dom.jsonInput = document.getElementById('jsonInput');
    dom.jsonInputError = document.getElementById('jsonInputError');
    dom.jsonOutput = document.getElementById('jsonOutput');
    dom.jsonStatusBadge = document.getElementById('jsonStatusBadge');
    dom.btnJsonMinify = document.getElementById('btnJsonMinify');
    dom.btnJsonBeautify = document.getElementById('btnJsonBeautify');
    dom.iconJsonMinify = document.getElementById('iconJsonMinify');
    dom.iconJsonBeautify = document.getElementById('iconJsonBeautify');

    dom.replicateData = document.getElementById('replicateData');
    dom.replicateTemplate = document.getElementById('replicateTemplate');
    dom.replicateOutput = document.getElementById('replicateOutput');
    dom.btnReplicateGenerate = document.getElementById('btnReplicateGenerate');
    dom.iconReplicateGenerate = document.getElementById('iconReplicateGenerate');

    dom.regexPatternInput = document.getElementById('regexPatternInput');
    dom.regexFlagsDisplay = document.getElementById('regexFlagsDisplay');
    dom.regexFlagChipRow = document.getElementById('regexFlagChipRow');
    dom.regexPatternError = document.getElementById('regexPatternError');
    dom.regexTestInput = document.getElementById('regexTestInput');
    dom.matchCountBadge = document.getElementById('matchCountBadge');
    dom.highlightPreview = document.getElementById('highlightPreview');
    dom.regexReplaceInput = document.getElementById('regexReplaceInput');
    dom.replaceResultWrap = document.getElementById('replaceResultWrap');
    dom.replaceResult = document.getElementById('replaceResult');
    dom.btnPatternPicker = document.getElementById('btnPatternPicker');
    dom.patternPickerMenu = document.getElementById('patternPickerMenu');
  }

  function initStaticIcons() {
    dom.btnSettings.innerHTML = ICONS.settings;
    dom.iconToolBase64.innerHTML = ICONS.layers;
    dom.iconToolUrl.innerHTML = ICONS.globe;
    dom.iconToolHex.innerHTML = ICONS.grid;
    dom.iconToolJwt.innerHTML = ICONS.key;
    dom.iconToolJson.innerHTML = ICONS.braces;
    dom.iconToolReplicate.innerHTML = ICONS.repeatAlt;
    dom.iconToolRegex.innerHTML = ICONS.search;
    dom.iconJsonMinify.innerHTML = ICONS.minimize;
    dom.iconJsonBeautify.innerHTML = ICONS.maximize;
    dom.iconReplicateGenerate.innerHTML = ICONS.play;
    dom.btnPatternPicker.innerHTML = ICONS.list;
    document.querySelectorAll('.copy-inline-btn[data-copy]').forEach(function (btn) {
      btn.innerHTML = ICONS.copy;
    });
  }

  function bindGlobalEvents() {
    dom.btnSettings.addEventListener('click', openSettingsModal);

    dom.toolList.querySelectorAll('.tool-item').forEach(function (li) {
      li.addEventListener('click', function () {
        setActiveTool(li.getAttribute('data-tool'));
      });
    });

    dom.toolSearch.addEventListener('input', filterTools);

    document.querySelectorAll('.copy-inline-btn[data-copy]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var target = document.getElementById(btn.getAttribute('data-copy'));
        if (!target) return;
        var text = 'value' in target ? target.value : target.textContent;
        if (!text) return;
        copyText(text, btn);
      });
    });

    document.querySelectorAll('[data-clear-tool]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        clearTool(btn.getAttribute('data-clear-tool'));
      });
    });
  }

  function clearTool(tool) {
    switch (tool) {
      case 'base64':
        dom.base64Plain.value = '';
        dom.base64Encoded.value = '';
        hideError(dom.base64PlainError);
        hideError(dom.base64EncodedError);
        dom.base64Plain.focus();
        break;
      case 'url':
        dom.urlPlain.value = '';
        dom.urlEncoded.value = '';
        hideError(dom.urlPlainError);
        hideError(dom.urlEncodedError);
        dom.urlPlain.focus();
        break;
      case 'hex':
        dom.hexPlain.value = '';
        dom.hexEncoded.value = '';
        hideError(dom.hexPlainError);
        hideError(dom.hexEncodedError);
        dom.hexPlain.focus();
        break;
      case 'jwt':
        dom.jwtInput.value = '';
        renderJwt();
        dom.jwtInput.focus();
        break;
      case 'json':
        dom.jsonInput.value = '';
        renderJson();
        dom.jsonInput.focus();
        break;
      case 'replicate':
        dom.replicateData.value = '';
        dom.replicateTemplate.value = '';
        dom.replicateOutput.value = '';
        dom.replicateData.focus();
        break;
      case 'regex':
        dom.regexPatternInput.value = '';
        dom.regexTestInput.value = '';
        dom.regexReplaceInput.value = '';
        setFlags('g');
        runMatch();
        dom.regexPatternInput.focus();
        break;
    }
  }

  function toBase64(str) {
    var bytes = new TextEncoder().encode(str);
    var bin = '';
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }

  function fromBase64(b64) {
    if (b64.trim() === '') return '';
    var bin = atob(b64.trim());
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  }

  function toUrlEncoded(str) {
    return encodeURIComponent(str);
  }

  function fromUrlEncoded(str) {
    return decodeURIComponent(str);
  }

  function toHex(str) {
    var bytes = new TextEncoder().encode(str);
    var out = '';
    for (var i = 0; i < bytes.length; i++) out += bytes[i].toString(16).padStart(2, '0');
    return out;
  }

  function fromHex(hex) {
    var cleaned = hex.replace(/\s+/g, '');
    if (cleaned === '') return '';
    if (cleaned.length % 2 !== 0) throw new Error('Hex must have an even number of characters.');
    if (!/^[0-9a-fA-F]+$/.test(cleaned)) throw new Error('Hex contains characters other than 0-9 and a-f.');
    var bytes = new Uint8Array(cleaned.length / 2);
    for (var i = 0; i < bytes.length; i++) bytes[i] = parseInt(cleaned.substr(i * 2, 2), 16);
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  }

  function base64UrlDecode(str) {
    var b64 = str.replace(/-/g, '+').replace(/_/g, '/');
    var pad = b64.length % 4;
    if (pad === 2) b64 += '==';
    else if (pad === 3) b64 += '=';
    else if (pad !== 0) throw new Error('Malformed base64url segment.');
    var bin = atob(b64);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  }

  function decodeJwt(token) {
    var parts = token.trim().split('.');
    if (parts.length !== 3) throw new Error('A JWT has 3 dot-separated parts (header.payload.signature).');
    var header = JSON.parse(base64UrlDecode(parts[0]));
    var payload = JSON.parse(base64UrlDecode(parts[1]));
    return { header: header, payload: payload, signature: parts[2] };
  }

  function wireCodecPair(plainEl, encodedEl, plainErrorEl, encodedErrorEl, encode, decode) {
    plainEl.addEventListener('input', function () {
      try {
        encodedEl.value = encode(plainEl.value);
        hideError(plainErrorEl);
      } catch (e) {
        showError(plainErrorEl, e.message);
      }
    });
    encodedEl.addEventListener('input', function () {
      try {
        plainEl.value = decode(encodedEl.value);
        hideError(encodedErrorEl);
      } catch (e) {
        showError(encodedErrorEl, e.message);
      }
    });
  }

  function renderJwt() {
    var token = dom.jwtInput.value;
    if (token.trim() === '') {
      dom.jwtHeader.textContent = '';
      dom.jwtPayload.textContent = '';
      dom.jwtSignature.textContent = '';
      hideError(dom.jwtError);
      return;
    }
    try {
      var decoded = decodeJwt(token);
      dom.jwtHeader.textContent = JSON.stringify(decoded.header, null, 2);
      dom.jwtPayload.textContent = JSON.stringify(decoded.payload, null, 2);
      dom.jwtSignature.textContent = decoded.signature;
      hideError(dom.jwtError);
    } catch (e) {
      dom.jwtHeader.textContent = '';
      dom.jwtPayload.textContent = '';
      dom.jwtSignature.textContent = '';
      showError(dom.jwtError, e.message);
    }
  }

  function renderJson() {
    var raw = dom.jsonInput.value;

    if (raw.trim() === '') {
      dom.jsonOutput.value = '';
      hideError(dom.jsonInputError);
      setJsonStatus(null);
      return;
    }

    try {
      var parsed = JSON.parse(raw);
      dom.jsonOutput.value = state.jsonMode === 'minify'
        ? JSON.stringify(parsed)
        : JSON.stringify(parsed, null, 2);
      hideError(dom.jsonInputError);
      setJsonStatus('valid');
    } catch (e) {
      dom.jsonOutput.value = '';
      showError(dom.jsonInputError, e.message);
      setJsonStatus('invalid');
    }
  }

  function setJsonStatus(status) {
    if (!status) {
      dom.jsonStatusBadge.hidden = true;
      dom.jsonStatusBadge.textContent = '';
      dom.jsonStatusBadge.className = 'status-badge';
      return;
    }
    dom.jsonStatusBadge.hidden = false;
    dom.jsonStatusBadge.textContent = status === 'valid' ? 'Valid' : 'Invalid';
    dom.jsonStatusBadge.className = 'status-badge status-' + status;
  }

  function setJsonMode(mode) {
    state.jsonMode = mode;
    saveJsonMode(mode);
    updateJsonModeButtons();
    renderJson();
  }

  function updateJsonModeButtons() {
    dom.btnJsonMinify.classList.toggle('active', state.jsonMode === 'minify');
    dom.btnJsonBeautify.classList.toggle('active', state.jsonMode === 'beautify');
  }

  function loadJsonMode() {
    try {
      var saved = localStorage.getItem(JSON_MODE_KEY);
      return saved === 'minify' || saved === 'beautify' ? saved : 'beautify';
    } catch (e) {
      return 'beautify';
    }
  }

  function saveJsonMode(mode) {
    try { localStorage.setItem(JSON_MODE_KEY, mode); } catch (e) {}
  }

  function flashError(el) {
    el.classList.remove('flash-error');
    void el.offsetWidth;
    el.classList.add('flash-error');
  }

  function generateReplicateOutput() {
    var dataValue = dom.replicateData.value;
    var templateValue = dom.replicateTemplate.value;
    if (dataValue.trim() === '' || templateValue.trim() === '') {
      if (dataValue.trim() === '') flashError(dom.replicateData);
      if (templateValue.trim() === '') flashError(dom.replicateTemplate);
      return '';
    }
    var output = '';
    dataValue.trim().split('\n').forEach(function (line) {
      var rendered = templateValue;
      var i = 1;
      line.split(',').forEach(function (word) {
        rendered = rendered.replaceAll('${' + i + '}', word);
        i++;
      });
      output += rendered + '\n';
    });
    return output;
  }

  function renderFlagChips() {
    dom.regexFlagChipRow.innerHTML = FLAG_INFO.map(function (f) {
      return '<button type="button" class="flag-chip' + (state.regexFlags[f.id] ? ' active' : '') + '" data-flag="' + f.id + '" title="' + escapeHtml(f.title) + '">' + f.id + '</button>';
    }).join('');

    dom.regexFlagChipRow.querySelectorAll('[data-flag]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-flag');
        state.regexFlags[id] = !state.regexFlags[id];
        btn.classList.toggle('active', state.regexFlags[id]);
        runMatch();
      });
    });
  }

  function collectFlagsString() {
    return FLAG_INFO.filter(function (f) { return state.regexFlags[f.id]; }).map(function (f) { return f.id; }).join('');
  }

  function setFlags(flagsStr) {
    FLAG_INFO.forEach(function (f) { state.regexFlags[f.id] = flagsStr.indexOf(f.id) !== -1; });
    renderFlagChips();
  }

  function scheduleMatch() {
    clearTimeout(regexMatchTimer);
    regexMatchTimer = setTimeout(runMatch, 150);
  }

  function runMatch() {
    var patternStr = dom.regexPatternInput.value;
    var flagsStr = collectFlagsString();
    var testStr = dom.regexTestInput.value;

    dom.regexFlagsDisplay.textContent = flagsStr;

    if (!patternStr) {
      hideError(dom.regexPatternError);
      renderHighlighted(testStr, []);
      renderReplacement(null, testStr);
      return;
    }

    var re;
    try {
      re = new RegExp(patternStr, flagsStr);
    } catch (e) {
      showError(dom.regexPatternError, e.message);
      renderHighlighted(testStr, []);
      renderReplacement(null, testStr);
      return;
    }

    hideError(dom.regexPatternError);

    var matches = [];
    if (flagsStr.indexOf('g') !== -1) {
      var m, guard = 0;
      while ((m = re.exec(testStr)) !== null && guard < 5000) {
        matches.push(m);
        if (m[0] === '') re.lastIndex++;
        guard++;
      }
    } else {
      var single = re.exec(testStr);
      if (single) matches.push(single);
    }

    renderHighlighted(testStr, matches);
    renderReplacement(new RegExp(patternStr, flagsStr), testStr);
  }

  function renderHighlighted(testStr, matches) {
    dom.matchCountBadge.textContent = matches.length + (matches.length === 1 ? ' match' : ' matches');
    dom.matchCountBadge.classList.toggle('is-zero', matches.length === 0);

    if (!testStr) { dom.highlightPreview.innerHTML = ''; return; }
    if (!matches.length) { dom.highlightPreview.innerHTML = escapeHtml(testStr); return; }

    var html = '';
    var cursor = 0;
    matches.forEach(function (m) {
      var start = m.index;
      var end = start + m[0].length;
      if (start < cursor) return;
      html += escapeHtml(testStr.slice(cursor, start));
      html += '<mark class="regex-mark">' + escapeHtml(m[0]) + '</mark>';
      cursor = end;
    });
    html += escapeHtml(testStr.slice(cursor));
    dom.highlightPreview.innerHTML = html;
  }

  function renderReplacement(re, testStr) {
    var replacement = dom.regexReplaceInput.value;
    if (!re || !replacement) {
      dom.replaceResultWrap.hidden = true;
      dom.replaceResult.textContent = '';
      return;
    }
    var result;
    try {
      result = testStr.replace(re, replacement);
    } catch (e) {
      result = 'Error: ' + e.message;
    }
    dom.replaceResult.textContent = result;
    dom.replaceResultWrap.hidden = false;
  }

  function renderPatternPickerMenu() {
    dom.patternPickerMenu.innerHTML = SAMPLE_PATTERNS.map(function (p, i) {
      return '<button type="button" class="pattern-picker-item" data-pattern-index="' + i + '" role="menuitem">' +
        '<span class="pattern-picker-item-name">' + escapeHtml(p.name) + '</span>' +
        '<span class="pattern-picker-item-pattern">/' + escapeHtml(p.pattern) + '/' + escapeHtml(p.flags) + '</span>' +
        '</button>';
    }).join('');

    dom.patternPickerMenu.querySelectorAll('[data-pattern-index]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var p = SAMPLE_PATTERNS[Number(btn.getAttribute('data-pattern-index'))];
        dom.regexPatternInput.value = p.pattern;
        setFlags(p.flags);
        runMatch();
        closePatternPicker();
        dom.regexPatternInput.focus();
      });
    });
  }

  function togglePatternPicker() {
    if (dom.patternPickerMenu.hidden) openPatternPicker();
    else closePatternPicker();
  }

  function openPatternPicker() {
    dom.patternPickerMenu.hidden = false;
    dom.btnPatternPicker.setAttribute('aria-expanded', 'true');
  }

  function closePatternPicker() {
    dom.patternPickerMenu.hidden = true;
    dom.btnPatternPicker.setAttribute('aria-expanded', 'false');
  }

  function showError(el, message) {
    el.textContent = message;
    el.hidden = false;
  }

  function hideError(el) {
    el.hidden = true;
  }

  function filterTools() {
    var query = dom.toolSearch.value.trim().toLowerCase();
    var visibleCount = 0;
    dom.toolList.querySelectorAll('.tool-item').forEach(function (li) {
      var name = li.querySelector('.tool-item-name').textContent.toLowerCase();
      var desc = li.querySelector('.tool-item-desc').textContent.toLowerCase();
      var matches = !query || name.indexOf(query) !== -1 || desc.indexOf(query) !== -1;
      li.hidden = !matches;
      if (matches) visibleCount++;
    });
    dom.toolListEmpty.hidden = visibleCount !== 0;
  }

  function setActiveTool(tool) {
    if (TOOLS.indexOf(tool) === -1) tool = 'base64';
    state.activeTool = tool;
    saveActiveTool(tool);

    dom.toolList.querySelectorAll('.tool-item').forEach(function (li) {
      li.classList.toggle('active', li.getAttribute('data-tool') === tool);
    });
    TOOLS.forEach(function (t) {
      dom.toolBodies[t].hidden = t !== tool;
    });
  }

  function loadActiveTool() {
    try {
      var saved = localStorage.getItem(ACTIVE_TOOL_KEY);
      return TOOLS.indexOf(saved) !== -1 ? saved : 'base64';
    } catch (e) {
      return 'base64';
    }
  }

  function saveActiveTool(tool) {
    try { localStorage.setItem(ACTIVE_TOOL_KEY, tool); } catch (e) {}
  }

  function copyText(text, btn) {
    function showCopied() {
      btn.classList.add('copied');
      var original = btn.innerHTML;
      btn.innerHTML = ICONS.check;
      setTimeout(function () { btn.classList.remove('copied'); btn.innerHTML = original; }, 1500);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(showCopied, function () { fallbackCopy(text, showCopied); });
    } else {
      fallbackCopy(text, showCopied);
    }
  }

  function fallbackCopy(text, done) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
    done();
  }

  var modalApi = Buddy.modal.init();
  var openModal = modalApi.open;
  var closeModal = modalApi.close;

  function openSettingsModal() {
    Buddy.settings.open(APP_KEY, openModal, closeModal, { appVersion: APP_VERSION });
  }
})();
