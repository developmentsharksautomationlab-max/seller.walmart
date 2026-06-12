"use client";

import { useState, type ComponentProps } from "react";
import { Eye, EyeOff, Lock, Loader2, AlertCircle, type LucideIcon } from "lucide-react";
import { inputClass, labelClass, errorTextClass } from "@/components/ui/styles";

type FieldProps = ComponentProps<"input"> & {
  label: string;
  icon?: LucideIcon;
  error?: string;
};

export function Field({ label, icon: Icon, error, id, className, ...props }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        )}
        <input
          id={id}
          className={`${inputClass} ${Icon ? "pl-9" : ""} ${
            error ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100" : ""
          } ${className ?? ""}`}
          {...props}
        />
      </div>
      {error && <p className={errorTextClass}>{error}</p>}
    </div>
  );
}

type PasswordFieldProps = ComponentProps<"input"> & {
  label: string;
  error?: string;
};

export function PasswordField({ label, error, id, ...props }: PasswordFieldProps) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className="relative">
        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          id={id}
          type={show ? "text" : "password"}
          className={`${inputClass} pl-9 pr-10 ${
            error ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100" : ""
          }`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          tabIndex={-1}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 transition-colors hover:text-slate-600"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className={errorTextClass}>{error}</p>}
    </div>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function SubmitButton({
  pending,
  children,
  pendingLabel,
}: {
  pending: boolean;
  children: React.ReactNode;
  pendingLabel: string;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-full bg-wm-blue px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-wm-blue-dark disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {pending ? pendingLabel : children}
    </button>
  );
}
