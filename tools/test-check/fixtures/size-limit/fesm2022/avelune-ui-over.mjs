// An entry point bundle larger than its 10 B budget once minified and compressed.
export const labels = {
  save: 'Hujjatni saqlash',
  draft: 'Сохранить как черновик',
  export: 'Export to PDF',
};
export function label(key) {
  return labels[key] ?? key;
}
