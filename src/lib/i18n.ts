export const LOCALES = ["zh-CN", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "zh-CN";

export const LOCALE_LABEL: Record<Locale, string> = {
  "zh-CN": "中",
  en: "EN",
};

export type Messages = {
  nav: {
    home: string;
    posts: string;
    tags: string;
    anime: string;
    games: string;
    books: string;
    movies: string;
    music: string;
    projects: string;
    skills: string;
    timeline: string;
    albums: string;
    diary: string;
    guestbook: string;
    friends: string;
    about: string;
    archive: string;
    groupCreate: string;
    groupLife: string;
    groupInteract: string;
    groupFeatured: string;
    groupLinks: string;
  };
  common: {
    search: string;
    searchPlaceholder: string;
    toggleTheme: string;
    themeDark: string;
    themeLight: string;
    themeCyberpunk: string;
    toggleLocale: string;
    readAll: string;
    backToPosts: string;
    backHome: string;
    loading: string;
    empty: string;
    subscribe: string;
    submit: string;
    submitting: string;
    cancel: string;
    delete: string;
    save: string;
    learnMore: string;
    anonymous: string;
    signIn: string;
    tableOfContents: string;
    copied: string;
    copyLink: string;
    shareX: string;
    shareWeibo: string;
  };
  post: {
    views: string;
    like: string;
    unlike: string;
    comments: string;
    summary: string;
    askAi: string;
    askAiHint: string;
    askAiPlaceholder: string;
    aiThinking: string;
    aiAnswer: string;
    featured: string;
    article: string;
    pinned: string;
    pinnedTooltip: string;
    read: string;
    readBadgeTitle: string;
    readingTimeSuffix: string;
  };
  home: {
    latest: string;
    seeAll: string;
    topicSeries: string;
    dailyPick: string;
    empty: string;
    rssHint: string;
  };
  hero: {
    systemOnline: string;
    subtitle: string;
    enterPosts: string;
    aboutMe: string;
    latestPost: string;
    quickNav: string;
    popularTags: string;
    allTags: string;
    stats: {
      articles: string;
      words: string;
      tags: string;
    };
  };
  stats: {
    siteStats: string;
    live: string;
    articles: string;
    articlesDesc: string;
    pageViews: string;
    pageViewsDesc: string;
    reactions: string;
    reactionsDesc: string;
    uptime: string;
    uptimeDesc: string;
    daysSuffix: string;
    carouselLabel: string;
    viewItem: string;
  };
  calendar: {
    dayHeaders: string[];
    posts: string;
  };
  widget: {
    notice: string;
    tagCloud: string;
    closeNotice: string;
  };
  time: {
    justNow: string;
    minutesAgo: string;
    hoursAgo: string;
    daysAgo: string;
  };
  tag: {
    articleCount: string;
  };
  posts: {
    kicker: string;
    allPosts: string;
    description: string;
    nodes: string;
    tags: string;
    empty: string;
  };
  archive: {
    kicker: string;
    yearSuffix: string;
    postsCount: string;
  };
  tags: {
    kicker: string;
    allTags: string;
    channels: string;
    empty: string;
  };
  series: {
    kicker: string;
    title: string;
    clusters: string;
    description: string;
    empty: string;
    openRoute: string;
  };
  friends: {
    kicker: string;
    description: string;
    empty: string;
  };
  guestbook: {
    kicker: string;
    description: string;
    loggedIn: string;
    signOut: string;
    loginPrompt: string;
    loginGithub: string;
    messagesCount: string;
    empty: string;
    placeholder: string;
    sending: string;
    send: string;
    hideConfirm: string;
    deleteConfirm: string;
    hide: string;
  };
  subscribe: {
    title: string;
    description: string;
    success: string;
    error: string;
    emailLabel: string;
    rssOnly: string;
    rssSubscribe: string;
    rssXml: string;
  };
  admin: {
    privateSpace: string;
    dashboard: string;
    writePost: string;
    manageSeries: string;
    manageAlbums: string;
  };
  gallery: {
    wall: string;
    gallery: string;
    slide: string;
    photo: string;
  };
  bookmark: {
    empty: string;
    emptyDesc: string;
    goToPosts: string;
    total: string;
    savedAt: string;
    remove: string;
  };
  readLater: {
    add: string;
    remove: string;
    added: string;
    hint: string;
  };
};

export const MESSAGES: Record<Locale, Messages> = {
  "zh-CN": {
    nav: {
      home: "首页",
      posts: "文章",
      tags: "标签",
      anime: "番剧",
      games: "游戏",
      books: "书籍",
      movies: "影视",
      music: "音乐",
      projects: "项目",
      skills: "技能",
      timeline: "时间线",
      albums: "相册",
      diary: "日记",
      guestbook: "留言",
      friends: "友链",
      about: "关于",
      archive: "归档",
      groupCreate: "创作",
      groupLife: "生活",
      groupInteract: "交互",
      groupFeatured: "精选",
      groupLinks: "链接",
    },
    common: {
      search: "搜索",
      searchPlaceholder: "搜索文章…",
      toggleTheme: "切换主题",
      themeDark: "暗色",
      themeLight: "亮色",
      themeCyberpunk: "赛博朋克",
      toggleLocale: "切换语言",
      readAll: "全部",
      backToPosts: "← 返回文章列表",
      backHome: "← 首页",
      loading: "加载中…",
      empty: "还没有内容。",
      subscribe: "订阅",
      submit: "提交",
      submitting: "提交中…",
      cancel: "取消",
      delete: "删除",
      save: "保存",
      learnMore: "了解更多",
      anonymous: "匿名",
      signIn: "登录",
      tableOfContents: "目录",
      copied: "已复制",
      copyLink: "复制链接",
      shareX: "分享到 X / Twitter",
      shareWeibo: "分享到微博",
    },
    post: {
      views: "次浏览",
      like: "点赞",
      unlike: "取消点赞",
      comments: "评论",
      summary: "AI 摘要",
      askAi: "问问 AI ✦",
      askAiHint: "Claude Haiku 会基于这篇文章的内容回答你的问题。回答仅供参考，可能与作者本人观点不同。",
      askAiPlaceholder: "比如：这套技术栈的成本怎样？为什么选 Postgres 而不是 SQLite？",
      aiThinking: "思考中…",
      aiAnswer: "AI 回答",
      featured: "精选",
      article: "文章",
      pinned: "置顶",
      pinnedTooltip: "置顶",
      read: "已读",
      readBadgeTitle: "你读过这篇",
      readingTimeSuffix: "分钟",
    },
    home: {
      latest: "最新文章",
      seeAll: "全部",
      topicSeries: "专题系列",
      dailyPick: "每日精选",
      empty: "还没有文章。",
      rssHint: "通过邮件或 RSS 获取新文章通知。",
    },
    hero: {
      systemOnline: "系统在线 · HV-001",
      subtitle: "高维空间",
      enterPosts: "进入文章",
      aboutMe: "关于我",
      latestPost: "最新文章",
      quickNav: "快速导航",
      popularTags: "热门标签",
      allTags: "全部标签",
      stats: {
        articles: "文章",
        words: "字",
        tags: "标签",
      },
    },
    stats: {
      siteStats: "站点数据",
      live: "实时",
      articles: "文章",
      articlesDesc: "已发布的公开文章",
      pageViews: "浏览量",
      pageViewsDesc: "累计阅读和访问信号",
      reactions: "互动",
      reactionsDesc: "读者留下的互动反馈",
      uptime: "在线",
      uptimeDesc: "Hypervoid 已在线运行",
      daysSuffix: "天",
      carouselLabel: "站点统计轮播分页",
      viewItem: "查看",
    },
    calendar: {
      dayHeaders: ["日", "一", "二", "三", "四", "五", "六"],
      posts: "篇文章",
    },
    widget: {
      notice: "公告",
      tagCloud: "标签云",
      closeNotice: "关闭公告",
    },
    time: {
      justNow: "刚刚",
      minutesAgo: "分钟前",
      hoursAgo: "小时前",
      daysAgo: "天前",
    },
    tag: {
      articleCount: "篇文章",
    },
    posts: {
      kicker: "资料索引 / 公共传输",
      allPosts: "全部文章",
      description: "以时间顺序展开的 Hypervoid 资料节点。技术、阅读、生活和兴趣都会在这里归档。",
      nodes: "节点",
      tags: "标签",
      empty: "暂无文章",
    },
    archive: {
      kicker: "时间线 / 时序扫描",
      yearSuffix: "年",
      postsCount: "篇文章",
    },
    tags: {
      kicker: "标签矩阵 / 主题频道",
      allTags: "全部标签",
      channels: "频道",
      empty: "暂无标签",
    },
    series: {
      kicker: "专题集群 / 长篇路由",
      title: "专题系列",
      clusters: "集群",
      description: "围绕同一主题展开的多篇文章，以更长的阅读路径组织。",
      empty: "暂无专题",
      openRoute: "打开路由",
    },
    friends: {
      kicker: "友情链接 / 网络节点",
      description: "朋友们的博客与个人站点。",
      empty: "暂无友链。",
    },
    guestbook: {
      kicker: "留言板 / 公共频道",
      description: "欢迎随便留言。用 GitHub 登录后发布，留言会同时显示你的头像和昵称。",
      loggedIn: "已登录：",
      signOut: "退出",
      loginPrompt: "登录后即可留言。",
      loginGithub: "用 GitHub 登录",
      messagesCount: "条留言",
      empty: "还没有留言。第一个留言的是你？",
      placeholder: "留下一句话…",
      sending: "发送中…",
      send: "发送",
      hideConfirm: "隐藏这条留言？",
      deleteConfirm: "永久删除这条留言？",
      hide: "隐藏",
    },
    subscribe: {
      title: "订阅更新",
      description: "新文章发布时通过邮件通知你，不发别的。随时退订。",
      success: "✓ 验证邮件已发到你的邮箱，点击邮件里的确认链接即可。",
      error: "订阅失败",
      emailLabel: "邮箱",
      rssOnly: "邮件订阅暂未开放，可以通过 RSS 阅读器获取新文章。",
      rssSubscribe: "RSS 订阅",
      rssXml: "RSS XML",
    },
    admin: {
      privateSpace: "私人空间",
      dashboard: "管理后台",
      writePost: "写文章",
      manageSeries: "专题管理",
      manageAlbums: "相册管理",
    },
    gallery: {
      wall: "照片墙",
      gallery: "照片画廊",
      slide: "幻灯片",
      photo: "照片",
    },
    bookmark: {
      empty: "收藏夹空空如也。",
      emptyDesc: "在任意文章页右上角点书签图标即可加入。书签只存在你这台设备的浏览器里，不上传到服务器。",
      goToPosts: "去文章列表逛逛",
      total: "共 {count} 篇",
      savedAt: "收藏于",
      remove: "移除收藏",
    },
    readLater: {
      add: "稍后读",
      remove: "从稍后读移除",
      added: "已在稍后读 / 点击移除",
      hint: "稍后读 → /reading-list",
    },
  },
  en: {
    nav: {
      home: "Home",
      posts: "Posts",
      tags: "Tags",
      anime: "Anime",
      games: "Games",
      books: "Books",
      movies: "Films",
      music: "Music",
      projects: "Projects",
      skills: "Skills",
      timeline: "Timeline",
      albums: "Gallery",
      diary: "Diary",
      guestbook: "Guestbook",
      friends: "Friends",
      about: "About",
      archive: "Archive",
      groupCreate: "Create",
      groupLife: "Life",
      groupInteract: "Connect",
      groupFeatured: "Picks",
      groupLinks: "Links",
    },
    common: {
      search: "Search",
      searchPlaceholder: "Search posts…",
      toggleTheme: "Toggle theme",
      themeDark: "Dark",
      themeLight: "Light",
      themeCyberpunk: "Cyberpunk",
      toggleLocale: "Switch language",
      readAll: "See all",
      backToPosts: "← Back to posts",
      backHome: "← Home",
      loading: "Loading…",
      empty: "Nothing here yet.",
      subscribe: "Subscribe",
      submit: "Submit",
      submitting: "Submitting…",
      cancel: "Cancel",
      delete: "Delete",
      save: "Save",
      learnMore: "Learn more",
      anonymous: "Anonymous",
      signIn: "Sign in",
      tableOfContents: "Table of contents",
      copied: "Copied",
      copyLink: "Copy link",
      shareX: "Share on X / Twitter",
      shareWeibo: "Share on Weibo",
    },
    post: {
      views: "views",
      like: "Like",
      unlike: "Unlike",
      comments: "Comments",
      summary: "AI summary",
      askAi: "Ask the AI ✦",
      askAiHint: "Claude Haiku will answer based on this post's content. Answers are for reference only and may differ from the author's view.",
      askAiPlaceholder: "e.g. What's the cost of this stack? Why Postgres over SQLite?",
      aiThinking: "Thinking…",
      aiAnswer: "AI answer",
      featured: "Featured",
      article: "Article",
      pinned: "Pinned",
      pinnedTooltip: "Pinned",
      read: "Read",
      readBadgeTitle: "You've read this",
      readingTimeSuffix: "min",
    },
    home: {
      latest: "Latest posts",
      seeAll: "See all",
      topicSeries: "Topic Series",
      dailyPick: "Daily Pick",
      empty: "No posts yet.",
      rssHint: "Get notified via email or RSS.",
    },
    hero: {
      systemOnline: "System Online · HV-001",
      subtitle: "Higher Dimension",
      enterPosts: "Enter Posts",
      aboutMe: "About Me",
      latestPost: "Latest Post",
      quickNav: "Quick Nav",
      popularTags: "Popular Tags",
      allTags: "All Tags",
      stats: {
        articles: "posts",
        words: "words",
        tags: "tags",
      },
    },
    stats: {
      siteStats: "Site Stats",
      live: "Live",
      articles: "Articles",
      articlesDesc: "Published public articles",
      pageViews: "Page Views",
      pageViewsDesc: "Cumulative reading and visit signals",
      reactions: "Reactions",
      reactionsDesc: "Reader interaction feedback",
      uptime: "Uptime",
      uptimeDesc: "Hypervoid has been online for",
      daysSuffix: "days",
      carouselLabel: "Site stats carousel pagination",
      viewItem: "View",
    },
    calendar: {
      dayHeaders: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      posts: "posts",
    },
    widget: {
      notice: "Notice",
      tagCloud: "Tag Cloud",
      closeNotice: "Close notice",
    },
    time: {
      justNow: "just now",
      minutesAgo: "minutes ago",
      hoursAgo: "hours ago",
      daysAgo: "days ago",
    },
    tag: {
      articleCount: "posts",
    },
    posts: {
      kicker: "Archive Index / Public Transmission",
      allPosts: "All Posts",
      description: "Hypervoid data nodes expanded in chronological order. Tech, reading, life and interests are all archived here.",
      nodes: "Nodes",
      tags: "Tags",
      empty: "No posts yet",
    },
    archive: {
      kicker: "Archive Timeline / Chronological Scan",
      yearSuffix: "y",
      postsCount: "Posts",
    },
    tags: {
      kicker: "Tag Matrix / Topic Channels",
      allTags: "All Tags",
      channels: "Channels",
      empty: "No tags yet",
    },
    series: {
      kicker: "Series Clusters / Long-Form Routes",
      title: "Series",
      clusters: "Clusters",
      description: "Multiple articles on the same topic, organized in longer reading paths.",
      empty: "No series yet",
      openRoute: "Open Route",
    },
    friends: {
      kicker: "Friend Links / Network Nodes",
      description: "Friends' blogs and personal sites.",
      empty: "No friend links yet.",
    },
    guestbook: {
      kicker: "Message Board / Public Channel",
      description: "Feel free to leave a message. Sign in with GitHub to post, and your avatar and nickname will be displayed.",
      loggedIn: "Signed in:",
      signOut: "Sign out",
      loginPrompt: "Sign in to leave a message.",
      loginGithub: "Sign in with GitHub",
      messagesCount: "messages",
      empty: "No messages yet. Be the first?",
      placeholder: "Leave a message…",
      sending: "Sending…",
      send: "Send",
      hideConfirm: "Hide this message?",
      deleteConfirm: "Permanently delete this message?",
      hide: "Hide",
    },
    subscribe: {
      title: "Subscribe",
      description: "Get notified by email when a new post is published. Nothing else.",
      success: "✓ A confirmation email was sent. Click the link to confirm.",
      error: "Subscription failed",
      emailLabel: "Email",
      rssOnly: "Email subscription is not available yet. You can use an RSS reader to get new posts.",
      rssSubscribe: "RSS Subscribe",
      rssXml: "RSS XML",
    },
    admin: {
      privateSpace: "Private Space",
      dashboard: "Dashboard",
      writePost: "Write Post",
      manageSeries: "Manage Series",
      manageAlbums: "Manage Albums",
    },
    gallery: {
      wall: "Photo Wall",
      gallery: "Photo Gallery",
      slide: "Slide",
      photo: "Photo",
    },
    bookmark: {
      empty: "No bookmarks yet.",
      emptyDesc: "Click the bookmark icon on any post to save it. Bookmarks are stored locally in your browser.",
      goToPosts: "Browse posts",
      total: "{count} saved",
      savedAt: "Saved",
      remove: "Remove bookmark",
    },
    readLater: {
      add: "Read later",
      remove: "Remove from read later",
      added: "In read later / click to remove",
      hint: "Read later → /reading-list",
    },
  },
};
