import { Component, computed, signal } from '@angular/core';
import { lucideBuilding } from '@avelune/icons/lucide';
import { AveAvatar } from '@avelune/ui/avatar';
import { AveBadge } from '@avelune/ui/badge';
import { AveCard, AveCardEnd, AveCardTitle } from '@avelune/ui/card';
import { provideAveIcons } from '@avelune/ui/icon';
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
 * The organisation's departments: the tree of departments beside the chosen one's card, with its head, its telephone
 * and its staff.
 */
@Component({
  selector: 'ave-showcase-departments',
  imports: [AveAvatar, AveBadge, AveCard, AveCardEnd, AveCardTitle, AveTree],
  providers: [provideAveIcons([lucideBuilding])],
  template: `
    <div class="page" lang="ru">
      <header class="header">
        <h1 class="title">Подразделения</h1>
        <p class="note">Структура организации и сотрудники подразделений.</p>
      </header>
      <div class="split">
        <ave-tree class="tree" label="Подразделения" [nodes]="nodes" [(selected)]="selected" />
        @if (department(); as chosen) {
          <ave-card role="region" aria-labelledby="department-title">
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
        }
      </div>
    </div>
  `,
  styleUrl: './departments.css',
})
export class DepartmentsPage {
  protected readonly nodes = [node(organisation, true)];
  protected readonly selected = signal<string | undefined>('contracts');
  protected readonly department = computed(() => {
    const id = this.selected();
    return id === undefined ? undefined : find(organisation, id);
  });

  /** How many people, in Russian: 1 сотрудник, 2 сотрудника, 5 сотрудников. */
  protected people(count: number): string {
    const noun = { one: 'сотрудник', few: 'сотрудника', many: 'сотрудников', other: 'сотрудника' } as const;
    const form = new Intl.PluralRules('ru').select(count);
    return `${String(count)} ${form === 'zero' || form === 'two' ? noun.many : noun[form]}`;
  }
}
