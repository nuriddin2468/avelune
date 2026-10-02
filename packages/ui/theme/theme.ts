import { isPlatformBrowser } from '@angular/common';
import {
  DOCUMENT,
  DestroyRef,
  Injectable,
  InjectionToken,
  PLATFORM_ID,
  computed,
  inject,
  signal,
  type Signal,
  type WritableSignal,
} from '@angular/core';
import { aveBrandFingerprint } from '@avelune/tokens/brand/presets';
import type { AveBrandInput, AveBrandReport } from '@avelune/tokens/brand';
import { BrandSheet, brandStorageKey, isBrandInput, parseStoredBrand, type StoredBrand } from './brand';

/**
 * The colour theme a user prefers. `system` follows the operating system (`prefers-color-scheme`).
 *
 * @beta
 */
export type AveThemePreference = 'light' | 'dark' | 'system';

/**
 * Control density. `compact` shortens controls and their padding through the component tokens.
 *
 * @beta
 */
export type AveDensity = 'comfortable' | 'compact';

/**
 * The motion a user prefers. `system` follows `prefers-reduced-motion`; `reduced` reduces motion whatever the
 * system says. There is no way to force full motion over a system that asks for less.
 *
 * @beta
 */
export type AveMotionPreference = 'system' | 'reduced';

/**
 * Options of {@link provideAvelune}.
 *
 * @beta
 */
export interface AveOptions {
  /** The theme until the user chooses one. Default `system`. */
  readonly theme?: AveThemePreference;
  /** The density until the user chooses one. Default `comfortable`. */
  readonly density?: AveDensity;
  /** The motion preference until the user chooses one. Default `system`. */
  readonly motion?: AveMotionPreference;
  /** Whether the user's choices are kept in `localStorage` for later visits and shared across tabs. Default `true`. */
  readonly persist?: boolean;
  /**
   * The brand until {@link AveTheme.setBrand} sets one: a preset's name or a `#rrggbb` colour (ADR 0089). Default:
   * none, the colours of the kit or of the product's own brand stylesheet.
   */
  readonly brand?: AveBrandInput | null;
}

/** The options of provideAvelune, read by AveTheme. Not public: applications pass them to provideAvelune. */
export const AVE_OPTIONS = new InjectionToken<AveOptions>('AVE_OPTIONS');

interface Preferences {
  readonly theme: AveThemePreference;
  readonly density: AveDensity;
  readonly motion: AveMotionPreference;
}

const choices = {
  theme: ['light', 'dark', 'system'],
  density: ['comfortable', 'compact'],
  motion: ['system', 'reduced'],
} as const satisfies { readonly [Key in keyof Preferences]: readonly Preferences[Key][] };

/** The `localStorage` key of the user's choices. */
const storageKey = 'avelune:preferences';

function isChoice<Key extends keyof Preferences>(key: Key, value: unknown): value is Preferences[Key] {
  return (choices[key] as readonly unknown[]).includes(value);
}

/** The choices stored as JSON, keeping only the values the kit knows. */
function parsePreferences(json: string | null): Partial<Preferences> {
  if (json === null) return {};
  let value: unknown;
  try {
    value = JSON.parse(json);
  } catch {
    return {};
  }
  if (typeof value !== 'object' || value === null) return {};
  const theme: unknown = Reflect.get(value, 'theme');
  const density: unknown = Reflect.get(value, 'density');
  const motion: unknown = Reflect.get(value, 'motion');
  return {
    ...(isChoice('theme', theme) ? { theme } : {}),
    ...(isChoice('density', density) ? { density } : {}),
    ...(isChoice('motion', motion) ? { motion } : {}),
  };
}

/** `localStorage`, or null where there is none or where reading it throws (a sandboxed frame, blocked storage). */
function browserStorage(view: Window | null): Storage | null {
  try {
    return view?.localStorage ?? null;
  } catch {
    return null;
  }
}

/**
 * The page's theme, density and motion preference (brief §6.6). It writes them to `<html>` as the `data-theme`,
 * `data-density` and `data-motion` attributes that `tokens.css` reads, keeps the user's choices in `localStorage`
 * and follows a choice made in another tab. A preference that follows the system, and the default density, remove
 * their attribute, so the media queries decide.
 *
 * {@link provideAvelune} creates it at bootstrap, before the first render; inject it to read or change the
 * preferences.
 *
 * @beta
 */
@Injectable({ providedIn: 'root' })
export class AveTheme {
  private readonly root = inject(DOCUMENT).documentElement;
  private readonly storage: Storage | null;
  private readonly preferences: WritableSignal<Preferences>;

  /** The theme preference. */
  readonly theme: Signal<AveThemePreference>;
  /** The density. */
  readonly density: Signal<AveDensity>;
  /** The motion preference. */
  readonly motion: Signal<AveMotionPreference>;

  private readonly brandSheet: BrandSheet | undefined;
  private readonly brandState = signal<StoredBrand | null>(null);
  private brandRequest = 0;

  /** The brand the page shows: a preset's name or a colour; `null` for the kit's or the product's own colours. */
  readonly brand = computed(() => this.brandState()?.input ?? null);
  /** What the generator adapted for the brand the page shows (ADR 0089), for a settings screen to explain. */
  readonly brandReport = computed(() => this.brandState()?.report ?? null);

