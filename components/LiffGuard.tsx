"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import liff from "@line/liff";

export default function LiffGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ready, setReady] = useState(false);
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
  console.log("LIFF ID:", liffId);

  useEffect(() => {
    const initAndRedirect = async () => {
      try {
        // 1. Init LIFF
        await liff.init({ liffId: liffId! });

        // 2. Force login if needed
        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }
        console.log(
          liff.isLoggedIn() ? "User is logged in" : "User is not logged in"
        );

        // 3. (Optional) Get profile here
        const profile = await liff.getProfile();
        console.log("LIFF user:", profile.userId, profile.displayName);

        // 4. Redirect based on ?page= query
        const page = searchParams.get("page");
        if (page === "createTask") {
          router.replace("/createTask");
        } else {
          router.replace("/listTasks");
        }
      } catch (err) {
        console.error("LIFF error:", err);
      } finally {
        setReady(true);
      }
    };

    initAndRedirect();
  }, [router, searchParams]);

  // Show loader until LIFF flow finishes
  if (!ready) {
    return (
      <div style={{ padding: 20, textAlign: "center" }}>
        Loading… please wait
      </div>
    );
  }

  // Once ready (and already redirected), render children
  return <>{children}</>;
}
