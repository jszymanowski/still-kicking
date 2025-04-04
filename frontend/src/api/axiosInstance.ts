import axios from "axios";

import { API_URL } from "@/config/environment";
import { tokenStore } from "@/context/token-store";

type Primitive = string | number | boolean | null | undefined;

type CamelCaseKeys<T> = T extends Primitive
  ? T
  : T extends Array<infer U>
    ? Array<CamelCaseKeys<U>>
    : {
        [K in keyof T as K extends string
          ? `${Uncapitalize<K extends `${infer F}_${infer R}` ? `${F}${Capitalize<R>}` : K>}`
          : never]: CamelCaseKeys<T[K]>;
      };

function toCamelCase(snakeStr: string): string {
  return snakeStr.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function toCamelCaseKeys<T>(obj: T): CamelCaseKeys<T> {
  if (Array.isArray(obj)) {
    return obj.map((item) => toCamelCaseKeys(item)) as CamelCaseKeys<T>;
  } else if (obj && typeof obj === "object") {
    return Object.keys(obj).reduce(
      (acc, key) => {
        const camelKey = toCamelCase(key);
        // biome-ignore lint/suspicious/noExplicitAny: any is needed to support dynamic keys
        (acc as any)[camelKey] = toCamelCaseKeys((obj as any)[key]);
        return acc;
      },
      {} as CamelCaseKeys<T>,
    );
  }
  return obj as CamelCaseKeys<T>;
}

const axiosInstance = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 15_000,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use((config) => {
  const token = tokenStore.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => {
    response.data = toCamelCaseKeys(response.data);
    return response;
  },
  (error) => {
    // Handle errors globally
    return Promise.reject(error.response?.data || error.message);
  },
);

export default axiosInstance;
