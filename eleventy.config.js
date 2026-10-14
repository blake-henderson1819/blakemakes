export default function (eleventyConfig) {
  // Everything in /public is copied as-is to the site root (/css, /images, ...)
  eleventyConfig.addPassthroughCopy({ public: "/" });

  // All Markdown files in src/projects/ become the "projects" collection, newest first
  eleventyConfig.addCollection("projects", (api) =>
    api.getFilteredByGlob("src/projects/*.md").sort((a, b) => b.date - a.date)
  );

  eleventyConfig.addFilter("isoDate", (d) => new Date(d).toISOString().slice(0, 10));
  eleventyConfig.addFilter("monthYear", (d) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" })
  );
  eleventyConfig.addFilter("pad", (n, w = 3) => String(n).padStart(w, "0"));

  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
