// 기사 폴더 공통 설정: 기사 화면 모양, 주소, 공유 미리보기 사진
export default {
  layout: "article.njk",
  // 공개가 꺼진 기사는 페이지를 만들지 않습니다
  permalink: (data) => (data.published === false ? false : `/playsteam/${data.page.fileSlug}/`),
  eleventyComputed: {
    ogImage: (data) => {
      const p = data.block && data.block.photos && data.block.photos[0];
      return (p && p.src) || "/assets/img/og.jpg";
    },
  },
};
