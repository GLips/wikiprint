import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "../ui/label";

type InputProps = React.ComponentProps<typeof Input> & { error?: string; inputClassName?: string; label?: string };
const TextInput = React.forwardRef(
  ({ className, inputClassName, label, ...props }: InputProps, ref: React.Ref<HTMLInputElement>) => {
    return (
      <div className={className}>
        {label ? <Label htmlFor={props.name}>{label}</Label> : null}
        <Input ref={ref} className={inputClassName} {...props} />
        {props.error ? <div className="text-red-500">{props.error}</div> : null}
      </div>
    );
  }
);

TextInput.displayName = "TextInput";

export default TextInput;
