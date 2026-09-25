import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters, type TestElement } from '@angular/cdk/testing';

/**
 * Filters for {@link AveFileUploadHarness}.
 *
 * @alpha
 */
export interface AveFileUploadHarnessFilters extends BaseHarnessFilters {
  /** Only match file uploads that list a file of this name, or one matching this pattern. */
  fileName?: string | RegExp;
}

/**
 * A file the field did not take, as its row shows it.
 *
 * @alpha
 */
export interface AveRejectedFileRow {
  /** The file's name. */
  readonly name: string;
  /** Why the field did not take it, in the locale's words. */
  readonly reason: string;
}

/**
 * Harness for `<ave-file-upload>` from `@avelune/ui/file-upload`: its button, its zone and its list of files. Files
 * are chosen through the system's dialog or dropped, which a harness cannot do; tests set the files on the field's
 * `input[type=file]` or dispatch a `drop` on its zone.
 *
 * @alpha
 */
export class AveFileUploadHarness extends ComponentHarness {
  /** Selector that finds kit file uploads. */
  static hostSelector = 'ave-file-upload';

  private readonly button = this.locatorFor('.choose');
  private readonly zone = this.locatorFor('.zone');
  private readonly taken = this.locatorForAll('.file:not([data-rejected])');
  private readonly rejected = this.locatorForAll('.file[data-rejected]');
  private readonly removeButtons = this.locatorForAll('.remove');

  /** Gets a predicate that matches file uploads by the given filters. */
  static with(options: AveFileUploadHarnessFilters = {}): HarnessPredicate<AveFileUploadHarness> {
    return new HarnessPredicate(AveFileUploadHarness, options).addOption(
      'fileName',
      options.fileName,
      async (harness, name) => {
        const names = await harness.getFileNames();
        return (await Promise.all(names.map((file) => HarnessPredicate.stringMatches(file, name)))).includes(true);
      },
    );
  }

  /** Gets the names of the files taken, in order. */
  async getFileNames(): Promise<string[]> {
    return Promise.all((await this.taken()).map(async (row) => this.textOf(row, '.name')));
  }

  /** Gets the sizes of the files taken, as the list writes them ("2,4 МБ"). */
  async getFileSizes(): Promise<string[]> {
    return Promise.all((await this.taken()).map(async (row) => this.textOf(row, '.meta')));
  }

  /** Gets the files the field did not take, with the reasons. */
  async getRejected(): Promise<AveRejectedFileRow[]> {
    return Promise.all(
      (await this.rejected()).map(async (row) => ({
        name: await this.textOf(row, '.name'),
        reason: await this.textOf(row, '.reason'),
      })),
    );
  }

  /** Removes a file from the list, taken or not, with its remove button. */
  async removeFile(name: string): Promise<void> {
    // Rows and their remove buttons are in the same order: the files taken, then the others.
    const rows = [...(await this.taken()), ...(await this.rejected())];
    const names = await Promise.all(rows.map(async (row) => this.textOf(row, '.name')));
    const button = (await this.removeButtons())[names.indexOf(name)];
    if (button === undefined) throw new Error(`AveFileUploadHarness: the list has no file named "${name}".`);
    await button.click();
  }

  /** Gets the words of the button ("Выбрать файлы"). */
  async getButtonText(): Promise<string> {
    return (await (await this.button()).text()).trim();
  }

  /** Whether files are being dragged over the zone. */
  async isDragging(): Promise<boolean> {
    return (await (await this.zone()).getAttribute('data-dragging')) === 'true';
  }

  /** Whether the field is disabled. */
  async isDisabled(): Promise<boolean> {
    return (await this.button()).getProperty<boolean>('disabled');
  }

  /** Whether the field shows as invalid (`aria-invalid="true"` on its button). */
  async isInvalid(): Promise<boolean> {
    return (await (await this.button()).getAttribute('aria-invalid')) === 'true';
  }

  /** Whether a file is required: the button is described as required. */
  async isRequired(): Promise<boolean> {
    const ids = (await (await this.button()).getAttribute('aria-describedby')) ?? '';
    return ids.split(' ').some((id) => id.endsWith('-required'));
  }

  /** Focuses the button. */
  async focus(): Promise<void> {
    await (await this.button()).focus();
  }

  /** Blurs the button, which marks a form control touched. */
  async blur(): Promise<void> {
    await (await this.button()).blur();
  }

  /** The text of a row's name, or of its size or reason, which follows the name. */
  private async textOf(row: TestElement, part: '.name' | '.meta' | '.reason'): Promise<string> {
    return (await row.text({ exclude: part === '.name' ? '.meta' : '.name' })).trim();
  }
}