  constructor() {
    const options = inject(AVE_OPTIONS, { optional: true }) ?? {};
    const view = inject(DOCUMENT).defaultView;
    const browser = isPlatformBrowser(inject(PLATFORM_ID));
    this.storage = browser && options.persist !== false ? browserStorage(view) : null;
    const defaults: Preferences = {
      theme: options.theme ?? 'system',
      density: options.density ?? 'comfortable',
      motion: options.motion ?? 'system',
    };
    this.preferences = signal<Preferences>({ ...defaults, ...this.read() });
    this.theme = computed(() => this.preferences().theme);
    this.density = computed(() => this.preferences().density);
    this.motion = computed(() => this.preferences().motion);
    this.apply();

    // The last brand of this device applies at once, without the generator, while the kit still generates it alike.
    this.brandSheet = browser ? new BrandSheet(inject(DOCUMENT)) : undefined;
    const cached = this.storedBrand();
    if (cached !== undefined) {
      this.showBrand(cached);
    } else {
      // A sheet the pre-paint script adopted from a brand the kit no longer generates alike goes (ADR 0103).
      this.brandSheet?.remove();
      if (options.brand !== undefined && options.brand !== null) void this.setBrand(options.brand);
    }

    if (this.storage !== null && view !== null) {
      const storage = this.storage;
      const follow = (event: StorageEvent) => {
        if (event.storageArea !== storage) return;
        if (event.key === null || event.key === brandStorageKey) this.followBrand(event.newValue);
        if (event.key !== null && event.key !== storageKey) return;
        this.preferences.set({ ...defaults, ...parsePreferences(event.newValue) });
        this.apply();
      };
      view.addEventListener('storage', follow);
      inject(DestroyRef).onDestroy(() => {
        view.removeEventListener('storage', follow);
      });
    }
  }

  /** Sets the theme, writes `data-theme` and keeps the choice. */
  setTheme(theme: AveThemePreference): void {
    this.choose({ theme });
  }

  /** Sets the density, writes `data-density` and keeps the choice. */
  setDensity(density: AveDensity): void {
    this.choose({ density });
  }

  /** Sets the motion preference, writes `data-motion` and keeps the choice. */
  setMotion(motion: AveMotionPreference): void {
    this.choose({ motion });
  }

  /**
   * Sets the brand: a preset's name or a `#rrggbb` colour, or `null` for the kit's or the product's own colours
   * (ADR 0089). The generator loads the first time a device needs it; its stylesheet is kept for the next visit and
   * shared across tabs. Resolves with what the generator adapted, and rejects an input that is neither.
   */
  async setBrand(input: AveBrandInput | null): Promise<AveBrandReport | null> {
    const request = ++this.brandRequest;
    if (input === null) {
      this.brandSheet?.remove();
      this.brandState.set(null);
      this.write(brandStorageKey, null);
      return null;
    }
    if (!isBrandInput(input))
      throw new Error(`AveTheme.setBrand: ${String(input)} is neither a preset nor a #rrggbb colour`);
    const cached = this.storedBrand();
    if (cached?.input === input) {
      this.showBrand(cached);
      return cached.report;
    }
    const { generateAveBrand } = await import('@avelune/tokens/brand');
    const brand = generateAveBrand(input);
    const stored: StoredBrand = { input, fingerprint: brand.fingerprint, css: brand.css, report: brand.report };
    // A later call won while the generator loaded.
    if (request !== this.brandRequest) return stored.report;
    this.showBrand(stored);
    this.write(brandStorageKey, JSON.stringify(stored));
    return stored.report;
  }

  private choose(change: Partial<Preferences>): void {
    this.preferences.update((preferences) => ({ ...preferences, ...change }));
    this.apply();
    this.write(storageKey, JSON.stringify(this.preferences()));
  }

  private write(key: string, value: string | null): void {
    try {
      if (value === null) this.storage?.removeItem(key);
      else this.storage?.setItem(key, value);
    } catch {
      // Storage is full or blocked: the choice lasts for this visit.
    }
  }

  /** The brand kept on this device, while the kit generates it alike (the same fingerprint). */
  private storedBrand(): StoredBrand | undefined {
    try {
      const stored = parseStoredBrand(this.storage?.getItem(brandStorageKey) ?? null);
      return stored?.fingerprint === aveBrandFingerprint ? stored : undefined;
    } catch {
      return undefined;
    }
  }

  private showBrand(brand: StoredBrand): void {
    this.brandSheet?.apply(brand.css);
    this.brandState.set(brand);
  }

  /** Another tab set or cleared the brand. */
  private followBrand(json: string | null): void {
    const brand = parseStoredBrand(json);
    this.brandRequest++;
    if (brand?.fingerprint === aveBrandFingerprint) {
      this.showBrand(brand);
    } else {
      this.brandSheet?.remove();
      this.brandState.set(null);
    }
  }

  private read(): Partial<Preferences> {
    try {
      return parsePreferences(this.storage?.getItem(storageKey) ?? null);
    } catch {
      return {};
    }
  }

  private apply(): void {
    const { theme, density, motion } = this.preferences();
    this.attribute('data-theme', theme === 'system' ? null : theme);
    this.attribute('data-density', density === 'compact' ? density : null);
    this.attribute('data-motion', motion === 'reduced' ? motion : null);
  }

  private attribute(name: string, value: string | null): void {
    if (value === null) this.root.removeAttribute(name);
    else this.root.setAttribute(name, value);
  }
}
