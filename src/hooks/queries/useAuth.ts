// import {
//   useMutation,
//   useQuery,
//   UseQueryOptions,
//   QueryKey,
//   queryOptions,
//   MutationFunction,
// } from '@tanstack/react-query';
// import {
//   getAccessToken,
//   postLogin,
//   postSignup,
//   getProfile,
//   logout,
//   kakaoLogin,
//   ResponseToken,
// } from '../../api/auth';
// import {
//   setEncryptStorage,
//   removeEncryptStorage,
// } from '../../utils/encryptStorage';
// import {
//   UseMutationCustomOptions,
//   UseQueryCustomOptions,
//   ResponseError,
// } from '../../types/common';
// import {removeHeader, setHeader} from '../../utils/header';
// import {useEffect} from 'react';
// import queryClient from '../../api/queryClient';
// import {numbers, queryKey, storageKeys} from '../../constants';

// function useSignup(mutationOptions?: UseMutationCustomOptions) {
//   return useMutation({
//     mutationFn: postSignup,
//     ...mutationOptions,
//   });
// }

// function useLogin<T>(
//   loginAPI: MutationFunction<ResponseToken, T>,
//   mutationOptions?: UseMutationCustomOptions,
// ) {
//   return useMutation({
//     mutationFn: loginAPI,
//     onSuccess: ({accessToken, refreshToken}) => {
//       setEncryptStorage(storageKeys.REFRESH_TOKEN, refreshToken);
//       setHeader('Authorization', `Bearer ${accessToken}`);
//     },
//     onSettled: () => {
//       queryClient.refetchQueries({
//         queryKey: [queryKey.AUTH, queryKey.GET_ACCESS_TOKEN],
//       });
//       queryClient.invalidateQueries({
//         queryKey: [queryKey.AUTH, queryKey.GET_PROFILE],
//       });
//     },
//     ...mutationOptions,
//   });
// }

// function useEmailLogin(mutationOptions?: UseMutationCustomOptions) {
//   return useLogin(postLogin, mutationOptions);
// }

// function useKaKaoLogin(mutationOptions?: UseMutationCustomOptions) {
//   return useLogin(kakaoLogin, mutationOptions);
// }

// function useGetRefreshToken() {
//   const {isSuccess, data, isError} = useQuery({
//     queryKey: [queryKey.AUTH, queryKey.GET_ACCESS_TOKEN],
//     queryFn: getAccessToken,
//     staleTime: numbers.ACCESS_TOKEN_REFRESH_TIME,
//     refetchInterval: numbers.ACCESS_TOKEN_REFRESH_TIME,
//     refetchOnReconnect: true,
//     refetchIntervalInBackground: true,
//   });

//   useEffect(() => {
//     if (isSuccess) {
//       setHeader('Authorization', `Bearer ${data.accessToken}`);
//       setEncryptStorage(storageKeys.REFRESH_TOKEN, data.refreshToken);
//     }
//   }, [isSuccess]);

//   useEffect(() => {
//     if (isError) {
//       removeHeader('Authorization');
//       removeEncryptStorage(storageKeys.REFRESH_TOKEN);
//     }
//   }, [isError]);

//   return {isSuccess, isError};
// }

// function useGetProfile(queryOptions?: UseQueryCustomOptions) {
//   return useQuery({
//     queryKey: [queryKey.AUTH, queryKey.GET_PROFILE],
//     queryFn: getProfile,
//     ...queryOptions,
//   });
// }

// function useLogout(mutationOptions?: UseMutationCustomOptions) {
//   return useMutation({
//     mutationFn: logout,
//     onSuccess: () => {
//       removeHeader('Authorization');
//       removeEncryptStorage(storageKeys.REFRESH_TOKEN);
//     },
//     onSettled: () => {
//       queryClient.invalidateQueries({queryKey: [queryKey.AUTH]});
//     },
//     ...mutationOptions,
//   });
// }
// function useAuth() {
//   const signupMutation = useSignup();
//   const refreshTokenQuery = useGetRefreshToken();
//   const getProfileQuery = useGetProfile({
//     enabled: refreshTokenQuery.isSuccess,
//   });
//   const isLogin = getProfileQuery.isSuccess;
//   const loginMutation = useEmailLogin();
//   const kakaoLoginMutation = useKaKaoLogin();
//   const logoutMutation = useLogout();

//   return {
//     signupMutation,
//     loginMutation,
//     isLogin,
//     getProfileQuery,
//     logoutMutation,
//     kakaoLoginMutation,
//   };
// }

// export default useAuth;
