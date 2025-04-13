const queryKey = {
  AUTH: 'auth',
  GET_ACCESS_TOKEN: 'getAccessToken',
  GET_PROFILE: 'getProfile',
  GET_CALENDAR_POSTS: 'getCalendarPosts',
  POST: 'post',
}as const;

const storageKeys = {
  REFRESH_TOKEN: 'refreshToken',
} as const ;
export {queryKey, storageKeys}