"use client";

import type { ComponentProps } from "react";
import { Button } from "@/components/ui/Button";
import { siteConfig } from "@/config/site";
import { useDemo } from "./DemoProvider";

type Props = Omit<ComponentProps<typeof Button>, "onClick" | "children"> & {
  label?: string;
  interest?: string;
};

export function BookDemoButton({ label = siteConfig.cta.primary, interest, ...props }: Props) {
  const { openDemo } = useDemo();
  return (
    <Button aria-haspopup="dialog" onClick={() => openDemo(interest)} {...props}>
      {label}
    </Button>
  );
}
