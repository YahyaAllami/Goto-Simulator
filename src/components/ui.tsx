import { forwardRef } from 'react';
import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  LabelHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { cn } from '../lib/cn';

type ButtonVariant = 'default' | 'secondary' | 'ghost' | 'danger';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const buttonVariants: Record<ButtonVariant, string> = {
  default:
    'bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200',
  secondary:
    'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700',
  ghost:
    'bg-transparent text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800',
  danger:
    'bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        buttonVariants[variant],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = 'Button';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'h-9 w-full rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm font-mono text-neutral-900 placeholder:text-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'w-full rounded-md border border-neutral-300 bg-white p-2 text-sm font-mono text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100',
      className,
    )}
    {...props}
  />
));
Textarea.displayName = 'Textarea';

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      'h-9 rounded-md border border-neutral-300 bg-white px-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100',
      className,
    )}
    {...props}
  />
));
Select.displayName = 'Select';

export const Label = forwardRef<
  HTMLLabelElement,
  LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      'text-xs font-medium text-neutral-700 dark:text-neutral-300',
      className,
    )}
    {...props}
  />
));
Label.displayName = 'Label';

export function Card({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900',
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'border-b border-neutral-200 px-3 py-2 text-xs font-medium uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:text-neutral-400',
        className,
      )}
      {...props}
    />
  );
}

export function CardContent({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-3', className)} {...props} />;
}

type BadgeVariant = 'default' | 'success' | 'error' | 'info' | 'muted';

const badgeVariants: Record<BadgeVariant, string> = {
  default:
    'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200',
  success:
    'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
  error: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  muted:
    'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400',
};

export function Badge({
  className,
  variant = 'default',
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
        badgeVariants[variant],
        className,
      )}
      {...props}
    />
  );
}

export function Slider({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="range"
      className={cn(
        'h-2 w-full cursor-pointer appearance-none rounded-full bg-neutral-200 dark:bg-neutral-800',
        className,
      )}
      {...props}
    />
  );
}
