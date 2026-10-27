// 나컴퍼니 사이트 빌드 설정
// src 폴더의 내용을 읽어 _site 폴더에 완성된 웹페이지를 만듭니다.

export default function (eleventyConfig) {
  // 그대로 복사할 폴더
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/admin");
  eleventyConfig.ignores.add("src/admin/**");
  eleventyConfig.addPassthroughCopy({ "src/static": "/" });

  // 공개로 체크된 기사만, 최신순
  eleventyConfig.addCollection("articles", (api) =>
    api
      .getFilteredByGlob("src/playsteam/articles/*.md")
      .filter((a) => a.data.published !== false)
      .sort((a, b) => b.date - a.date)
  );

  // 호수별로 묶기: [{ issue: "2026 Vol.02", items: [...] }, ...]
  eleventyConfig.addFilter("groupByIssue", (items) => {
    const map = new Map();
    for (const it of items) {
      const key = it.data.issue || "기타";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(it);
    }
    return [...map.entries()].map(([issue, items]) => ({ issue, items }));
  });

  // 줄바꿈이 있는 글을 문단으로 바꾸기 (빈 줄 = 새 문단)
  eleventyConfig.addFilter("paragraphs", (text) => {
    if (!text) return "";
    const esc = (s) =>
      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return String(text)
      .trim()
      .split(/\n\s*\n/)
      .map((p) => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`)
      .join("\n");
  });

  // 글 앞부분만 잘라 요약으로 쓰기
  eleventyConfig.addFilter("excerpt", (text, n = 60) => {
    const s = String(text || "").replace(/\s+/g, " ").trim();
    return s.length > n ? s.slice(0, n) + "…" : s;
  });

  eleventyConfig.addFilter("head", (arr, n) => (arr || []).slice(0, n));

  eleventyConfig.addFilter("isoDate", (d) => new Date(d).toISOString().slice(0, 10));
  eleventyConfig.addFilter("krDate", (d) => {
    const x = new Date(d);
    return `${x.getFullYear()}. ${x.getMonth() + 1}. ${x.getDate()}.`;
  });

  // 기사의 첫 사진 (목록 카드·공유 미리보기용)
  eleventyConfig.addFilter("firstPhoto", (block) => {
    if (!block || !block.photos || !block.photos.length) return "";
    return block.photos[0].src || "";
  });

  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
