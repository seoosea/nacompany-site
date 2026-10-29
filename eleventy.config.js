// 나컴퍼니 사이트 빌드 설정
// src 폴더의 내용을 읽어 _site 폴더에 완성된 웹페이지를 만듭니다.

const slugIssue = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9가-힣.-]/g, "")
    .replace(/\./g, "-");

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/admin");
  eleventyConfig.ignores.add("src/admin/**");
  eleventyConfig.addPassthroughCopy({ "src/static": "/" });

  const isPublic = (a) => a.data.published !== false;

  // 공개된 기사 전체 (철학 기사 포함), 최신순
  eleventyConfig.addCollection("articles", (api) =>
    api
      .getFilteredByGlob("src/playsteam/articles/*.md")
      .filter(isPublic)
      .sort((a, b) => b.date - a.date)
  );

  // 호 목록: [{ issue, slug, items }], 최신 호가 앞
  eleventyConfig.addCollection("issues", (api) => {
    const map = new Map();
    api
      .getFilteredByGlob("src/playsteam/articles/*.md")
      .filter(isPublic)
      .filter((a) => a.data.issue)
      .sort((a, b) => b.date - a.date)
      .forEach((a) => {
        const k = a.data.issue;
        if (!map.has(k)) map.set(k, []);
        map.get(k).push(a);
      });
    return [...map.entries()]
      .map(([issue, items]) => ({ issue, slug: slugIssue(issue), items, date: items[0].date }))
      .sort((a, b) => String(b.issue).localeCompare(String(a.issue), "ko"));
  });

  eleventyConfig.addFilter("issueSlug", slugIssue);

  // 첫 화면 순서: 회사 소식(기관 교육·연수 등)이 위, 학원·대회 소식이 아래. 각 묶음 안에서는 최신순
  const COMPANY = ["회사 소개", "기관 교육", "교사 연수", "교육청", "행사 운영", "진로", "교육 기술"];
  const isCompany = (a) =>
    a.data.group ? a.data.group === "company" : a.data.kind === "about" || COMPANY.includes(a.data.category);
  eleventyConfig.addFilter("companyFirst", (items) => {
    const list = items || [];
    return [...list.filter(isCompany), ...list.filter((a) => !isCompany(a))];
  });
  eleventyConfig.addFilter("companyCount", (items) => (items || []).filter(isCompany).length);
  eleventyConfig.addFilter("without", (items, x) => (items || []).filter((a) => !x || a.url !== x.url));

  // 지금 1면에 올라갈 기사 (고정 켜짐 + 기간이 안 지남). 여러 개면 가장 최근 것.
  eleventyConfig.addFilter("currentPin", (items) => {
    const today = new Date().toISOString().slice(0, 10);
    return (items || []).find(
      (a) => a.data.pin && (!a.data.pin_until || new Date(a.data.pin_until).toISOString().slice(0, 10) >= today)
    );
  });

  eleventyConfig.addFilter("aboutArticle", (items) => (items || []).find((a) => a.data.kind === "about"));

  // 카드 사진 비율. 지정하지 않으면 순서대로 돌아가며 정해서 벽돌이 자연스럽게 섞이게 함
  const ratios = { tall: "4/5", portrait: "3/4", square: "1/1", wide: "4/3", panorama: "16/10" };
  const cycle = ["4/5", "4/3", "1/1", "3/4", "16/10", "4/3"];
  eleventyConfig.addFilter("cardRatio", (a, i) => ratios[a.data.card] || cycle[(i || 0) % cycle.length]);
  eleventyConfig.addFilter("ratioHeight", (r) => {
    const [w, h] = String(r).split("/").map(Number);
    return (h / w + 0.55).toFixed(2);
  });

  eleventyConfig.addFilter("paragraphs", (text) => {
    if (!text) return "";
    const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return String(text)
      .trim()
      .split(/\n\s*\n/)
      .map((p) => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`)
      .join("\n");
  });
  eleventyConfig.addFilter("excerpt", (text, n = 60) => {
    const s = String(text || "").replace(/\s+/g, " ").trim();
    return s.length > n ? s.slice(0, n) + "…" : s;
  });
  eleventyConfig.addFilter("head", (arr, n) => (arr || []).slice(0, n));
  eleventyConfig.addFilter("isoDate", (d) => new Date(d).toISOString().slice(0, 10));
  eleventyConfig.addFilter("dotDate", (d) => new Date(d).toISOString().slice(0, 10).replace(/-/g, "."));
  eleventyConfig.addFilter("mmdd", (d) => new Date(d).toISOString().slice(5, 10).replace("-", "."));
  eleventyConfig.addFilter("firstPhoto", (block) => {
    if (!block || !block.photos || !block.photos.length) return "";
    return block.photos[0].src || "";
  });
  eleventyConfig.addFilter("firstFocus", (block) =>
    block && block.photos && block.photos[0] ? block.photos[0].focus || "center" : "center"
  );

  // 회사 소개: 철학 글을 '첫 문장 / 나머지 / 세 가지 힘(○○ — 설명) / 맺는 말'로 나누기
  const phil = (t) => {
    const ps = String(t || "").trim().split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
    const isPower = (p) => /^.{1,12}\s[—–-]\s/.test(p);
    const first = ps.find((p) => !isPower(p)) || "";
    const m = first.match(/^(.+?[.?!])\s+(.+)$/s);
    return {
      lead: m ? m[1] : first,
      leadRest: m ? m[2] : "",
      powers: ps.filter(isPower).map((p) => { const [k, ...v] = p.split(/\s[—–-]\s/); return { k, v: v.join(" — ") }; }),
      close: ps.filter((p) => p !== first && !isPower(p)),
    };
  };
  eleventyConfig.addFilter("phil", phil);

  // 변화 읽기: '첫 화면에 고정'을 켠 소식이 먼저, 나머지는 날짜 최신순. 모두 n개까지
  eleventyConfig.addFilter("latestTrends", (items, n = 2) => {
    const byDate = (a, b) => String(b.date).localeCompare(String(a.date));
    const list = [...(items || [])];
    const pinned = list.filter((t) => t.pin).sort(byDate);
    const rest = list.filter((t) => !t.pin).sort(byDate);
    return [...pinned, ...rest].slice(0, Number(n) || 2);
  });

  // 첫 화면: Editor's Pick은 가장 최근 것 하나만
  eleventyConfig.addFilter("latestPickOnly", (items) => {
    let seen = false;
    return (items || []).filter((a) => {
      if (a.data.corner !== "Editor's Pick") return true;
      if (seen) return false;
      seen = true;
      return true;
    });
  });

  // 소식지 호 페이지: 코너별로 나누기
  const CORNERS = ["Editor's Pick", "Special Class", "What's New", "Update"];
  eleventyConfig.addFilter("byCorner", (items, c) => (items || []).filter((a) => a.data.corner === c));
  eleventyConfig.addFilter("otherCorners", (items) => (items || []).filter((a) => !CORNERS.includes(a.data.corner)));
  // 큰 사진 기사(없으면 사진 있는 첫 기사)를 맨 앞으로
  eleventyConfig.addFilter("featureFirst", (items) => {
    const list = [...(items || [])];
    const hasPic = (a) => a.data.block && a.data.block.photos && a.data.block.photos.length;
    // 사진 있는 '큰 사진' 기사 중 본문이 가장 긴 것(수상 목록이 많은 기사)
    const len = (a) => String(a.data.block.body || "").length + (a.data.block.type === "big" ? 1e5 : 0);
    let i = -1;
    list.forEach((a, k) => { if (hasPic(a) && (i < 0 || len(a) > len(list[i]))) i = k; });
    if (i > 0) list.unshift(list.splice(i, 1)[0]);
    return list;
  });
  // 본문 첫 문단 / 나머지 줄(수상 목록 등)
  const paras = (t) => String(t || "").trim().split(/\n\s*\n/);
  eleventyConfig.addFilter("bodyLead", (t) => paras(t)[0] || "");
  eleventyConfig.addFilter("bodyLines", (t) =>
    paras(t).slice(1).join("\n").split("\n").map((s) => s.trim()).filter(Boolean)
  );

  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
