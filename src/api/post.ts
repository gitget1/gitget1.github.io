import axiosInstance from "./axios";

type CalendarPost = {
  id: number;
  title:string;
  address:string;
}


type ResponseCalendarPost = Record<number, CalendarPost[]>


const getCalendarPosts = async(year:number, month:number):Promise<ResponseCalendarPost> => {
  const {data} = await axiosInstance.get(`/post?year=${year}&month=${month}`);

  return data;
}
export {
  getCalendarPosts,
};

export type {
  ResponseCalendarPost,
  CalendarPost,
}
