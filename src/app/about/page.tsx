import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "关于", description: "关于 Charon 和 Hypervoid — 一处用以长期沉淀技术、阅读、影像与生活痕迹的私人坐标。" };

export default function AboutPage() {
  return (
    <div className="mx-auto ">
      <header className="hv-panel relative mb-6 overflow-hidden p-5 sm:p-7">
        <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
        <div aria-hidden className="absolute left-0 top-0 h-8 w-8 border-l border-t border-accent/40" />
        <div aria-hidden className="absolute right-0 top-0 h-2 w-2 rounded-full bg-accent animate-pulse" />
        <p className="hv-kicker">About / System_Info</p>
        <h1 className="hv-title mt-2 text-3xl font-black uppercase tracking-tight sm:text-4xl">
          关于
        </h1>
      </header>

      <article className="prose prose-zinc dark:prose-invert hv-prose">
        <p className="lead">
          你好，我是 <strong>Charon</strong>。
        </p>

        <blockquote>
          <p>The world is big, you have to go and see.</p>
        </blockquote>

        <p>
          <strong>Hypervoid</strong> 由{" "}
          <em>hyper</em>（高维）+ <em>void</em>（虚空）合成而来——
          一处用以长期记录、积累、整理的私人空间。
          在这里把碎片化的想法、技术笔记、阅读与影像，慢慢沉淀下来。
        </p>

        <h2>这里写些什么</h2>
        <ul>
          <li>知识与经验：技术笔记、折腾过程、项目复盘</li>
          <li>资源分享：好用的工具、好玩的网站、值得收藏的东西</li>
          <li>游戏与番剧：攻略、追番记录、个人感想</li>
          <li>零散思考：日记、灵感、生活片段</li>
        </ul>

        <h2>现在在做什么</h2>
        <p>
          持续迭代博客系统——完善后台 CMS、主题引擎、AI 辅助写作，
          同时把跨浏览器兼容性、移动端体验和无障碍做到位。
          偶尔折腾看板娘和音乐播放器。
        </p>

        <h2>这个博客</h2>
        <ul>
          <li>用 Next.js 16 + React 19 + Tailwind v4 从零搭建，无模板</li>
          <li>文章存 Postgres（Neon），图片走 Vercel Blob</li>
          <li>评论由 GitHub Discussions（Giscus）承载</li>
          <li>AI 摘要 / Q&A 支持 DeepSeek、Claude 和自定义兼容端点</li>
          <li>部署在 Vercel · 域名 hypervoid.top</li>
          <li>
            源码：
            <a href="https://github.com/HyperCharon/hypervoid">
              HyperCharon/hypervoid
            </a>
            （MIT 协议）
          </li>
          <li>前一版（Astro）：charon0415.github.io（2023-07 起，已归档）</li>
        </ul>

        <h2>来聊聊</h2>
        <p>
          想交个朋友？欢迎来{" "}
          <Link href="/guestbook">留言板</Link> 留一句话，
          或者你也写博客的话来一发{" "}
          <Link href="/friends">友链申请</Link>。
          每篇文章底下也有评论区，对内容有任何想法都可以直接聊。
        </p>

        <h2>联系方式</h2>
        <ul>
          <li>
            GitHub:{" "}
            <a href="https://github.com/HyperCharon">@HyperCharon</a>
          </li>
          <li>
            Bilibili:{" "}
            <a href="https://space.bilibili.com/405927049">
              space.bilibili.com/405927049
            </a>
          </li>
          <li>
            Gitee:{" "}
            <a href="https://gitee.com/charon0415">gitee.com/charon0415</a>
          </li>
          <li>
            Codeberg:{" "}
            <a href="https://codeberg.org/Charon0415">codeberg.org/Charon0415</a>
          </li>
          <li>
            Steam:{" "}
            <a href="https://steamcommunity.com/id/Charon0415/">Charon0415</a>
          </li>
        </ul>

        <hr />

        <p className="text-sm">
          站内文章默认采用{" "}
          <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/">
            CC BY-NC-SA 4.0
          </a>{" "}
          协议；代码遵循仓库内 LICENSE。
        </p>
        <p className="text-sm italic">— One &amp; Only</p>
      </article>
    </div>
  );
}
