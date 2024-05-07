import { ayonApi } from '../ayon'

const updateProject = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    createProject: build.mutation({
      query: ({ name, code, anatomy, library }) => ({
        url: `/api/projects`,
        method: 'POST',
        body: {
          name,
          code,
          anatomy,
          library,
        },
      }),
      transformErrorResponse: (error) => error.data.detail || `Error ${error.status}`,
      async onQueryStarted({ ...patch }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          ayonApi.util.updateQueryData('getAllProjects', undefined, (draft) => {
            const newProject = { name: patch.name, code: patch.code, library: patch.library }
            draft.push(newProject)
          }),
        )
        try {
          await queryFulfilled
        } catch {
          patchResult.undo()
        }
      },
      invalidatesTags: () => ['projects', 'kanBanTask'],
    }),
    deleteProject: build.mutation({
      query: ({ projectName }) => ({
        url: `/api/projects/${projectName}`,
        method: 'DELETE',
      }),
      invalidatesTags: () => ['projects'],
    }),
    updateProjectAnatomy: build.mutation({
      query: ({ projectName, anatomy }) => ({
        url: `/api/projects/${projectName}/anatomy`,
        method: 'POST',
        body: anatomy,
      }),
      invalidatesTags: (result, error, { projectName }) =>
        error ? [] : [{ type: 'project', id: projectName }],
    }),
    updateProject: build.mutation({
      query: ({ projectName, update }) => ({
        url: `/api/projects/${projectName}`,
        method: 'PATCH',
        body: update,
      }),
      invalidatesTags: (result, error, { projectName, update }) =>
        error
          ? []
          : 'active' in update
          ? // if active is updated, invalidate all projects
            [{ type: 'project' }]
          : // if not, invalidate only the updated project
            [{ type: 'project', id: projectName }],
    }),
  }),
})

export const {
  useCreateProjectMutation,
  useDeleteProjectMutation,
  useUpdateProjectAnatomyMutation,
  useUpdateProjectMutation,
} = updateProject
