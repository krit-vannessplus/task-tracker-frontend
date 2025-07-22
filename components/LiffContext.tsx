// components/LiffContext.tsx
"use client";

import { createContext, useContext, ReactNode } from "react";

export interface LIFFProfile {
  userId: string;
  displayName: string;
}

const LiffContext = createContext<LIFFProfile | null>(null);

export function LiffProvider({
  profile,
  children,
}: {
  profile: LIFFProfile;
  children: ReactNode;
}) {
  return (
    <LiffContext.Provider value={profile}>{children}</LiffContext.Provider>
  );
}

export function useLiffProfile(): LIFFProfile {
  const ctx = useContext(LiffContext);
  if (!ctx) {
    throw new Error("useLiffProfile must be used within a LiffProvider");
  }
  return ctx;
}
