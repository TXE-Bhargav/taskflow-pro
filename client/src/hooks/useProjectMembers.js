// hooks/useProjectMembers.js
// Fetches members of a project — used for the assignee picker

import { useQuery } from '@tanstack/react-query';
import { projectService } from '../services/project.service';

const useProjectMembers = (projectId) => {
  const { data: members = [], isLoading } = useQuery({
    queryKey: ['project-members', projectId],
    queryFn: () => projectService.getMembers(projectId),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // 5 min — members don't change often
  });

  return { members, isLoading };
};

export default useProjectMembers;