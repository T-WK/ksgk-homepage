// Clean, refactored scripts.js — single DOMContentLoaded wrapper
document.addEventListener("DOMContentLoaded", function () {
  /*
    scripts.js 리팩토링 목표:
    1) 반복 DOM 접근/연산 최소화
    2) 중복 코드 함수화/모듈화
    3) 명확한 한글 주석으로 가독성 향상
  */

  // ----------------------------- 유틸리티 헬퍼 -----------------------------
  function createEl(tag, opts) {
    var el = document.createElement(tag);
    if (!opts) return el;
    if (opts.className) el.className = opts.className;
    if (opts.text) el.textContent = opts.text;
    if (opts.html) el.innerHTML = opts.html;
    if (opts.attrs) {
      Object.keys(opts.attrs).forEach(function (k) {
        el.setAttribute(k, opts.attrs[k]);
      });
    }
    return el;
  }

  function setText(el, txt) {
    if (!el) return;
    el.textContent = txt || "";
  }

  function attachVideoToggleTo(video) {
    if (!video) return;
    if (video._hasToggle) return;
    video._hasToggle = true;
    video.addEventListener("click", function () {
      if (video.paused) video.play();
      else video.pause();
    });
    video.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (video.paused) video.play();
        else video.pause();
      }
    });
  }

  // 모든 비디오 요소를 기본적으로 음소거로 설정합니다.
  function muteAllVideos() {
    var vids = Array.from(document.querySelectorAll("video"));
    vids.forEach(function (v) {
      try {
        v.muted = true;
        v.volume = 0;
      } catch (e) {}
    });
  }

  // DOM ready 직후 기존 페이지 내 비디오를 모두 음소거
  muteAllVideos();

  // ----------------------------- reveal 초기화 -----------------------------
  function initRevealTargets(rootSelectors) {
    var targets = Array.from(
      document.querySelectorAll(rootSelectors.join(","))
    );
    targets.forEach(function (el) {
      if (el.classList.contains("no-reveal") || el.classList.contains("reveal"))
        return;
      el.classList.add("reveal");
      if (el.children && el.children.length > 1) {
        el.classList.add("reveal--stagger");
        Array.from(el.children).forEach(function (child, idx) {
          if (!child.style.transitionDelay)
            child.style.transitionDelay = idx * 60 + "ms";
        });
      }
    });

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var el = entry.target;
          if (entry.isIntersecting) el.classList.add("reveal--visible");
          else el.classList.remove("reveal--visible");
        });
      },
      { root: null, rootMargin: "0px 0px -10% 0px", threshold: 0.12 }
    );
    targets.forEach(function (t) {
      io.observe(t);
    });
  }

  // ----------------------------- 하이라이트 비디오 로직 -----------------------------
  function setupHighlightAlternator() {
    var card = document.getElementById("highlight-card");
    if (!card) return;

    var videoContainer = card.querySelector(".hero-video-container");
    if (!videoContainer) return;

    var origPh = videoContainer.querySelector(".hero-video-placeholder");
    var defaultSrcs = origPh
      ? [origPh.dataset.src1, origPh.dataset.src2].filter(Boolean)
      : [];

    var cfg = window.__HIGHLIGHT_CONFIG || {};
    var srcs =
      Array.isArray(cfg.videoSrcs) && cfg.videoSrcs.length
        ? cfg.videoSrcs.slice()
        : defaultSrcs;
    if (!srcs || srcs.length === 0) return;

    var defaultTexts = [
      {
        title: "포장·패키징 하이라이트",
        sub: "박스 입고 → 키팅 → 완충재 적용까지, 브랜드 패키징 작업 흐름",
        list: [
          "웹·모바일 자동 재생(무음) 권장",
          "키팅·라벨링 작업의 세부 흐름",
          "브랜드별 패키징 옵션 시연",
        ],
      },
      {
        title: "자동화 라인 하이라이트",
        sub: "고속 피킹 → 컨베이어 → 상차까지 이어지는 자동화 흐름",
        list: [
          "고속 피킹 효율성 시연",
          "컨베이어 연동 포장 라인",
          "상차 전 최종 검사 과정",
        ],
      },
    ];
    var texts =
      Array.isArray(cfg.texts) && cfg.texts.length ? cfg.texts : defaultTexts;

    var frag = document.createDocumentFragment();
    var slides = [];
    srcs.forEach(function (s, i) {
      var ph = createEl("div", { className: "hero-video-placeholder" });
      ph.dataset.src = s;
      ph.style.position = "relative";
      // 초기 로드시 과도한 네트워크 사용을 막기 위해 preload를 none으로 설정하고
      // video.src는 할당하지 않습니다. 필요 시에만 src를 할당하여 로드합니다.
      var vid = createEl("video", {
        attrs: { muted: "", preload: "none", tabindex: 0 },
      });
      // 데이터 소스 보관
      vid.dataset.src = s;
      try {
        vid.muted = true;
        vid.volume = 0;
      } catch (e) {}
      vid.playsInline = true;
      ph.appendChild(vid);
      var cap = createEl("div", { className: "hero-video-caption" });
      ph.appendChild(cap);
      if (i !== 0) ph.style.display = "none";
      frag.appendChild(ph);
      slides.push(ph);
    });

    var existing = videoContainer.querySelector(".hero-video-placeholder");
    if (existing) existing.remove();
    var slidesWrapper = createEl("div", { className: "hero-video-slides" });
    slidesWrapper.appendChild(frag);
    videoContainer.appendChild(slidesWrapper);

    var titleEl = card.querySelector(".card-title");
    var subEl = card.querySelector(".card-sub");
    var listEl = card.querySelector(".list-check");
    var current = 0;

    function applyText(idx) {
      var t = texts[idx % texts.length] || { title: "", sub: "", list: [] };
      setText(titleEl, t.title);
      setText(subEl, t.sub);
      if (listEl)
        listEl.innerHTML = (t.list || [])
          .map(function (li) {
            return "<li>" + li + "</li>";
          })
          .join("");
      slides.forEach(function (s, si) {
        setText(
          s.querySelector(".hero-video-caption"),
          si === idx ? t.title : ""
        );
      });
    }

    function prefetchIndex(idx) {
      var index = idx % slides.length;
      var slide = slides[index];
      if (!slide) return;
      var v = slide.querySelector("video");
      if (!v) return;
      if (v.src) return;
      var doPrefetch = function () {
        try {
          v.src = v.dataset.src || slide.dataset.src;
          v.preload = "metadata";
          try {
            v.load();
          } catch (e) {}
        } catch (e) {}
      };
      if (window.requestIdleCallback) requestIdleCallback(doPrefetch);
      else setTimeout(doPrefetch, 200);
    }

    function unloadOthers(activeIdx) {
      slides.forEach(function (s, si) {
        var v = s.querySelector("video");
        if (!v) return;
        if (si === activeIdx || si === (activeIdx + 1) % slides.length) return;
        if (v.src) {
          try {
            v.pause();
            v.removeAttribute("src");
            v.load();
          } catch (e) {}
        }
      });
    }

    function showIndex(i) {
      var next = i % slides.length;
      slides.forEach(function (s, si) {
        var v = s.querySelector("video");
        if (si === next) {
          s.style.display = "block";
          try {
            if (!v.src) {
              v.src = v.dataset.src || s.dataset.src;
              v.preload = "metadata";
              try {
                v.load();
              } catch (e) {}
            }
            v.play().catch(function () {});
          } catch (e) {}
        } else {
          try {
            v.pause();
            v.currentTime = 0;
          } catch (e) {}
          s.style.display = "none";
        }
      });
      current = next;
      applyText(current);
      prefetchIndex(current + 1);
      unloadOthers(current);
    }

    slides.forEach(function (s) {
      var v = s.querySelector("video");
      v.addEventListener("ended", function () {
        showIndex(current + 1);
      });
      attachVideoToggleTo(v);
    });

    // 초기 인덱스: 현재만 로드하고 다음은 프리페치
    showIndex(0);
  }

  // ----------------------------- highlight.json 로드 및 검증 -----------------------------
  function validateHighlightConfig(cfg) {
    var errors = [];
    if (!cfg || typeof cfg !== "object") {
      errors.push("highlight.json: 최상위 값은 객체여야 합니다.");
      return { ok: false, errors: errors };
    }
    if ("videoSrcs" in cfg) {
      if (!Array.isArray(cfg.videoSrcs))
        errors.push("videoSrcs는 문자열 배열이어야 합니다.");
      else if (cfg.videoSrcs.length === 0)
        errors.push(
          "videoSrcs 배열이 비어있습니다. 최소 하나의 비디오 경로가 필요합니다."
        );
      else
        cfg.videoSrcs.forEach(function (v, i) {
          if (typeof v !== "string" || !v.trim())
            errors.push(
              "videoSrcs[" + i + "]는 비어있지 않은 문자열이어야 합니다."
            );
        });
    }
    if ("texts" in cfg) {
      if (!Array.isArray(cfg.texts))
        errors.push("texts는 객체 배열이어야 합니다.");
      else
        cfg.texts.forEach(function (t, i) {
          if (!t || typeof t !== "object") {
            errors.push("texts[" + i + "]는 객체여야 합니다.");
            return;
          }
          if (!("title" in t) || typeof t.title !== "string")
            errors.push("texts[" + i + "]의 title은 문자열이어야 합니다.");
          if ("list" in t) {
            if (!Array.isArray(t.list))
              errors.push(
                "texts[" + i + "]의 list는 문자열 배열이어야 합니다."
              );
            else
              t.list.forEach(function (li, j) {
                if (typeof li !== "string")
                  errors.push(
                    "texts[" + i + "].list[" + j + "]는 문자열이어야 합니다."
                  );
              });
          }
        });
    }
    return { ok: errors.length === 0, errors: errors };
  }

  (function loadHighlightConfigAndInit() {
    fetch("/highlight.json", { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error("no highlight.json");
        return res.json();
      })
      .then(function (cfg) {
        var result = validateHighlightConfig(cfg);
        if (!result.ok) {
          console.error(
            "highlight.json 스키마 오류:\n" + result.errors.join("\n")
          );
          var card = document.getElementById("highlight-card");
          if (card) {
            var existing = card.querySelector(".highlight-config-error");
            if (existing) existing.remove();
            var errEl = document.createElement("div");
            errEl.className = "highlight-config-error";
            errEl.style.color = "#ff6b6b";
            errEl.style.marginTop = "8px";
            errEl.textContent =
              "highlight.json 형식 오류: 콘솔에서 세부 오류를 확인하세요.";
            card.insertBefore(errEl, card.firstChild);
          }
          window.__HIGHLIGHT_CONFIG = null;
        } else {
          window.__HIGHLIGHT_CONFIG = cfg || {};
        }
      })
      .catch(function () {
        window.__HIGHLIGHT_CONFIG = null;
      })
      .finally(function () {
        // highlight.json 로드가 완료된 뒤 히어로 비디오(src 지연 로드)를 설정합니다.
        try {
          var mainHeroVid = document.querySelector(
            ".hero-visual .hero-video-placeholder video[data-src]"
          );
          if (mainHeroVid && !mainHeroVid.src) {
            var ds = mainHeroVid.dataset && mainHeroVid.dataset.src;
            if (ds) {
              mainHeroVid.src = ds;
              mainHeroVid.preload = "metadata";
              mainHeroVid.muted = true;
              try {
                mainHeroVid.play().catch(function () {});
              } catch (e) {}
            }
          }
        } catch (e) {}

        setupHighlightAlternator();
      });
  })();

  // ----------------------------- reveal 초기화 호출 -----------------------------
  var selectors = [
    "section",
    ".card",
    ".process-step",
    ".testimonial-card",
    ".hero-visual",
    ".hero-floating-card",
    ".section-header",
  ];
  initRevealTargets(selectors);

  // ----------------------------- EmailJS 폼 처리 -----------------------------
  // --- EmailJS form 전송 처리
  // 환경 값은 `env.js`에서 window.__ENV.EMAILJS_* 로 주입합니다.
  var EMAILJS_SERVICE_ID =
    (window.__ENV && window.__ENV.EMAILJS_SERVICE_ID) || "service_n1pfiu6";
  var EMAILJS_TEMPLATE_ID =
    (window.__ENV && window.__ENV.EMAILJS_TEMPLATE_ID) || "template_ckldggv";
  var EMAILJS_USER_ID =
    (window.__ENV && window.__ENV.EMAILJS_USER_ID) || "tIDnZsAnM8dXi4zBf";

  if (window.emailjs && EMAILJS_USER_ID) {
    try {
      emailjs.init(EMAILJS_USER_ID);
    } catch (e) {
      /* 이미 초기화된 경우 무시 */
    }
  }

  function collectCheckedLabels(container) {
    if (!container) return "";
    var boxes = Array.from(
      container.querySelectorAll('input[type="checkbox"]')
    );
    return boxes
      .filter(function (cb) {
        return cb.checked;
      })
      .map(function (cb) {
        var label = cb.closest("label");
        return label ? label.textContent.trim() : cb.value || "";
      })
      .join(", ");
  }

  function setupEmailJsForm() {
    var form = document.getElementById("contact-form");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;

      var company = (form.querySelector("#company") || {}).value || "";
      var manager = (form.querySelector("#name") || {}).value || "";
      var contact = (form.querySelector("#phone") || {}).value || "";
      var userEmail = (form.querySelector("#email") || {}).value || "";
      var monthlyOrders = (form.querySelector("#orders") || {}).value || "";
      var skuCount = (form.querySelector("#sku") || {}).value || "";
      var message = (form.querySelector("#message") || {}).value || "";

      // 판매 채널 및 상품 특성은 라벨 텍스트로 수집
      var channelGroup = Array.from(form.querySelectorAll(".form-group")).find(
        function (g) {
          return /판매 채널|판매채널|판매/.test(g.textContent);
        }
      );
      var channels = channelGroup
        ? collectCheckedLabels(channelGroup)
        : collectCheckedLabels(form);
      var traitGroup = Array.from(form.querySelectorAll(".form-group")).find(
        function (g) {
          return /상품 특성|상품특성/.test(g.textContent);
        }
      );
      var productTraits = traitGroup ? collectCheckedLabels(traitGroup) : "";

      var templateParams = {
        company_name: company,
        manager_name: manager,
        contact_number: contact,
        user_email: userEmail,
        channels: channels,
        monthly_orders: monthlyOrders,
        sku_count: skuCount,
        product_traits: productTraits,
        message: message,
      };

      if (!window.emailjs) {
        alert("EmailJS SDK가 로드되지 않았습니다. 네트워크 연결을 확인하세요.");
        if (submitBtn) submitBtn.disabled = false;
        return;
      }

      emailjs
        .send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams)
        .then(
          function (response) {
            // EmailJS는 성공 시 문자열 "OK"를 반환합니다. 이를 기준으로 성공 여부 판단.
            var ok = false;
            console.log("EmailJS response:", response);
            try {
              if (response.text === "OK" || response.status === 200) ok = true;
            } catch (e) {
              ok = false;
            }

            if (ok) {
              var hint = form.querySelector(".form-hint");
              if (hint)
                hint.textContent = "전송 완료 — 담당자가 연락드릴 예정입니다.";
              alert("전송 완료 — 담당자가 연락드릴 예정입니다.");
              form.reset();
            } else {
              alert(
                "전송 실패(응답): " +
                  (response && response.toString
                    ? response.toString()
                    : JSON.stringify(response))
              );
            }
            if (submitBtn) submitBtn.disabled = false;
          },
          function (err) {
            alert(
              "전송 실패: " + (err && err.text ? err.text : JSON.stringify(err))
            );
            if (submitBtn) submitBtn.disabled = false;
          }
        );
    });
  }

  setupEmailJsForm();
});
