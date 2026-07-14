'use client';

import {
  Children,
  ComponentPropsWithoutRef,
  isValidElement,
  ReactNode,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

export type SelectProps = ComponentPropsWithoutRef<'select'>;

type SelectOption = {
  value: string;
  label: ReactNode;
  disabled: boolean;
};

function collectOptions(children: ReactNode): SelectOption[] {
  const options: SelectOption[] = [];

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;

    if (child.type === 'option') {
      const optionProps = child.props as ComponentPropsWithoutRef<'option'>;
      const value =
        optionProps.value !== undefined
          ? String(optionProps.value)
          : String(optionProps.children ?? '');
      options.push({
        value,
        label: optionProps.children,
        disabled: Boolean(optionProps.disabled),
      });
      return;
    }

    const nested = (child.props as { children?: ReactNode }).children;
    if (nested) {
      options.push(...collectOptions(nested));
    }
  });

  return options;
}

type MenuPlacement = {
  top: number;
  left: number;
  width: number;
  openUp: boolean;
  maxHeight: number;
};

export function Select({
  className = '',
  children,
  value,
  defaultValue,
  onChange,
  disabled,
  name,
  ...rest
}: SelectProps) {
  const options = useMemo(() => collectOptions(children), [children]);

  const isControlled = value !== undefined;
  const fallbackValue =
    defaultValue !== undefined
      ? String(defaultValue)
      : options.find((option) => !option.disabled)?.value ?? '';
  const [internalValue, setInternalValue] = useState(fallbackValue);
  const currentValue = isControlled ? String(value ?? '') : internalValue;

  const selectedOption =
    options.find((option) => option.value === currentValue) ?? options[0] ?? null;

  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [placement, setPlacement] = useState<MenuPlacement | null>(null);

  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const listboxId = useId();

  const close = () => {
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const openMenu = () => {
    if (disabled || options.length === 0) return;
    const selectedIndex = options.findIndex(
      (option) => option.value === currentValue && !option.disabled
    );
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : options.findIndex((o) => !o.disabled));
    setIsOpen(true);
  };

  const commit = (option: SelectOption) => {
    if (option.disabled) return;
    close();
    if (!isControlled) {
      setInternalValue(option.value);
    }
    if (onChange && option.value !== currentValue) {
      const target = { value: option.value, name: name ?? '' } as unknown as HTMLSelectElement;
      onChange({
        target,
        currentTarget: target,
      } as React.ChangeEvent<HTMLSelectElement>);
    }
  };

  const moveActive = (direction: 1 | -1) => {
    if (options.length === 0) return;
    setActiveIndex((current) => {
      let next = current;
      for (let step = 0; step < options.length; step += 1) {
        next = (next + direction + options.length) % options.length;
        if (!options[next].disabled) return next;
      }
      return current;
    });
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;

    if (!isOpen) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' ', 'Spacebar'].includes(event.key)) {
        event.preventDefault();
        openMenu();
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        moveActive(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        moveActive(-1);
        break;
      case 'Home':
        event.preventDefault();
        setActiveIndex(options.findIndex((option) => !option.disabled));
        break;
      case 'End':
        event.preventDefault();
        for (let index = options.length - 1; index >= 0; index -= 1) {
          if (!options[index].disabled) {
            setActiveIndex(index);
            break;
          }
        }
        break;
      case 'Enter':
      case ' ':
      case 'Spacebar':
        event.preventDefault();
        if (activeIndex >= 0 && options[activeIndex]) {
          commit(options[activeIndex]);
        }
        break;
      case 'Escape':
        event.preventDefault();
        close();
        break;
      case 'Tab':
        close();
        break;
      default:
        break;
    }
  };

  // Position the portal menu against the trigger; flip upward when short on space.
  useEffect(() => {
    if (!isOpen) return;

    const updatePlacement = () => {
      const trigger = buttonRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const gap = 6;
      const viewportPadding = 8;
      const spaceBelow = window.innerHeight - rect.bottom - viewportPadding;
      const spaceAbove = rect.top - viewportPadding;
      const openUp = spaceBelow < 180 && spaceAbove > spaceBelow;
      const maxHeight = Math.min(288, Math.max(140, (openUp ? spaceAbove : spaceBelow) - gap));

      setPlacement({
        top: openUp ? rect.top - gap : rect.bottom + gap,
        left: rect.left,
        width: rect.width,
        openUp,
        maxHeight,
      });
    };

    updatePlacement();
    window.addEventListener('resize', updatePlacement);
    window.addEventListener('scroll', updatePlacement, true);
    return () => {
      window.removeEventListener('resize', updatePlacement);
      window.removeEventListener('scroll', updatePlacement, true);
    };
  }, [isOpen]);

  // Close when clicking outside of the trigger and menu.
  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      close();
    };

    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [isOpen]);

  // Keep the keyboard-active option visible while navigating.
  useEffect(() => {
    if (!isOpen || activeIndex < 0) return;
    const activeElement = menuRef.current?.querySelector<HTMLElement>(
      `[data-option-index="${activeIndex}"]`
    );
    activeElement?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, isOpen]);

  return (
    <>
      <button
        {...(rest as ComponentPropsWithoutRef<'button'>)}
        ref={buttonRef}
        type="button"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={isOpen ? listboxId : undefined}
        disabled={disabled}
        onClick={() => (isOpen ? close() : openMenu())}
        onKeyDown={onKeyDown}
        className={[
          'inline-flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 text-left text-sm text-slate-100 shadow-sm transition-colors sm:h-10',
          'hover:border-slate-600/80 focus:outline-none focus:ring-2 focus:ring-sky-400/70',
          'disabled:cursor-not-allowed disabled:opacity-60',
          className,
        ].join(' ')}
      >
        <span className="truncate">{selectedOption?.label ?? ''}</span>
        <svg
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
          className={[
            'h-4 w-4 shrink-0 text-slate-400 transition-transform duration-150',
            isOpen ? 'rotate-180 text-sky-300' : '',
          ].join(' ')}
        >
          <path
            d="M5.5 7.5 10 12l4.5-4.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {name ? <input type="hidden" name={name} value={currentValue} /> : null}
      {isOpen && placement
        ? createPortal(
            <div
              ref={menuRef}
              id={listboxId}
              role="listbox"
              style={{
                position: 'fixed',
                top: placement.top,
                left: placement.left,
                width: placement.width,
                maxHeight: placement.maxHeight,
                transform: placement.openUp ? 'translateY(-100%)' : undefined,
              }}
              className="z-[70] overflow-y-auto rounded-xl border border-slate-700/80 bg-slate-950/95 p-1 shadow-[0_22px_60px_rgba(2,8,23,0.65)] ring-1 ring-inset ring-white/5 backdrop-blur-xl"
            >
              {options.map((option, index) => {
                const isSelected = option.value === currentValue;
                const isActive = index === activeIndex;
                return (
                  <button
                    key={`${option.value}-${index}`}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    data-option-index={index}
                    disabled={option.disabled}
                    onMouseEnter={() => {
                      if (!option.disabled) setActiveIndex(index);
                    }}
                    onClick={() => commit(option)}
                    className={[
                      'flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                      option.disabled
                        ? 'cursor-not-allowed text-slate-600'
                        : isSelected
                          ? 'bg-sky-500/15 font-medium text-sky-100'
                          : isActive
                            ? 'bg-slate-800/80 text-slate-100'
                            : 'text-slate-300',
                    ].join(' ')}
                  >
                    <span className="truncate">{option.label}</span>
                    {isSelected ? (
                      <svg
                        viewBox="0 0 20 20"
                        fill="none"
                        aria-hidden="true"
                        className="h-4 w-4 shrink-0 text-sky-300"
                      >
                        <path
                          d="m4.5 10.5 3.5 3.5 7.5-8"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : null}
                  </button>
                );
              })}
            </div>,
            document.body
          )
        : null}
    </>
  );
}
