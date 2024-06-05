import { isEqual } from 'lodash'
import { ayonApi } from '../ayon'
import { taskProvideTags } from '../userDashboard/userDashboardHelpers'
import { transformActivityData, transformTooltipData } from './activitiesHelpers'
// import PubSub from '/src/pubsub'
import { ACTIVITIES, ENTITY_TOOLTIP } from './activityQueries'

const getActivities = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    // get multiple entities activities
    getActivities: build.query({
      query: ({ projectName, entityIds, cursor, last, referenceTypes, activityTypes }) => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: ACTIVITIES,
          variables: { projectName, entityIds, cursor, last, referenceTypes, activityTypes },
        },
      }),
      transformResponse: (res, meta, { currentUser }) =>
        transformActivityData(res?.data, currentUser),
      providesTags: (result, error, { entityIds, activityTypes = [], filter }) =>
        result
          ? [
              ...result.activities.map((a) => ({ type: 'activity', id: a.activityId })),
              { type: 'activity', id: 'LIST' },
              ...entityIds.map((id) => ({ type: 'entityActivities', id: id })),
              { type: 'entityActivities', id: 'LIST' },
              ...activityTypes.map((type) => ({ type: 'entityActivities', id: type })),
              // filter is used when a comment is made, to refetch the activities of other filters
              ...entityIds.map((id) => ({ type: 'entityActivities', id: id + '-' + filter })),
            ]
          : [{ type: 'activity', id: 'LIST' }],
      // don't include the name or cursor in the query args cache key
      serializeQueryArgs: ({ queryArgs: { projectName, entityIds, activityTypes, filter } }) => ({
        projectName,
        entityIds,
        activityTypes,
        filter,
      }),
      // Always merge incoming data to the cache entry
      merge: (currentCache, newCache) => {
        const { activities = [], pageInfo } = newCache
        const { activities: lastActivities = [] } = currentCache

        const newMessages = [
          ...lastActivities,
          ...activities.filter(
            (m) => !lastActivities.some((lm) => lm.referenceId === m.referenceId),
          ),
        ]

        return {
          activities: newMessages,
          pageInfo,
        }
      },
      // Refetch when the page arg changes
      forceRefetch({ currentArg, previousArg }) {
        return !isEqual(currentArg, previousArg)
      },
    }),
    // get data for a reference tooltip based on type,id and projectName
    getEntityTooltip: build.query({
      query: ({ projectName, entityId, entityType }) => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: ENTITY_TOOLTIP(entityType),
          variables: { projectName, entityId },
        },
      }),
      transformResponse: (res, meta, { entityType }) =>
        transformTooltipData(res?.data?.project, entityType),
      providesTags: (res, error, { entityType }) => taskProvideTags([res], 'task', entityType),
    }),
  }),
})

//

export const { useGetActivitiesQuery, useLazyGetActivitiesQuery, useGetEntityTooltipQuery } =
  getActivities
