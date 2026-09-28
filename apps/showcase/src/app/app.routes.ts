import type { Routes } from '@angular/router';
import { ContractForm } from './contract-form';
import { ContractsPage } from './contracts';
import { SettingsPage } from './settings';

/** The showcase's screens; the invariants find each one through the links of the application bar. */
export const routes: Routes = [
  { path: '', component: ContractForm, title: 'Новый договор · Avelune' },
  { path: 'contracts', component: ContractsPage, title: 'Договоры · Avelune' },
  { path: 'settings', component: SettingsPage, title: 'Настройки · Avelune' },
  { path: '**', redirectTo: '' },
];
