import { TilePadding } from './grid.types';

export function toNumber(value: string): number {
  return value ? parseInt(value, 10) : null;
}

export function toTilePadding(value: string): TilePadding {
  if (value) {
    const paddingParts = value.split(' ');

    switch (true) {
      case paddingParts.length === 1: {
        const padding = toNumber(value);

        return {
          top: padding,
          right: padding,
          bottom: padding,
          left: padding,
        };
      }

      case paddingParts.length === 2: {
        const paddingTopBottom = toNumber(paddingParts[0]);
        const paddingLeftRight = toNumber(paddingParts[1]);

        return {
          top: paddingTopBottom,
          right: paddingLeftRight,
          bottom: paddingTopBottom,
          left: paddingLeftRight,
        };
      }

      case paddingParts.length === 3: {
        const paddingTop = toNumber(paddingParts[0]);
        const paddingRight = toNumber(paddingParts[1]);
        const paddingBottom = toNumber(paddingParts[2]);

        return {
          top: paddingTop,
          right: paddingRight,
          bottom: paddingBottom,
          left: 0,
        };
      }

      case paddingParts.length === 4: {
        const paddingTop = toNumber(paddingParts[0]);
        const paddingRight = toNumber(paddingParts[1]);
        const paddingBottom = toNumber(paddingParts[2]);
        const paddingLeft = toNumber(paddingParts[3]);

        return {
          top: paddingTop,
          right: paddingRight,
          bottom: paddingBottom,
          left: paddingLeft,
        };
      }
    }
  }

  return {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  };
}
