export function isNotNull(value: any): boolean {
  return value !== undefined && value !== null;
}

export function isNotNaN(value: any): boolean {
  return value !== 'NaN' && !isNaN(value);
}

export function isNull(value: any): boolean {
  return value === undefined || value === null;
}

export function isEmptyObject(obj: any): boolean {
  if (!obj) {
    return true;
  }

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      return false;
    }
  }

  return true;
}

export function isNotEmptyObject(obj: any): boolean {
  return !isEmptyObject(obj);
}

export function isEmptyString(str: string): boolean {
  return str === undefined || str === null || str.trim().length === 0;
}

export function isNotEmptyString(str: string): boolean {
  return !isEmptyString(str);
}

export function capitalizeString(value: string): string {
  return value
    ? value
        .split(' ')
        .map((strPart) => {
          return strPart.charAt(0).toUpperCase() + strPart.slice(1);
        })
        .join(' ')
    : null;
}

export function isTouchScreen(): boolean {
  return window.ontouchstart !== undefined;
}

export function isTouchEvent(event: any): boolean {
  return event.touches !== undefined;
}

export function moveArrayItem(arr: any[], fromIndex: number, toIndex: number): void {
  const item = arr[fromIndex];
  arr.splice(fromIndex, 1);
  arr.splice(toIndex, 0, item);
}
