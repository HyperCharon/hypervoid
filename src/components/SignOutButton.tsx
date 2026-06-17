"use client";

import { useCallback, useTransition } from "react";

/**
 * Logout button. Fetches the CSRF token from NextAuth, then submits a
 * form POST to /api/auth/signout which clears the session cookie
 * server-side. This bypasses any SessionProvider/client-side auth state
 * issues and works reliably across cookie domain configs.
 */
export function SignOutButton({
  className = "",
  children = "退出登录",
  ...rest
}: {
  className?: string;
  children?: React.ReactNode;
} & React.HTMLAttributes<HTMLElement>) {
  const [pending, startTransition] = useTransition();

  const handleClick = useCallback(() => {
    startTransition(async () => {
      try {
        // 1. Get the CSRF token
        const csrfRes = await fetch("/api/auth/csrf");
        const { csrfToken } = await csrfRes.json();

        // 2. Submit signout via form POST — the browser will follow the
        //    redirect response and the Set-Cookie header will clear the
        //    session cookie. Using a real form ensures cookies are sent
        //    and Set-Cookie is honored (unlike fetch with redirect:follow
        //    which may not apply Set-Cookie from the final response).
        const form = document.createElement("form");
        form.method = "POST";
        form.action = "/api/auth/signout";
        form.style.display = "none";

        const csrfInput = document.createElement("input");
        csrfInput.type = "hidden";
        csrfInput.name = "csrfToken";
        csrfInput.value = csrfToken;
        form.appendChild(csrfInput);

        const cbInput = document.createElement("input");
        cbInput.type = "hidden";
        cbInput.name = "callbackUrl";
        cbInput.value = "/sign-in";
        form.appendChild(cbInput);

        document.body.appendChild(form);
        form.submit();
        // The browser will navigate to /sign-in after the server responds
        // with the redirect + Set-Cookie headers.
      } catch {
        // Fallback — just navigate (session may persist but user at least
        // leaves the page)
        location.href = "/sign-in";
      }
    });
  }, []);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={className}
      {...rest}
    >
      {children}
    </button>
  );
}
