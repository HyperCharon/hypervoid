import type { Metadata } from "next";
import { fetchOwnedGames } from "@/lib/steam";
import { siteConfig } from "@/lib/site-config";
import { GamesBrowser } from "@/components/GamesBrowser";

export const revalidate = 7200;

export const metadata: Metadata = {
  title: "Steam 游戏库",
  description: "在玩、玩过、想玩的游戏",
};

export default async function GamesPage() {
  const { games, total } = await fetchOwnedGames();

  const steamSocial = siteConfig.socials.find((s) => s.icon === "steam");
  const totalHours = Math.round(
    games.reduce((acc, g) => acc + g.playtimeForeverMin, 0) / 60,
  );

  return (
    <div className="flex flex-col gap-6">
      <header className="hv-panel relative overflow-hidden p-5 sm:p-7">
        <p className="hv-kicker">Games / Steam_Library</p>
        <h1 className="hv-title mt-2 text-3xl font-black uppercase tracking-tight sm:text-4xl">
          Steam 游戏库
        </h1>
        <p className="mt-2 text-sm text-muted">
          {total > 0 ? (
            <>
              共 {total} 款游戏 · 总时长 {totalHours} 小时
              {steamSocial ? (
                <>
                  <span className="mx-2">·</span>
                  数据来自{" "}
                  <a
                    href={steamSocial.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="underline hover:text-primary"
                  >
                    Steam Profile
                  </a>
                </>
              ) : null}
            </>
          ) : (
            "数据未配置或暂时无法读取。"
          )}
        </p>
      </header>

      {games.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted">
          <p className="font-medium">⚙️ Steam 游戏库未配置</p>
          <p className="mt-2">需要环境变量：</p>
          <ul className="ml-4 mt-1 list-disc space-y-0.5 text-xs">
            <li>
              <code className="rounded bg-card px-1.5 py-0.5">
                STEAM_API_KEY
              </code>{" "}
              ——{" "}
              <a
                href="https://steamcommunity.com/dev/apikey"
                target="_blank"
                rel="noreferrer noopener"
                className="underline hover:text-primary"
              >
                steamcommunity.com/dev/apikey
              </a>{" "}
              申请（5 分钟，免费）
            </li>
            <li>
              <code className="rounded bg-card px-1.5 py-0.5">STEAM_ID</code>{" "}
              （17 位数字 ID） 或{" "}
              <code className="rounded bg-card px-1.5 py-0.5">
                STEAM_VANITY
              </code>{" "}
              （URL 自定义名，例如{" "}
              <code>Charon0415</code>）
            </li>
          </ul>
          <p className="mt-2 text-xs">
            还要把 Steam 个人资料的 <strong>游戏详情</strong>{" "}
            隐私设置改为「公开」才能拉到列表。
          </p>
        </div>
      ) : (
        <GamesBrowser games={games} />
      )}
    </div>
  );
}
