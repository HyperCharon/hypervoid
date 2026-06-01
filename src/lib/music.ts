export type MusicAlbum = {
  id: string;
  title: string;
  artist: string;
  year?: number;
  cover?: string;
  /** 平台外链：网易云/Spotify/Apple Music/Bandcamp 等 */
  link?: string;
  note?: string;
};

export type MusicPlaylist = {
  id: string;
  title: string;
  description?: string;
  link: string;
  platform: "netease" | "spotify" | "apple" | "youtube" | "bandcamp" | "other";
  trackCount?: number;
};

/** 在循环听的专辑。空数组时页面会显示提示。 */
export const ALBUMS_ON_REPEAT: MusicAlbum[] = [];

/** 公开播放列表。这里放你愿意分享的歌单。 */
export const PLAYLISTS: MusicPlaylist[] = [];

export const GENRES = [
  "Post-rock",
  "Ambient",
  "Shoegaze",
  "Indie folk",
  "Lo-fi",
  "Jazz",
  "Classical",
  "Electronic",
];
