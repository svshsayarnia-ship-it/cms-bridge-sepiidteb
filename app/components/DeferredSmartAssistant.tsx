"use client";

import { useEffect, useState } from "react";

type SmartAssistantComponent =
  typeof import("./SmartAssistant")["SmartAssistant"];

export function DeferredSmartAssistant() {
  const [Assistant, setAssistant] =
    useState<SmartAssistantComponent | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const assistantModule = await import("./SmartAssistant");
      if (!cancelled) {
        setAssistant(() => assistantModule.SmartAssistant);
      }
    };

    const timer = window.setTimeout(() => {
      void load();
    }, 1_500);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  return Assistant ? <Assistant /> : null;
}
