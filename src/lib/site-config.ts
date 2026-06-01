export const siteConfig = {
  name: "Hypervoid",
  title: "Hypervoid · Charon 的博客",
  description: "分享技术、记录生活、收集兴趣。Charon 的个人博客。",
  url: "https://hypervoid.top",
  launchedAt: "2026-05-23",
  bangumiUserId: "1189551",
  locale: "zh_CN",
  author: {
    name: "Charon",
    handle: "HyperCharon",
    bio: "The world is big, you have to go and see.",
    avatar: "/avatar.jpg",
    githubUsername: "HyperCharon",
    githubUrl: "https://github.com/HyperCharon",
  },
  socials: [
    { name: "GitHub", url: "https://github.com/HyperCharon", icon: "github" as const },
    { name: "Bilibili", url: "https://space.bilibili.com/405927049", icon: "bilibili" as const },
    { name: "Gitee", url: "https://gitee.com/charon0415", icon: "gitee" as const },
    { name: "Codeberg", url: "https://codeberg.org/Charon0415", icon: "codeberg" as const },
    { name: "Steam", url: "https://steamcommunity.com/id/Charon0415/", icon: "steam" as const },
    { name: "TikTok", url: "https://www.douyin.com/search/Charon2005?type=user", icon: "douyin" as const },
    {
      name: "CSDN",
      url: "https://blog.csdn.net/HyperCharon",
      icon: "csdn" as const,
      // Only show in the nav drawer / pill nav — not in the ProfileCard
      // avatar block. Author explicitly asked to keep that area uncrowded.
      hideFromProfile: true,
    },
  ],
  rss: {
    title: "Hypervoid",
    description: "Charon 的个人博客文章订阅",
  },
  /**
   * ACG 轮播壁纸路径。把图片放到 public/wallpapers/ 下，把对应路径列在这里。
  /** 赞赏 / 打赏渠道。enabled 控制是否在站点显示入口与 /donate 页面（false 时整体藏起来）。 */
  donate: {
    enabled: false,
    intro:
      "如果这里的内容帮到了你或让你会心一笑，赞赏一份咖啡是最直接的鼓励。完全自愿，文章本身永远免费。",
    qrcodes: [
      { name: "微信", image: "/donate/wechat.jpg" },
      { name: "支付宝", image: "/donate/alipay.jpg" },
    ],
    links: [
      // 取消注释并填上你自己的链接：
      // { name: "GitHub Sponsors", url: "https://github.com/sponsors/HyperCharon", icon: "github" },
      // { name: "爱发电", url: "https://afdian.net/a/HyperCharon", icon: "afdian" },
      // { name: "Buy Me a Coffee", url: "https://buymeacoffee.com/HyperCharon", icon: "coffee" },
    ] as { name: string; url: string; icon?: string }[],
  },
} as const;
