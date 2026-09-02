import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useSelector } from 'react-redux';
import store from './redux/store';

// Components & Pages
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import UserManagement from './pages/UserManagement';
import EnquiriesManagement from './pages/EnquiriesManagement';
import PartFinder from './pages/PartFinder';
import Dealers from './pages/Dealers';

const ProtectedLayout = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.admin);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50/50 w-full font-sans antialiased relative overflow-x-hidden">
      {/* Decorative ambient glows for design depth */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-500/5 rounded-full blur-[120px] pointer-events-none -z-10 animate-glow-pulse"></div>
      <div className="absolute bottom-0 left-1/3 w-[600px] h-[600px] bg-slate-200/40 rounded-full blur-[100px] pointer-events-none -z-10"></div>

      <Sidebar />
      <div className="flex-1 pl-64 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

const AppRoutes = () => {
  const { isAuthenticated } = useSelector((state) => state.admin);

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/users" replace /> : <Login />}
      />

      {/* Protected Routes */}
      <Route
        path="/users"
        element={
          <ProtectedLayout>
            <UserManagement />
          </ProtectedLayout>
        }
      />

      <Route
        path="/enquiries"
        element={
          <ProtectedLayout>
            <EnquiriesManagement />
          </ProtectedLayout>
        }
      />

      <Route
        path="/parts"
        element={
          <ProtectedLayout>
            <PartFinder />
          </ProtectedLayout>
        }
      />

      <Route
        path="/dealers"
        element={
          <ProtectedLayout>
            <Dealers />
          </ProtectedLayout>
        }
      />

      {/* Default Fallback */}
      <Route path="*" element={<Navigate to={isAuthenticated ? "/users" : "/login"} replace />} />
    </Routes>
  );
};

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </Provider>
  );
}

export default App;
