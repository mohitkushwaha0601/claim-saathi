import type { ButtonHTMLAttributes } from "react";

import { Button } from "./ui";

export function PrimaryButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <Button {...props} />;
}
