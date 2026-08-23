'use client';

import { useQueryState } from 'nuqs';

/** Single owner of the `?class=` URL parameter shared by the explorer panes. */
export const useSelectedClass = () => useQueryState('class');
