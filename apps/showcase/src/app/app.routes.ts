import type { Routes } from '@angular/router';
import { ContractPage, contractTitle } from './contract';
import { ContractForm } from './contract-form';
import { ContractsPage } from './contracts';
import { SettingsPage } from './settings';
import { TemplateEditor } from './template-editor';

/** The showcase's screens; the invariants find each one through the links of the application bar and the register. */
export const routes: Routes = [
  { path: '', component: ContractForm, title: 'Новый договор · Avelune' },
  { path: 'contracts', component: ContractsPage, title: 'Договоры · Avelune' },
  { path: 'contracts/:id', component: ContractPage, title: contractTitle },
  { path: 'templates', component: TemplateEditor, title: 'Шаблон договора поставки · Avelune' },
  { path: 'settings', component: SettingsPage, title: 'Настройки · Avelune' },
  { path: '**', redirectTo: '' },
];
