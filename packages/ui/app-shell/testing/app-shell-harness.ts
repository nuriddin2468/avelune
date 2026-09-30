import { ComponentHarness } from '@angular/cdk/testing';
import { AveSidebarNavHarness } from '@avelune/ui/sidebar-nav/testing';

/**
 * The logo an application shell shows, as {@link AveAppShellHarness.getLogo} reads it.
 *
 * @alpha
 */
export interface AveAppShellLogo {
  /** The address the image shows for the theme the page shows, resolved against the page. */
  readonly src: string;
  /** Its text alternative; `''` when the product's name says the same. */
  readonly alt: string;
}

/**
 * Harness for `<ave-app-shell>` from `@avelune/ui/app-shell`.
 *
 * @alpha
 */
export class AveAppShellHarness extends ComponentHarness {
  /** Selector that finds kit application shells. */
  static hostSelector = 'ave-app-shell';

  private readonly skipLink = this.locatorFor('.skip a');
  private readonly product = this.locatorFor('.home .product');
  private readonly home = this.locatorFor('.home');
  private readonly logo = this.locatorForOptional('.home img');
  private readonly menu = this.locatorForOptional('.bar > button');
  private readonly drawer = this.locatorForOptional('dialog');
  private readonly column = this.locatorForOptional('.column');
  private readonly columnNavigation = this.locatorForOptional(AveSidebarNavHarness.with({ ancestor: '.column' }));
  private readonly drawerNavigation = this.locatorForOptional(AveSidebarNavHarness.with({ ancestor: 'dialog' }));
  private readonly main = this.locatorFor('main');

  /** Gets the product's name in the bar. */
  async getProduct(): Promise<string> {
    return (await (await this.product()).text()).trim();
  }

  /** Gets where the logo and the name lead. */
  async getHome(): Promise<string | null> {
    return (await this.home()).getAttribute('href');
  }

  /** Gets the logo's source and text alternative, or `null` for a bar without a logo. */
  async getLogo(): Promise<AveAppShellLogo | null> {
    const logo = await this.logo();
    if (logo === null) return null;
    return { src: await logo.getProperty<string>('src'), alt: await logo.getProperty<string>('alt') };
  }

  /** Whether the navigation's button shows: below `breakpoint.md`, with navigation. */
  async hasNavigationButton(): Promise<boolean> {
    const menu = await this.menu();
    return menu !== null && (await menu.getCssValue('display')) !== 'none';
  }

  /** Whether the navigation stands as a column beside the page: from `breakpoint.md`, with navigation. */
  async hasNavigationColumn(): Promise<boolean> {
    const column = await this.column();
    return column !== null && (await column.getCssValue('display')) !== 'none';
  }

  /** Presses the navigation's button, which opens the drawer. */
  async openNavigation(): Promise<void> {
    const menu = await this.menu();
    if (menu === null) throw new Error('The shell has no navigation.');
    await menu.click();
  }

  /** Whether the navigation's drawer is open. */
  async isNavigationOpen(): Promise<boolean> {
    const drawer = await this.drawer();
    return drawer !== null && (await drawer.getProperty<boolean>('open'));
  }

  /** Gets the navigation people see: the column's from `breakpoint.md`, the drawer's below it. */
  async getNavigation(): Promise<AveSidebarNavHarness> {
    const navigation = (await this.hasNavigationColumn())
      ? await this.columnNavigation()
      : await this.drawerNavigation();
    if (navigation === null) throw new Error('The shell has no navigation.');
    return navigation;
  }

  /** Focuses the skip link, as the first Tab does, and follows it: focus moves to the page. */
  async skipToContent(): Promise<void> {
    const link = await this.skipLink();
    await link.focus();
    await link.click();
  }

  /** Gets the skip link's words. */
  async getSkipLinkText(): Promise<string> {
    return (await (await this.skipLink()).text()).trim();
  }

  /** Whether focus is on the page's `main`, where the skip link puts it. */
  async isMainFocused(): Promise<boolean> {
    return (await this.main()).isFocused();
  }

  /** Gets the text of the page in `main`, on one line. */
  async getMainText(): Promise<string> {
    return (await (await this.main()).text()).replace(/\s+/g, ' ').trim();
  }
}
