"use client";

import { useCallback, useState } from "react";

/**
 * Debug logout — logs every step to console so we can see what's failing.
 */
export function SignOutButton({
  redirectTo = "/",
  className = "",
  children = "退出登录",
  ...rest
}: {
  redirectTo?: string;
  className?: string;
  children?: React.ReactNode;
} & React.HTMLAttributes<HTMLElement>) {
  const [loading, setLoading] = useState(false);
  const [debug, setDebug] = useState("");

  const handleClick = useCallback(async () => {
    setLoading(true);
    const log = (msg: string) => {
      console.log("[SignOut]", msg);
      setDebug((prev) => prev + msg + "\n");
    };

    try {
      // Step 1: Get CSRF token
      log("1. Fetching CSRF token...");
      const csrfRes = await fetch("/api/auth/csrf");
      log(`   CSRF response: status=${csrfRes.status}, ok=${csrfRes.ok}`);
      const csrfData = await csrfRes.json();
      log(`   CSRF token: ${csrfData?.csrfToken ? csrfData.csrfToken.slice(0, 16) + "..." : "EMPTY"}`);

      // Step 2: POST to signout
      log("2. POSTing to /api/auth/signout...");
      const signoutRes = await fetch("/api/auth/signout", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          csrfToken: csrfData?.csrfToken ?? "",
          callbackUrl: redirectTo,
        }),
      });
      log(`   Signout response: status=${signoutRes.status}, ok=${signoutRes.ok}, type=${signoutRes.type}`);

      // Check response headers
      const setCookie = signoutRes.headers.get("set-cookie");
      log(`   Set-Cookie header: ${setCookie ? "PRESENT" : "MISSING"}`);

      // Read response body
      const bodyText = await signoutRes.text();
      log(`   Response body (first 300 chars): ${bodyText.slice(0, 300)}`);

      // Check current cookies
      log(`   Document cookies: ${document.cookie || "(empty — httpOnly cookies not visible)"}`);

      log("3. Navigating to " + redirectTo);
      window.location.href = redirectTo;
    } catch (e) {
      log(`ERROR: ${e instanceof Error ? e.message : String(e)}`);
      window.location.href = redirectTo;
    }
  }, [redirectTo]);

  return (
    <div className="inline">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={className}
        {...rest}
      >
        {children}
      </button>
      {debug && (
        <pre
          className="fixed bottom-4 right-4 z-[9999] max-h-[60vh] max-w-[90vw] overflow-auto rounded-lg border border-red-500 bg-black p-4 text-xs text-red-300"
          style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}
        >
          {debug}
        </pre>
      )}
    </div>
  );
}
