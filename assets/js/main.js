/* =========================================================
   Jupiter · Embedded Engineer — interactions
   无依赖，渐进增强：JS 失效时页面内容依然完整可读
   ========================================================= */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. 主题切换 ---------- */
  var themeBtn = doc.getElementById('themeToggle');

  function applyTheme(theme, persist) {
    root.dataset.theme = theme;
    if (themeBtn) {
      themeBtn.setAttribute('aria-pressed', theme === 'light' ? 'true' : 'false');
    }
    var meta = doc.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', theme === 'light' ? '#f6f8fa' : '#06090e');
    }
    if (persist) {
      try { localStorage.setItem('theme', theme); } catch (e) {}
    }
  }

  if (themeBtn) {
    applyTheme(root.dataset.theme || 'dark', false);
    themeBtn.addEventListener('click', function () {
      var next = root.dataset.theme === 'light' ? 'dark' : 'light';
      applyTheme(next, true);
    });
  }

  /* ---------- 2. 顶部导航：滚动状态 ---------- */
  var header = doc.getElementById('siteHeader');

  function onScroll() {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- 3. 移动端菜单 ---------- */
  var menuBtn = doc.getElementById('menuBtn');
  var nav = doc.getElementById('primaryNav');

  function closeMenu() {
    if (!nav || !menuBtn) return;
    nav.classList.remove('is-open');
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.setAttribute('aria-label', '打开菜单');
  }

  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuBtn.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
    });

    nav.addEventListener('click', function (event) {
      if (event.target.closest('a') || event.target.closest('[data-open-contact]')) closeMenu();
    });

    doc.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeMenu();
    });

    doc.addEventListener('click', function (event) {
      if (!nav.classList.contains('is-open')) return;
      if (nav.contains(event.target) || menuBtn.contains(event.target)) return;
      closeMenu();
    });
  }

  /* ---------- 4. 滚动显现 ---------- */
  var revealItems = [].slice.call(doc.querySelectorAll('.reveal'));

  if ('IntersectionObserver' in window && !prefersReduced) {
    // 同组元素错峰出现
    revealItems.forEach(function (el) {
      var siblings = el.parentElement
        ? [].filter.call(el.parentElement.children, function (child) {
            return child.classList && child.classList.contains('reveal');
          })
        : [];
      var index = siblings.indexOf(el);
      if (index > 0) el.style.setProperty('--d', Math.min(index * 80, 400) + 'ms');
    });

    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          revealObserver.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    );

    revealItems.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealItems.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- 5. 数据条数字滚动 ---------- */
  var counters = [].slice.call(doc.querySelectorAll('[data-count]'));

  function animateCount(el) {
    var target = parseFloat(el.dataset.count);
    var decimals = parseInt(el.dataset.decimals || '0', 10);
    if (isNaN(target)) return;

    if (prefersReduced) {
      el.textContent = target.toFixed(decimals);
      return;
    }

    var duration = 1300;
    var start = null;
    var settled = false;

    function settle() {
      if (settled) return;
      settled = true;
      el.textContent = target.toFixed(decimals);
    }

    function step(timestamp) {
      if (settled) return;
      if (start === null) start = timestamp;
      var progress = Math.min((timestamp - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = (target * eased).toFixed(decimals);
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        settle();
      }
    }

    el.textContent = (0).toFixed(decimals);
    requestAnimationFrame(step);
    // rAF 在后台标签页会被节流，兜底保证最终值正确
    setTimeout(settle, duration + 900);
  }

  if (counters.length) {
    if ('IntersectionObserver' in window) {
      var countObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            animateCount(entry.target);
            countObserver.unobserve(entry.target);
          });
        },
        { threshold: 0.5 }
      );
      counters.forEach(function (el) { countObserver.observe(el); });
    } else {
      counters.forEach(animateCount);
    }
  }

  /* ---------- 6. Hero 打字机 ---------- */
  var typedEl = doc.getElementById('typed');
  var phrases = [
    '工业控制固件',
    'FreeRTOS 调度与驱动',
    '低功耗无线节点',
    'CAN / Modbus 通信',
    'FOC 电机控制'
  ];

  if (typedEl) {
    if (prefersReduced) {
      typedEl.textContent = phrases[0];
    } else {
      var phraseIndex = 0;
      var charIndex = 0;
      var deleting = false;

      var tick = function () {
        var phrase = phrases[phraseIndex];
        if (!deleting) {
          charIndex++;
          typedEl.textContent = phrase.slice(0, charIndex);
          if (charIndex === phrase.length) {
            deleting = true;
            setTimeout(tick, 1900);
            return;
          }
          setTimeout(tick, 78);
        } else {
          charIndex--;
          typedEl.textContent = phrase.slice(0, charIndex);
          if (charIndex === 0) {
            deleting = false;
            phraseIndex = (phraseIndex + 1) % phrases.length;
            setTimeout(tick, 320);
            return;
          }
          setTimeout(tick, 34);
        }
      };
      setTimeout(tick, 600);
    }
  }

  /* ---------- 7. 启动日志逐行出现 ---------- */
  var bootlog = doc.querySelector('#bootlog code');

  if (bootlog) {
    var lines = bootlog.innerHTML.split('\n').filter(function (line) {
      return line.trim() !== '';
    });

    bootlog.innerHTML = lines
      .map(function (line, index) {
        return '<span class="t-line" style="animation-delay:' + index * 110 + 'ms">' + line + '</span>';
      })
      .join('');

    var terminal = bootlog.closest('.terminal');
    var startTerminal = function () {
      if (terminal) terminal.classList.add('js-typed');
    };

    if ('IntersectionObserver' in window) {
      var termObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            startTerminal();
            termObserver.disconnect();
          });
        },
        { threshold: 0.35 }
      );
      termObserver.observe(terminal || bootlog);
    } else {
      startTerminal();
    }
  }

  /* ---------- 8. 导航高亮 ---------- */
  var navLinks = [].slice.call(doc.querySelectorAll('.nav__link'));
  var sections = navLinks
    .map(function (link) {
      var id = link.getAttribute('href');
      return id && id.charAt(0) === '#' ? doc.querySelector(id) : null;
    })
    .filter(Boolean);

  if (sections.length && 'IntersectionObserver' in window) {
    var visible = {};

    var sectionObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          visible[entry.target.id] = entry.isIntersecting ? entry.intersectionRatio : 0;
        });

        var bestId = null;
        var bestRatio = 0;
        Object.keys(visible).forEach(function (id) {
          if (visible[id] > bestRatio) {
            bestRatio = visible[id];
            bestId = id;
          }
        });

        if (!bestId) return;
        navLinks.forEach(function (link) {
          link.classList.toggle('is-active', link.getAttribute('href') === '#' + bestId);
        });
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: [0, 0.25, 0.5, 1] }
    );

    sections.forEach(function (section) { sectionObserver.observe(section); });
  }

  /* ---------- 9. 复制到剪贴板 ---------- */
  var toast = doc.getElementById('toast');
  var toastTimer = null;

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove('is-show');
    }, 2400);
  }

  function fallbackCopy(text) {
    var area = doc.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.top = '-1000px';
    doc.body.appendChild(area);
    area.select();
    var ok = false;
    try { ok = doc.execCommand('copy'); } catch (e) {}
    doc.body.removeChild(area);
    return ok;
  }

  [].forEach.call(doc.querySelectorAll('[data-copy]'), function (btn) {
    btn.addEventListener('click', function () {
      var value = btn.getAttribute('data-copy');
      if (!value) return;
      var label = btn.getAttribute('data-copy-label') || '内容';
      var done = function () { showToast(label + '已复制：' + value); };
      var fail = function () { showToast('复制失败，' + label + '：' + value); };

      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(value).then(done, function () {
          fallbackCopy(value) ? done() : fail();
        });
      } else {
        fallbackCopy(value) ? done() : fail();
      }
    });
  });

  /* ---------- 10. 年份 ---------- */
  var yearEl = doc.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- 11. 电路板轻微视差 ---------- */
  var stage = doc.querySelector('.board-stage');
  var hero = doc.querySelector('.hero');

  if (stage && hero && !prefersReduced && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var raf = null;
    var targetX = 0;
    var targetY = 0;

    hero.addEventListener('pointermove', function (event) {
      var rect = hero.getBoundingClientRect();
      targetX = ((event.clientX - rect.left) / rect.width - 0.5) * 10;
      targetY = ((event.clientY - rect.top) / rect.height - 0.5) * 8;
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = null;
        stage.style.transform = 'translate3d(' + targetX.toFixed(2) + 'px,' + targetY.toFixed(2) + 'px,0)';
      });
    });

    hero.addEventListener('pointerleave', function () {
      stage.style.transform = 'translate3d(0,0,0)';
    });
  }

  /* ---------- 12. 联系面板（微信 / 邮件） ---------- */
  var contactModal = doc.getElementById('contactModal');
  var contactDialog = contactModal ? contactModal.querySelector('.contact-modal__dialog') : null;
  var contactOpeners = [].slice.call(doc.querySelectorAll('[data-open-contact]'));
  var contactLastFocus = null;
  var contactCloseTimer = null;

  function openContact() {
    if (!contactModal) return;
    contactLastFocus = doc.activeElement;
    if (contactCloseTimer) {
      clearTimeout(contactCloseTimer);
      contactCloseTimer = null;
    }
    contactModal.hidden = false;
    doc.body.classList.add('is-locked');

    var gutter = window.innerWidth - doc.documentElement.clientWidth;
    if (gutter > 0) doc.body.style.paddingRight = gutter + 'px';

    requestAnimationFrame(function () {
      contactModal.classList.add('is-open');
      if (contactDialog) contactDialog.focus({ preventScroll: true });
    });
  }

  function closeContact() {
    if (!contactModal || contactModal.hidden) return;
    contactModal.classList.remove('is-open');
    doc.body.classList.remove('is-locked');
    doc.body.style.paddingRight = '';
    contactCloseTimer = setTimeout(function () {
      contactModal.hidden = true;
    }, prefersReduced ? 0 : 240);
    if (contactLastFocus && contactLastFocus.focus) {
      contactLastFocus.focus({ preventScroll: true });
    }
  }

  contactOpeners.forEach(function (btn) {
    btn.addEventListener('click', openContact);
  });

  if (contactModal) {
    [].forEach.call(contactModal.querySelectorAll('[data-close-contact]'), function (el) {
      el.addEventListener('click', closeContact);
    });

    doc.addEventListener('keydown', function (event) {
      if (contactModal.hidden) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        closeContact();
        return;
      }
      if (event.key !== 'Tab' || !contactDialog) return;

      var focusables = [].filter.call(
        contactDialog.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'),
        function (el) { return el.offsetParent !== null; }
      );
      if (!focusables.length) return;

      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      if (event.shiftKey && doc.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && doc.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  var wechatApp = doc.getElementById('wechatApp');
  if (wechatApp) {
    wechatApp.addEventListener('click', function () {
      var mobile = /Android|iPhone|iPad|iPod|HarmonyOS|Mobile/i.test(navigator.userAgent);
      showToast(mobile ? '正在唤起微信…' : '已尝试唤起微信；没反应就用二维码或邮件');
    });
  }
})();
