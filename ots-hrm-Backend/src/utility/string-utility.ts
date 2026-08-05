export const toTitleCase = (str: string): string => {
  return str.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substring(1);
  });
};

export const toCamelCase = (str: string): string => {
  return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (match, index) =>
    index === 0 ? match.toLowerCase() : match.toUpperCase()
  );
};

export const formatStringToTitleCase = (inputString: string): string => {
  let formattedString = inputString.replace(/[-_]/g, " ");

  formattedString = formattedString
    .split(" ") 
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" "); 

  return formattedString;
};

// 1 -> "1st", 2 -> "2nd", 3 -> "3rd", 4 -> "4th", 11-13 -> "11th"/"12th"/"13th" (the
// standard English exception for the teens), 21 -> "21st", etc.
export const formatOrdinal = (n: number): string => {
  const remainder100 = n % 100;
  if (remainder100 >= 11 && remainder100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1: return `${n}st`;
    case 2: return `${n}nd`;
    case 3: return `${n}rd`;
    default: return `${n}th`;
  }
};
