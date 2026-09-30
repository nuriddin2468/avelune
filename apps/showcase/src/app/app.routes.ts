import type { Routes } from '@angular/router';
import { contractTitle } from './contract-title';

/**
 * The showcase's screens, each loaded when it is first opened, as a consumer's are, so the first screen downloads its
 * own code only; the invariants find each one through the links of the application bar and the register.
 */
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./overview').then((m) => m.OverviewPage),
    title: 'Обзор · Avelune',
  },
  {
    path: 'contracts/new',
    loadComponent: () => import('./contract-form').then((m) => m.ContractForm),
    title: 'Новый договор · Avelune',
  },
  {
    path: 'contracts',
    loadComponent: () => import('./contracts').then((m) => m.ContractsPage),
    title: 'Договоры · Avelune',
  },
  {
    path: 'contracts/:id',
    loadComponent: () => import('./contract').then((m) => m.ContractPage),
    title: contractTitle,
  },
  {
    path: 'templates',
    loadComponent: () => import('./template-editor').then((m) => m.TemplateEditor),
    title: 'Шаблон договора поставки · Avelune',
  },
  {
    path: 'departments',
    loadComponent: () => import('./departments').then((m) => m.DepartmentsPage),
    title: 'Подразделения · Avelune',
  },
  {
    path: 'settings',
    loadComponent: () => import('./settings').then((m) => m.SettingsPage),
    title: 'Настройки · Avelune',
  },
  { path: '**', redirectTo: '' },
];
