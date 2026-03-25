import { useContext } from 'react';
import GlobalContext from '../context/GlobalContext';
import UseAxiosPrivate from './UseAxiosPrivate';

const useRefreshToken = () => {
  const { setAuth } = useContext(GlobalContext);
  const axiosPrivate = UseAxiosPrivate();

  const refresh = async () => {
    const response = await axiosPrivate.get('/api/auth/refresh', {
      withCredentials: true,
    });
    setAuth((prev) => {
      console.log(JSON.stringify(prev));
      console.log(response.data.accessToken);
      return {
        ...prev,
        accessToken: response.data.accessToken,
      };
    });
    return response.data.accessToken;
  };
  return refresh;
};

export default useRefreshToken;
