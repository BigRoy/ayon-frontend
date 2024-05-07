import { ayonApi, buildOperations } from '../ayon'
import { updateNodes } from '/src/features/editor'

const invalidateTag = ({ ids, type, disabledInvalidation, data }) => {
  // don't invalidate if disabled
  if (disabledInvalidation) return []

  const baseTags = [...ids.map((id) => ({ type, id })), { type: 'kanBanTask', id: 'TASKS' }]

  // if the change was a status change, invalidate the activity query of the entity
  if ('status' in data) {
    const getActivitiesTags = ids.map((id) => ({ type: 'entityActivities', id }))
    baseTags.push(...getActivitiesTags)
  }
  return baseTags
}

const updateEntity = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    updateEntitiesDetails: build.mutation({
      query: ({ projectName, type, patches, data, ids }) => ({
        url: `/api/projects/${projectName}/operations`,
        method: 'POST',
        body: {
          operations: buildOperations(ids || patches.map((p) => p.id), type, data),
        },
      }),
      invalidatesTags: (result, error, args) => result && invalidateTag(args),
      async onQueryStarted(
        { projectName, type, patches, data, ids },
        { dispatch, queryFulfilled },
      ) {
        if (!patches) return

        const patchResult = dispatch(
          ayonApi.util.updateQueryData(
            'getEntitiesDetails',
            { projectName, ids: ids, type },
            (draft) => {
              Object.assign(
                draft,
                patches.map((p) => ({ node: p })),
              )
            },
          ),
        )

        try {
          const result = await queryFulfilled

          if (result.data?.success === false) {
            throw new Error('Failed to update entities')
          }

          // update editor only if success
          dispatch(updateNodes({ updated: patches.map((p) => ({ id: p.id, ...data })) }))
        } catch {
          patchResult.undo()
        }
      },
    }),
  }),
})

export const { useUpdateEntitiesDetailsMutation } = updateEntity
