import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters } from '@angular/cdk/testing';
import type { AveAvatarKind, AveAvatarSize } from '@avelune/ui/avatar';

/**
 * Filters for {@link AveAvatarHarness}.
 *
 * @alpha
 */
export interface AveAvatarHarnessFilters extends BaseHarnessFilters {
  /** Only match avatars of this name, or whose name matches this pattern. */
  name?: string | RegExp;
}

/**
 * Harness for `<ave-avatar>` from `@avelune/ui/avatar`.
 *
 * @alpha
 */
export class AveAvatarHarness extends ComponentHarness {
  /** Selector that finds kit avatars. */
  static hostSelector = 'ave-avatar';

  /** Gets a predicate that matches avatars by the given filters. */
  static with(options: AveAvatarHarnessFilters = {}): HarnessPredicate<AveAvatarHarness> {
    return new HarnessPredicate(AveAvatarHarness, options).addOption('name', options.name, (harness, name) =>
      HarnessPredicate.stringMatches(harness.getName(), name),
    );
  }

  /** Gets the name assistive technology hears, or `null` for a decorative avatar. */
  async getName(): Promise<string | null> {
    return (await this.host()).getAttribute('aria-label');
  }

  /** Gets the initials, which show while no photo does. */
  async getInitials(): Promise<string> {
    return (await (await this.locatorFor('.initials')()).text()).trim();
  }

  /** Whether a photo has loaded and covers the initials. */
  async isPhotoShown(): Promise<boolean> {
    return (await (await this.host()).getAttribute('data-photo')) !== null;
  }

  /** Gets the kind: a person or an organisation. */
  async getKind(): Promise<AveAvatarKind> {
    return (await (await this.host()).getAttribute('data-kind')) === 'organization' ? 'organization' : 'person';
  }

  /** Gets the size. */
  async getSize(): Promise<AveAvatarSize> {
    const size = await (await this.host()).getAttribute('data-size');
    return size === 'sm' || size === 'lg' ? size : 'md';
  }
}
