import type { Direction } from '@wix/editor-react-types';

export type MegaNavProps = {
  id: string;
  className?: string;
  direction?: Direction;
};

export const defaultProps = {} as const satisfies Omit<MegaNavProps, 'id' | 'className'>;
