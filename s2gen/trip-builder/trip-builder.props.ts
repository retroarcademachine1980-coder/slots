import type { Direction } from '@wix/editor-react-types';

export type TripBuilderProps = {
  id: string;
  className?: string;
  heading?: string;
  intro?: string;
  direction?: Direction;
};

export const defaultProps = {
  heading: 'Build your day out',
  intro: 'Add your stops, set your travel details and see a rough cost for the day. Your plan is saved on this device.',
} as const satisfies Omit<TripBuilderProps, 'id' | 'className'>;
