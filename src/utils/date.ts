// utils/date.ts

function getDateDetails(dateString: Date | string) {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
}

function getDateWithSeparator(dateString: Date | string, separator: string = '') {
  const { year, month, day } = getDateDetails(dateString);
  return [
    String(year),
    String(month).padStart(2, '0'),
    String(day).padStart(2, '0'),
  ].join(separator);
}

function getDateLocalFormat(dateString: Date | string) {
  const { year, month, day } = getDateDetails(dateString);
  return `${year}년 ${month}월 ${day}일`;
}

function getMonthYearDetails(initialDate: Date): MonthYear {
  const month = initialDate.getMonth() + 1;
  const year = initialDate.getFullYear();
  const startDate = new Date(`${year}-${String(month).padStart(2, '0')}-01`);
  const firstDOW = startDate.getDay();
  const lastDate = new Date(year, month, 0).getDate();
  return { month, year, startDate, firstDOW, lastDate };
}

function getNewMonthYear(prevData: MonthYear, increment: number): MonthYear {
  const newDate = new Date(prevData.startDate);
  newDate.setMonth(newDate.getMonth() + increment);
  return getMonthYearDetails(newDate);
}

type MonthYear = {
  month: number;
  year: number;
  startDate: Date;
  firstDOW: number;
  lastDate: number;
};

function isSameAsCurrentDate(year:number, month:number, date:number) {
  const currentDate = getDateWithSeparator(new Date());
  const inputDate = `${year}${String(month).padStart(2,'0')}${String(
    date,
  ).padStart(2,'0')}`;

  return currentDate === inputDate
}

export {
  getDateDetails,
  getDateWithSeparator,
  getDateLocalFormat,
  getMonthYearDetails,
  getNewMonthYear,
  isSameAsCurrentDate,
};

export type { MonthYear };
