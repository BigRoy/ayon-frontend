import { Panel } from '@ynput/ayon-react-components'
import React, { useEffect } from 'react'
import DetailsPanelHeader from './DetailsPanelHeader/DetailsPanelHeader'
import { useDispatch, useSelector } from 'react-redux'
import Feed from '@containers/Feed/Feed'
import { useGetDashboardEntitiesDetailsQuery } from '@queries/entity/getEntityPanel'
import TaskAttributes from '@pages/UserDashboardPage/UserDashboardTasks/TaskAttributes/TaskAttributes'
import { transformEntityData } from '@queries/userDashboard/userDashboardHelpers'
import RepresentationsList from '../RepresentationsList/RepresentationsList'
import { closeSlideOut, updateDetailsPanelTab } from '@state/details'

export const entitiesWithoutFeed = ['product', 'representation']

const DetailsPanel = ({
  entityType,
  // entities is data we already have from kanban
  entitiesData = [],
  // entityIds are used to get the full details data for the entities
  entities = [],
  statusesOptions = [],
  tagsOptions = [],
  disabledStatuses,
  projectUsers,
  disabledProjectUsers,
  activeProjectUsers,
  selectedTasksProjects,
  projectsInfo = {},
  projectNames = [],
  onClose,
  isSlideOut = false,
  style = {},
  scope,
  isCompact = false,
}) => {
  const path = isSlideOut ? 'slideOut' : 'pinned'
  let selectedTab = useSelector((state) => state.details[path].tab)
  const dispatch = useDispatch()

  // if the entity type is product or representation, we show the attribs tab only
  if (entitiesWithoutFeed.includes(entityType)) selectedTab = 'attribs'

  // check if tab needs to be updated when entity type changes
  // for example when switching from version to task, task doesn't have reps tab
  // if reps tab was selected, set default to feed
  useEffect(() => {
    if (selectedTab === 'representations') {
      // check entity type is still version
      if (entityType !== 'version') {
        dispatch(updateDetailsPanelTab({ isSlideOut, tab: 'feed' }))
      }
    }
  }, [entityType, selectedTab])

  // now we get the full details data for selected entities
  const entitiesToQuery = entities.length
    ? entities.map((entity) => ({ id: entity.id, projectName: entity.projectName }))
    : entitiesData.map((entity) => ({ id: entity.id, projectName: entity.projectName }))

  const {
    data: detailsData = [],
    isFetching: isFetchingEntitiesDetails,
    isSuccess,
    isError,
    originalArgs,
  } = useGetDashboardEntitiesDetailsQuery(
    { entityType, entities: entitiesToQuery, projectsInfo },
    { skip: !entitiesData.length && !entities.length },
  )

  // the entity changes then we close the slide out
  useEffect(() => {
    if (!isSlideOut) {
      dispatch(closeSlideOut())
    }
  }, [originalArgs])

  let entityDetailsData = []
  // merge current entities data with fresh details data
  if (!isSuccess || isError) {
    if (entities.length) entityDetailsData = entities.map(({ id }) => ({ id }))
    else
      entityDetailsData = entities.map((entity) =>
        transformEntityData({
          entity,
          entityType,
          projectName: entity.projectName,
          projectInfo: projectsInfo[entity.projectName],
        }),
      )
  } else entityDetailsData = detailsData

  // get the first project name and info to be used in the feed.
  const firstProject = projectNames[0]
  const firstProjectInfo = projectsInfo[firstProject] || {}

  return (
    <>
      <Panel
        style={{
          gap: 0,
          height: '100%',
          padding: 0,
          boxShadow: '-2px 0 6px #00000047',
          zIndex: 300,
          ...style,
        }}
        className="details-panel"
      >
        <DetailsPanelHeader
          entityType={entityType}
          entities={entityDetailsData}
          users={projectUsers}
          disabledAssignees={disabledProjectUsers}
          statusesOptions={statusesOptions}
          disabledStatuses={disabledStatuses}
          tagsOptions={tagsOptions}
          onClose={onClose}
          isSlideOut={isSlideOut}
          isFetching={isFetchingEntitiesDetails}
          isCompact={isCompact}
        />
        {selectedTab === 'feed' && !isError && (
          <Feed
            entityType={entityType}
            entities={isFetchingEntitiesDetails ? entitiesToQuery : entityDetailsData}
            activeUsers={activeProjectUsers}
            selectedTasksProjects={selectedTasksProjects}
            projectInfo={firstProjectInfo}
            projectName={firstProject}
            isMultiProjects={projectNames.length > 1}
            isSlideOut={isSlideOut}
            scope={scope}
          />
        )}
        {selectedTab === 'representations' && (
          <RepresentationsList entities={entityDetailsData} scope={scope} />
        )}
        {selectedTab === 'attribs' && (
          <TaskAttributes
            entityType={entityType}
            entities={entityDetailsData}
            isLoading={isFetchingEntitiesDetails}
          />
        )}
      </Panel>
    </>
  )
}

export default DetailsPanel
