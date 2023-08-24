export function camelCaseToStr(str: string): string {
  return str.split(/(?=[A-Z])/g).join(' ');
}

export function SNAKE_UPPERCASE_TO_STR(str: string): string {
  return str
    .toLowerCase()
    .split('_')
    .map((word) => word[0].toUpperCase() + word.substring(1))
    .join(' ');
}

export function camelCaseToSnakeLowerCase(str: string): string {
  const result = str.replace(/([A-Z])/g, ' $1');
  return result.split(' ').join('_').toLowerCase();
}

export function contentParserHandler(html: string): string {
  return html.replace(/</g, '&lt').replace(/>/g, '&gt');
}

export function domParserHandler(str: string): string {
  let parser = new DOMParser();
  let dom = parser.parseFromString(str, 'text/html');

  return dom.body.innerText;
}

export function findExtremes<T>(
  array: T[],
  targetProperty: string = null,
): { min: number; max: number } {
  const extremes = targetProperty
    ? { min: array[0][targetProperty], max: array[0][targetProperty] }
    : { min: array[0], max: array[0] };

  for (let i = 1; i < array.length; i++) {
    if (targetProperty) {
      if (array[i][targetProperty] < extremes.min) {
        extremes.min = array[i][targetProperty];
      }

      if (array[i][targetProperty] > extremes.max) {
        extremes.max = array[i][targetProperty];
      }
    } else {
      if (array[i] < extremes.min) {
        extremes.min = array[i];
      }

      if (array[i] > extremes.max) {
        extremes.max = array[i];
      }
    }
  }

  return extremes;
}
