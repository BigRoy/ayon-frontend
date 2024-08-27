import api from '@api'

const updateBundles = api.injectEndpoints({
  endpoints: (build) => ({
    deleteBundle: build.mutation({
      query: ({ name }) => ({
        url: `/api/bundles/${name}`,
        method: 'DELETE',
      }),
      // optimisticUpdate bundleList to remove deleted bundle
      // eslint-disable-next-line no-unused-vars
      onQueryStarted: async ({ name, archived = true }, { dispatch, queryFulfilled }) => {
        const patchResult = dispatch(
          api.util.updateQueryData('getBundleList', { archived }, (draft) => {
            const bundleIndex = draft.findIndex((bundle) => bundle.name === name)
            draft.splice(bundleIndex, 1)
          }),
        )
        try {
          await queryFulfilled
        } catch {
          patchResult.undo()
        }
      },

      // eslint-disable-next-line no-unused-vars
      invalidatesTags: (result, error, id) => [
        { type: 'bundleList' },
        { type: 'addonList' },
        { type: 'addonSettingsList' },
      ],
    }),

    promoteBundle: build.mutation({
      query: ({ name, force = true }) => ({
        url: `/api/bundles/${name}?force=${force}`,
        method: 'POST',
        body: { action: 'promote' },
      }),
      // eslint-disable-next-line no-unused-vars
      invalidatesTags: (result, error, id) => [
        { type: 'bundleList' },
        { type: 'addonList' },
        { type: 'addonSettingsList' },
        { type: 'addonSettings' },
        { type: 'addonSettingsOverrides' },
        { type: 'marketAddon' },
      ],
    }),

    createBundle: build.mutation({
      query: ({ data, force = false, settingsFromBundle = null, settingsFromVariant = null }) => {

        const queryParameters = new URLSearchParams()
        if (force) queryParameters.append('force', force)
        if (settingsFromBundle) queryParameters.append('settingsFromBundle', settingsFromBundle)
        if (settingsFromVariant) queryParameters.append('settingsFromVariant', settingsFromVariant)

        return {
          url: `/api/bundles?${queryParameters.toString()}`,
          method: 'POST',
          body: data,
        }

      },
      // optimisticUpdate bundleList to add new bundle
      // TURNED OFF: having the lag is good user feedback
      // onQueryStarted: async ({ archived = false, data }, { dispatch, queryFulfilled }) => {
      //   const patchResult = dispatch(
      //     api.util.updateQueryData('getBundleList', { archived }, (draft) => {
      //       draft.push(data)
      //     }),
      //   )
      //   try {
      //     await queryFulfilled
      //   } catch {
      //     patchResult.undo()
      //   }
      // },
      // eslint-disable-next-line no-unused-vars
      invalidatesTags: (result, error, id) => [
        { type: 'bundleList' },
        { type: 'addonList' },
        { type: 'addonSettingsList' },
        // TODO: invalidate settings
        { type: 'addonSettings' },
        { type: 'addonSettingsOverrides' },
        { type: 'addonSettingsList' },
      ],
    }),

    updateBundle: build.mutation({
      query: ({ name, data, force = true }) => ({
        url: `/api/bundles/${name}?force=${force}`,
        method: 'PATCH',
        body: data,
      }),
      // optimisticUpdate bundleList to update bundle
      // eslint-disable-next-line no-unused-vars
      onQueryStarted: async ({ name, archived = true, patch }, { dispatch, queryFulfilled }) => {
        const patchResult = dispatch(
          api.util.updateQueryData('getBundleList', { archived }, (draft) => {
            if (!patch) return
            const bundleIndex = draft.findIndex((bundle) => bundle.name === name)
            if (bundleIndex === -1) throw new Error('bundle not found')
            draft[bundleIndex] = patch
          }),
        )
        try {
          await queryFulfilled
        } catch {
          patchResult.undo()
        }
      },
      // eslint-disable-next-line no-unused-vars
      invalidatesTags: (result, error, id) => [
        { type: 'bundleList' },
        { type: 'addonList' },
        { type: 'addonSettingsList' },
        { type: 'marketAddon' },
      ],
    }),


    migrateSettingsByBundle: build.mutation({

      query: ({ sourceBundle, sourceVariant, targetBundle, targetVariant }) => ({
        url: '/api/migrateSettingsByBundle',
        method: 'POST',
        body: { sourceBundle, sourceVariant, targetBundle, targetVariant},
      }),

      invalidatesTags: (result, error, id) => [
        { type: 'addonSettings' },
        { type: 'addonSettingsOverrides' },
        { type: 'addonSettingsList' },
      ],



    }), // migrateSettingsByBundle


  }), // endpoints
  overrideExisting: true,
})

export const {
  useDeleteBundleMutation,
  useCreateBundleMutation,
  useUpdateBundleMutation,
  usePromoteBundleMutation,
  useMigrateSettingsByBundleMutation,
} = updateBundles
