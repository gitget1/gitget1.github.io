import { AxiosError } from "axios";
import { UseMutationOptions, QueryKey, UseQueryOptions} from "@tanstack/react-query";

type ResponseError = AxiosError<{
  statusCode: string;
  message: string;
  error: string;
}>;

type UseMutationCustomOptions<TData = unknown, TVariables = unknown> = Omit<
  UseMutationOptions<TData, ResponseError, TVariables, unknown>,
  'mutationFn'
  >;

type UseQueryCustomOptions<TQueryFnData = unknown, TData = TQueryFnData> = Omit<
  UseQueryOptions<TQueryFnData, ResponseError, TData, QueryKey>,
  'queryKey'
  >;

  export type {ResponseError, UseMutationCustomOptions, UseQueryCustomOptions}