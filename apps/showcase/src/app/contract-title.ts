import type { ResolveFn } from '@angular/router';
import { contracts, type ContractRecord } from './data';

/** The contract a route's `:id` names, if the register holds it. */
export function contractOf(id: string | undefined): ContractRecord | undefined {
  return contracts.find((contract) => String(contract.id) === id);
}

/**
 * The contract page's title: the contract's number, or that it was not found. It lives apart from the page, so the
 * routes resolve it without loading the page's code.
 */
export const contractTitle: ResolveFn<string> = (route) => {
  const contract = contractOf(route.paramMap.get('id') ?? undefined);
  return `${contract === undefined ? 'Договор не найден' : `Договор ${contract.number}`} · Avelune`;
};
