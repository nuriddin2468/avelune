// The native elements the kit replaces, and the kit attributes that turn each into a kit element. This is the single
// list behind avelune/no-raw-elements for consumers. When a component that enhances a native element lands, add its
// attribute here in the same merge request (ARCHITECTURE.md, "Adding an entry point").
import type { RawElementMarkers } from './rules/no-raw-elements.ts';

export const kitElements = {
  button: [],
  input: [],
  select: [],
  textarea: [],
  dialog: [],
} as const satisfies RawElementMarkers;
