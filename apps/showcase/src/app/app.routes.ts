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
    loadComponent: () => import('./settings').then((m) => m.SettingsScreen),
    title: 'Настройки · Avelune',
    children: [
      { path: '', loadComponent: () => import('./settings').then((m) => m.SettingsIndex) },
      {
        path: 'profile',
        loadComponent: () => import('./settings-profile').then((m) => m.ProfileSection),
        title: 'Профиль · Настройки · Avelune',
      },
      {
        path: 'appearance',
        loadComponent: () => import('./settings-appearance').then((m) => m.AppearanceSection),
        title: 'Оформление · Настройки · Avelune',
      },
      {
        path: 'brand',
        loadComponent: () => import('./settings-brand').then((m) => m.BrandSection),
        title: 'Бренд организации · Настройки · Avelune',
      },
      {
        path: 'notifications',
        loadComponent: () => import('./settings-notifications').then((m) => m.NotificationsSection),
        title: 'Уведомления · Настройки · Avelune',
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
