import axios from "./axios";

const setSession = (accessToken: string | null | undefined): void => {
  if (accessToken) {
    axios.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
  } else {
    delete axios.defaults.headers.common.Authorization;
  }
};

export { setSession };
