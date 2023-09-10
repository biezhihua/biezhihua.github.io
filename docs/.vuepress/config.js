import { defineUserConfig, defaultTheme } from 'vuepress'
import {
  navbar,
  sidebar
} from './configs/index.js'
import mathjax3 from 'markdown-it-mathjax3'
// .vuepress/config.js
import { hopeTheme } from "vuepress-theme-hope";


export default defineUserConfig({
  extendsMarkdown: md => {
    md.use(mathjax3);
  },
  base: '/',

  // https://v2.vuepress.vuejs.org/reference/config.html#lang
  lang: 'zh-CN',
  title: 'biezhihua的日常',
  description: ' ',

  // https://v2.vuepress.vuejs.org/guide/theme.html
  theme: hopeTheme({
    plugins: {
      blog: {
        filter: page => {
          return page?.filePathRelative?.startsWith("learn-android") ||
            page?.filePathRelative?.startsWith("learn-blogs") ||
            page?.filePathRelative?.startsWith("public-articles") ||
            false;
        },
        excerptLength: 0,
      }
    },
    blog: {
      description: "",
      avatar: "/images/avatar.jpg",
      roundAvatar: true,
      name: "别志华",
      medias: {
        GitHub: "https://github.com/biezhihua"
      },
    },
    hotReload: false,
    logo: '/images/favicon-32x32.png',
    navbar: navbar,
    sidebar: sidebar,
  })
})
