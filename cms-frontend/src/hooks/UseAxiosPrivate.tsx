import { useContext, useEffect } from "react";
import { axiosPrivate } from "../services/Axios";
import GlobalContext from "../context/GlobalContext";

const UseAxiosPrivate = () => {
  // const refresh = useRefreshToken();
  const { auth, setAuth } = useContext(GlobalContext);

  useEffect(() => {
    const requestIntercept = axiosPrivate.interceptors.request.use(
      (config) => {
        // Skip attaching Authorization for refresh endpoint
        const isRefreshEndpoint = config.url?.includes('/api/auth/refresh');
        // Only attach Authorization if we actually have a token
        if (!isRefreshEndpoint && !config.headers["Authorization"] && auth?.accessToken) {
          config.headers["Authorization"] = `Bearer ${auth.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseIntercept = axiosPrivate.interceptors.response.use(
      (response) => response,
      async (error) => {
        const prevRequest = error?.config;
        const isRefreshEndpoint = prevRequest?.url?.includes('/api/auth/refresh');

        if (isRefreshEndpoint) {
          window.location.href = "/login";
          return Promise.reject(error);
        }

        // Handle both 401 (Unauthorized) and 403 (Forbidden) errors
        if (
          (error?.response?.status === 401 || error?.response?.status === 403) &&
          !prevRequest?.sent
        ) {
          prevRequest.sent = true;
          try {
            const response = await axiosPrivate.get('/api/auth/refresh', {
              withCredentials: true,
            });;
            setAuth((prev) => {
              // console.log(JSON.stringify(prev));
              // console.log(response.data.accessToken);
              return {
                ...prev,
                accessToken: response.data.accessToken,
              };
            });
            const newAccessToken = response.data.accessToken;
            prevRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
            return axiosPrivate(prevRequest);
          } catch (refreshError) {
            // If refresh fails, redirect to login
            window.location.href = "/login";
            return Promise.reject(refreshError);
          }
        }
        // if (isRefreshEndpoint) {
        //   // If refresh itself fails, force login
        //   window.location.href = "/login";
        // }
        return Promise.reject(error);
      }
    );

    return () => {
      axiosPrivate.interceptors.request.eject(requestIntercept);
      axiosPrivate.interceptors.response.eject(responseIntercept);
    };
  }, [auth]);

  return axiosPrivate;
};

export default UseAxiosPrivate;
