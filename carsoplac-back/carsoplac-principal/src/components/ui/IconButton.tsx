// src/components/ui/IconButton.tsx
import type { ReactNode } from "react";

type IconButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  title?: string;
};

export default function IconButton({
  children,
  onClick,
  className = "",
}: IconButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`p-2 active:scale-90 transition ${className}`}
    >
      {children}
    </button>
  );
}
