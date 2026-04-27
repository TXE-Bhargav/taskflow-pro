import Sidebar from './Sidebar';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

const Layout = ({ children }) => {
  const { data: workspaces = [] } = useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const res = await api.get('/workspaces');
      if (Array.isArray(res.data)) return res.data;
      if (Array.isArray(res.data?.data)) return res.data.data;
      return [];
    }
  });

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar workspaces={Array.isArray(workspaces) ? workspaces : []} />
      {/* ml-60 matches sidebar width exactly */}
      <main className="flex-1 ml-60 min-h-screen">
        <div className="max-w-7xl mx-auto px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;