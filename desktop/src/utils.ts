export const filterFloat = (value: string) =>
    /^(-|\+)?([0-9]+(\.[0-9]+)?)$/.test(value.replace(",", "."))
      ? Number(value.replace(",", "."))
      : NaN;
  