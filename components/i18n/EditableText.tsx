"use client";

import React from "react";

type EditableTextProps = {
  translationKey: string;
  text: string;
  as?: "span" | "p" | "h1" | "h2" | "h3" | "h4" | "button";
  className?: string;
};

export default function EditableText({
  translationKey: _translationKey,
  text,
  as = "span",
  className,
}: EditableTextProps) {
  const Tag = as;

  return <Tag className={className}>{text}</Tag>;
}
