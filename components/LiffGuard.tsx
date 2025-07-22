"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { LiffProvider, LIFFProfile } from "./LiffContext";
import liff from "@line/liff";

export default function LiffGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
  const [profile, setProfile] = useState<LIFFProfile | null>(null);
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
        const p = await liff.getProfile();
        const prof: LIFFProfile = {
          userId: p.userId,
          displayName: p.displayName,
        };
        setProfile(prof);

        // 4. Redirect based on ?page= query
        // **Redirect logic**: only run when on the root `/` path
        if (pathname === "/") {
          const pageParam = searchParams.get("page");
          const target =
            pageParam === "createTask" ? "/createTask" : "/listTasks";
          router.replace(target);
        }
      } catch (err) {
        console.error("LIFF error:", err);
      } finally {
        setReady(true);
      }
    };

    initAndRedirect();
  }, []);

  // Show loader until LIFF flow finishes
  if (!ready || !profile) {
    return (
      <div style={{ padding: 20, textAlign: "center" }}>Loading LIFF…</div>
    );
  }

  return <LiffProvider profile={profile}>{children}</LiffProvider>;
}
