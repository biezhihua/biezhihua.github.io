import { hopeTheme } from "vuepress-theme-hope";

import navbar from "./navbar.js";
import sidebar from "./sidebar.js";

export default hopeTheme({
  hostname: "https://github.com/biezhihua",

  author: {
    name: "别志华",
    url: "https://github.com/biezhihua",
  },

  logo: "/images/favicon-32x32.png",

  docsDir: "src",

  // navbar
  navbar,

  // sidebar
  sidebar,

  displayFooter: false,

  blog: {
    description: "",
    avatar: "/images/avatar.jpg",
    name: "别志华",
    medias: {
      GitHub: "https://github.com/biezhihua"
    },
  },

  metaLocales: {
    editLink: "Edit this page on GitHub",
  },

  // enable it to preview all changes in time
  // hotReload: true,

  plugins: {
      blog: {
        filter: page => {
          //  || page?.filePathRelative?.startsWith("learn-blogs") || page?.filePathRelative?.startsWith("public-articles") || false
          return page?.filePathRelative?.startsWith("public-articles");
        },
        excerptLength: 0,
      }
  },
});
