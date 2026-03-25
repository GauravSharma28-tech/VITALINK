import Dashboard from './components/Dashboard';
import CattleList from './components/Livestock/CattleList';
import Nav from './components/Nav';
import TopNav from './components/TopNav';
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from 'react-router-dom';
import ContextWrapper from './context/ContextWrapper';
import Login from './components/Login';
import RequireAuth from './components/RequireAuth';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import MapPage from './components/Map/MapPage';
import GeoFencePage from './components/GeoFence/GeoFencePage';
import Profile from './components/Profile';
import AddCattleForm from './components/Livestock/AddCattleForm';
import Settings from './components/Settings/Settings';
import EditCattleForm from './components/Livestock/EditCattleForm';
import CattleCard from './components/Livestock/CattleCard';
import DeleteConformation from './components/Livestock/DeleteConformation';
import { NotificationProvider } from './context/NotificationContext';
import { SocketProvider } from './context/SocketContext';
import AlertScreen from './components/AlertScreen';
import UserManagement from './components/UserManagement';
import { useContext } from 'react';
import GlobalContext from './context/GlobalContext';
import Configure from './components/ReceiverConfig/Configure';
import AddConfigForm from './components/ReceiverConfig/AddConfigForm';
import ConfigPage from './components/ReceiverConfig/ConfigPage';

// Role-based route component
const RequireAdmin = () => {
  const { auth } = useContext(GlobalContext);

  if (auth.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

function App() {
  return (
    <>
      <BrowserRouter>
        <ContextWrapper>
          <div className="flex w-full h-screen">
            <Routes>
              <Route path="/login" element={<Login />} />

              <Route
                element={
                  <NotificationProvider>
                    <SocketProvider>
                      <div className="fixed left-0 top-0 h-full z-20">
                        <Nav />
                      </div>
                      <div className="flex flex-col w-full ml-64 bg-gray-100">
                        <TopNav />
                        <div className="h-11/12 relative overflow-auto">
                          <Outlet />
                        </div>
                      </div>
                    </SocketProvider>
                  </NotificationProvider>
                }>
                <Route element={<RequireAuth />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/livestock" element={<CattleList />}>
                    <Route path="add-cattle" element={<AddCattleForm />} />
                    <Route
                      path="edit-cattle/:cattleId"
                      element={<EditCattleForm />}
                    />
                    <Route path=":cattleId" element={<CattleCard />} />
                    <Route
                      path="delete-cattle/:cattleId"
                      element={<DeleteConformation />}
                    />
                  </Route>
                  <Route path="/map" element={<MapPage />} />
                  <Route path="/geo-fence" element={<GeoFencePage />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/configure" element={<ConfigPage />} />
                  <Route path="/configure-add" element={<AddConfigForm />} />
                  <Route path="/alerts" element={<AlertScreen />} />
                  <Route path="/alerts/:id" element={<AlertScreen />} />

                  {/* Admin-only routes */}
                  <Route element={<RequireAdmin />}>
                    <Route
                      path="/user-management"
                      element={<UserManagement />}
                    />
                  </Route>
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </div>
        </ContextWrapper>
      </BrowserRouter>
      <ToastContainer />
    </>
  );
}

export default App;
