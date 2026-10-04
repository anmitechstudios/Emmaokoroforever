import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

type Common = { label: string; name: string; hint?: ReactNode; error?: string; optional?: boolean };

function Wrapper({ label, name, hint, error, optional, children }: Common & { children: ReactNode }) {
  return (
    <div>
      <label htmlFor={name} className="field-label">
        {label}
        {optional && <span className="ml-2 normal-case tracking-normal text-muted/80">optional</span>}
      </label>
      {children}
      {hint && !error && (
        <p id={`${name}-hint`} className="mt-1.5 text-[0.8125rem] leading-snug text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${name}-error`} role="alert" className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}

const described = (name: string, hint?: ReactNode, error?: string) =>
  error ? `${name}-error` : hint ? `${name}-hint` : undefined;

export function Field({ label, name, hint, error, optional, ...input }: Common & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Wrapper {...{ label, name, hint, error, optional }}>
      <input
        id={name}
        name={name}
        className="field"
        aria-invalid={error ? true : undefined}
        aria-describedby={described(name, hint, error)}
        {...input}
      />
    </Wrapper>
  );
}

export function TextArea({ label, name, hint, error, optional, ...input }: Common & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Wrapper {...{ label, name, hint, error, optional }}>
      <textarea
        id={name}
        name={name}
        className="field"
        aria-invalid={error ? true : undefined}
        aria-describedby={described(name, hint, error)}
        {...input}
      />
    </Wrapper>
  );
}

/** Invisible to people; irresistible to form-filling bots. */
export function Honeypot() {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
      <label>
        Leave this field empty
        <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
      </label>
    </div>
  );
}
