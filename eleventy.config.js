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

  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
