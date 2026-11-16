import type { Direction } from '@wix/editor-react-types';

export type ExplorerProps = {
  id: string;
  className?: string;
  /** "map" is the live UK map page; "search" is the live search results page. */
  mode?: string;
  direction?: Direction;
};

export const defaultProps = {
  mode: 'search',
} as const satisfies Omit<ExplorerProps, 'id' | 'className'>;
