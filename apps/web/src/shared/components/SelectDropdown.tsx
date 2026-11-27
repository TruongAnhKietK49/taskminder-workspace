import {
  type KeyboardEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import { cn } from "@/shared/lib/cn";

export type SelectOption<TValue extends string = string> = {
  value: TValue;
  label: string;
  description?: string;
  badge?: string;
};

type SelectDropdownProps<TValue extends string = string> = {
  value: TValue;
  options: Array<SelectOption<TValue>>;
  onChange: (value: TValue) => void;
  placeholder?: string;
  disabled?: boolean;
  ariaLabel?: string;
  id?: string;
  size?: "sm" | "md";
  align?: "left" | "right";
  className?: string;
  menuClassName?: string;
};

export function SelectDropdown<TValue extends string = string>({
  value,
  options,
  onChange,
  placeholder = "Chọn một mục...",
  disabled = false,
  ariaLabel,
  id,
  size = "md",
  align = "left",
  className,
  menuClassName,
}: SelectDropdownProps<TValue>) {
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  function toggleOpen() {
    if (disabled) return;
    setOpen((prev) => {
      const next = !prev;
      if (next) {
        const idx = options.findIndex((opt) => opt.value === value);
        setHighlightedIndex(idx >= 0 ? idx : 0);
      }
      return next;
    });
  }

  function selectOption(optionValue: TValue) {
    onChange(optionValue);
    setOpen(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;

    if (!open) {
      if (
        event.key === "ArrowDown" ||
        event.key === "ArrowUp" ||
        event.key === "Enter" ||
        event.key === " "
      ) {
        event.preventDefault();
        toggleOpen();
      }
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((prev) =>
        options.length === 0 ? -1 : (prev + 1) % options.length,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((prev) =>
        options.length === 0
          ? -1
          : (prev - 1 + options.length) % options.length,
      );
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const target = options[highlightedIndex];
      if (target) {
        selectOption(target.value);
      }
    }
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        id={id}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={toggleOpen}
        onKeyDown={handleKeyDown}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-xl border bg-white text-left outline-none transition",
          size === "sm"
            ? "px-2.5 py-1.5 text-xs font-medium"
            : "px-3 py-2 text-sm font-medium",
          open
            ? "border-sky-500 ring-4 ring-sky-500/15"
            : "border-slate-200 hover:border-sky-300",
          "disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400",
          "dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-sky-500/60",
        )}
      >
        <span
          className={cn(
            "truncate",
            selectedOption
              ? "text-slate-800 dark:text-slate-100"
              : "text-slate-400",
          )}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>

        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={cn(
            "shrink-0 text-slate-400 transition-transform duration-150",
            open && "rotate-180 text-sky-600 dark:text-sky-400",
          )}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && options.length > 0 ? (
        <ul
          id={listboxId}
          role="listbox"
          className={cn(
            "absolute z-50 mt-1.5 max-h-64 min-w-full w-max max-w-xs overflow-y-auto rounded-2xl border border-slate-200/90 bg-white p-1.5 shadow-xl shadow-blue-950/10",
            "dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/40",
            align === "right" ? "right-0" : "left-0",
            menuClassName,
          )}
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isHighlighted = index === highlightedIndex;

            return (
              <li key={option.value} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onClick={() => selectOption(option.value)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition",
                    isSelected
                      ? "bg-sky-50 font-semibold text-blue-700 dark:bg-sky-500/15 dark:text-sky-300"
                      : isHighlighted
                        ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
                        : "text-slate-700 hover:bg-sky-50/70 hover:text-blue-700 dark:text-slate-200 dark:hover:bg-slate-800",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-xs sm:text-sm">
                        {option.label}
                      </span>
                      {option.badge ? (
                        <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {option.badge}
                        </span>
                      ) : null}
                    </div>
                    {option.description ? (
                      <p className="mt-0.5 truncate text-[11px] font-normal text-slate-400">
                        {option.description}
                      </p>
                    ) : null}
                  </div>

                  {isSelected ? (
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="shrink-0 text-blue-600 dark:text-sky-400"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
