import React from "react";

type Props = {
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  className?: string;
};

export default function Form(f: Props) {
  const { children, ...form } = f;

  return <form {...form}>{children}</form>;
}
