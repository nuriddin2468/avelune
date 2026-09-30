import { Component, computed, signal } from '@angular/core';
import { lucideBuilding, lucideNetwork } from '@avelune/icons/lucide';
import { AveAvatar } from '@avelune/ui/avatar';
import { AveBadge } from '@avelune/ui/badge';
import { AveCard, AveCardEnd, AveCardTitle } from '@avelune/ui/card';
import { AveEmptyState } from '@avelune/ui/empty-state';
import { provideAveIcons } from '@avelune/ui/icon';
import { AveListDetail, AveListDetailDetail, AveListDetailList } from '@avelune/ui/list-detail';
import { AveTree, type AveTreeNode } from '@avelune/ui/tree';

/** A department of the organisation, as the directory keeps it. */
interface Department {
  readonly id: string;
  readonly name: string;
  readonly head: string;
  readonly phone: string;
  readonly staff: readonly { readonly name: string; readonly role: string }[];
  readonly children?: readonly Department[];
}

const organisation: Department = {
  id: 'board',
  name: 'Правление',
  head: 'Рустам Назаров',
  phone: '+998 71 200 10 00',
  staff: [
    { name: 'Рустам Назаров', role: 'Председатель правления' },
    { name: 'Дилноза Султанова', role: 'Помощник председателя' },
  ],
  children: [
    {
      id: 'legal',
      name: 'Юридический департамент',
      head: 'Азиза Каримова',
      phone: '+998 71 200 10 20',
      staff: [
        { name: 'Азиза Каримова', role: 'Директор департамента' },
        { name: 'Oʻktam Aliyev', role: 'Ведущий юрист' },
      ],
      children: [
        {
          id: 'contracts',
          name: 'Отдел договоров',
          head: 'Бахтиёр Рахимов',
          phone: '+998 71 200 10 21',
          staff: [
            { name: 'Бахтиёр Рахимов', role: 'Начальник отдела' },
            { name: 'Нилуфар Юсупова', role: 'Юрист' },
            { name: 'Жасур Тошматов', role: 'Юрист' },
          ],
        },
        {
          id: 'claims',
          name: 'Отдел претензионной работы',
          head: 'Сардор Ахмедов',
          phone: '+998 71 200 10 22',
          staff: [{ name: 'Сардор Ахмедов', role: 'Начальник отдела' }],
        },
      ],
    },
    {
      id: 'finance',
      name: 'Финансовый департамент',
      head: 'Малика Хасанова',
      phone: '+998 71 200 10 30',
      staff: [{ name: 'Малика Хасанова', role: 'Директор департамента' }],
      children: [
        {
          id: 'accounting',
          name: 'Бухгалтерия',
          head: 'Гульнора Абдуллаева',
          phone: '+998 71 200 10 31',
          staff: [
            { name: 'Гульнора Абдуллаева', role: 'Главный бухгалтер' },
            { name: 'Шахзод Каримов', role: 'Бухгалтер' },
          ],
        },
      ],
    },
  ],
};

function node(department: Department, top: boolean): AveTreeNode<string> {
  return {
    value: department.id,
    label: department.name,
    ...(top ? { icon: 'building' as const, expanded: true } : {}),
    ...(department.children === undefined ? {} : { children: department.children.map((child) => node(child, false)) }),
  };
}

function find(department: Department, id: string): Department | undefined {
  if (department.id === id) return department;
  for (const child of department.children ?? []) {
    const found = find(child, id);
    if (found !== undefined) return found;
  }
  return undefined;
}

/**
 * The organisation's departments on the kit's list–detail page (ADR 0096): the tree of departments beside the chosen
 * one's card, with its head, its telephone and its staff; on a phone the tree, then the card.
 */
@Component({
  selector: 'ave-showcase-departments',
  imports: [
    AveAvatar,
    AveBadge,
    AveCard,
    AveCardEnd,
    AveCardTitle,
    AveEmptyState,
    AveListDetail,
    AveListDetailDetail,
    AveListDetailList,
    AveTree,
  ],
  providers: [provideAveIcons([lucideBuilding, lucideNetwork])],
  template: `
    <ave-list-detail
      heading="Подразделения"
      description="Структура организации и сотрудники подразделений."
      backLabel="Все подразделения"
      [(detail)]="reading"
      (detailChange)="back($event)"
      lang="ru"
    >
      <ave-tree
        aveListDetailList
        label="Подразделения"
        [nodes]="nodes"
        [(selected)]="selected"
        (selectedChange)="reading.set(true)"
      />
      @if (department(); as chosen) {
        <ave-card aveListDetailDetail role="region" aria-labelledby="department-title">
          <h2 aveCardTitle id="department-title">{{ chosen.name }}</h2>
          <ave-badge aveCardEnd>{{ people(chosen.staff.length) }}</ave-badge>
          <dl class="facts">
            <div>
              <dt>Руководитель</dt>
              <dd>{{ chosen.head }}</dd>
            </div>
            <div>
              <dt>Телефон</dt>
              <dd class="phone">{{ chosen.phone }}</dd>
            </div>
          </dl>
          <ul class="staff" aria-label="Сотрудники">
            @for (person of chosen.staff; track person.name) {
              <li class="person">
                <ave-avatar decorative [name]="person.name" />
                <span class="who">
                  <span>{{ person.name }}</span>
                  <span class="role">{{ person.role }}</span>
                </span>
              </li>
            }
          </ul>
        </ave-card>
      } @else {
        <ave-empty-state aveListDetailDetail icon="network" heading="Выберите подразделение">
          <p>Его руководитель, телефон и сотрудники появятся здесь.</p>
        </ave-empty-state>
      }
    </ave-list-detail>
  `,
  styleUrl: './departments.css',
})
export class DepartmentsPage {
  protected readonly nodes = [node(organisation, true)];
  protected readonly selected = signal<string | undefined>('contracts');
  /** Whether the chosen department shows instead of the tree, on a narrow page. */
  protected readonly reading = signal(false);
  protected readonly department = computed(() => {
    const id = this.selected();
    return id === undefined ? undefined : find(organisation, id);
  });

  /**
   * The way back to the tree on a narrow page: the choice goes, so that choosing the same department opens it again
   * (the tree tells of a new choice only).
   */
  protected back(reading: boolean): void {
    if (!reading) this.selected.set(undefined);
  }

  /** How many people, in Russian: 1 сотрудник, 2 сотрудника, 5 сотрудников. */
  protected people(count: number): string {
    const noun = { one: 'сотрудник', few: 'сотрудника', many: 'сотрудников', other: 'сотрудника' } as const;
    const form = new Intl.PluralRules('ru').select(count);
    return `${String(count)} ${form === 'zero' || form === 'two' ? noun.many : noun[form]}`;
  }
}
