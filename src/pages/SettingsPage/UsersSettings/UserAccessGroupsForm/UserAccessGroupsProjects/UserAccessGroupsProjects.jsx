import { Button, Icon, InputText, Panel } from '@ynput/ayon-react-components'
import * as Styled from './UserAccessGroupsProjects.styled'
import { classNames } from 'primereact/utils'
import { useMemo, useRef, useState } from 'react'
import { matchSorter } from 'match-sorter'

// access groups panel
const UserAccessGroupsProjects = ({
  values = [],
  activeValues = [],
  options = [],
  selectedAG,
  onChange,
  isDisabled,
}) => {
  const [sortByActive, setSortByActive] = useState(false)

  // find deleted projects (values that are not in options)
  // in theory, this should never happen, but it's a safety measure
  const deletedProjects = values
    .filter((value) => !options.find(({ name }) => name === value))
    .map((value) => ({ name: value, active: false, deleted: true }))

  // sort options by active first, then alphabetically
  const sortedOptions = useMemo(
    () =>
      [...options, ...deletedProjects].sort((a, b) => {
        // Check if the options are in the values array
        const aActive = values.includes(a.name)
        const bActive = values.includes(b.name)

        // If both options have the same active status, sort them by deleted then active (archived) then alphabetically
        if (aActive === bActive || !sortByActive) {
          // Comparator function to sort objects based on their status and names
          return (
            // Active projects come first
            b.active - a.active ||
            // Among inactive projects, not deleted (archived) come before deleted
            !!a.deleted - !!b.deleted ||
            // If both have the same 'active' and 'deleted' status, sort alphabetically by name
            a.name.localeCompare(b.name)
          )
        }
        // Otherwise, sort them by active status (put active options first)
        return bActive ? 1 : -1
      }),
    [selectedAG, sortByActive],
  )

  const isDragging = useRef(false)

  // is the search bar open?
  const [searchOpen, setSearchOpen] = useState(false)
  // search string
  const [search, setSearch] = useState('')

  // if search open, filter options
  const filteredOptions = matchSorter(sortedOptions, search, { keys: ['name'] })

  // if search is open, use filtered options, otherwise use sorted options
  const projectOptions = searchOpen ? filteredOptions : sortedOptions

  // this keeps track of which projects the mouse is over, to prevent triggering the same project multiple times
  const [currentHoveredIndex, setCurrentHoveredIndex] = useState(null)
  // are we turning on or off
  const [turningOn, setTurningOn] = useState(true)

  const handleItemMouseDown = (e) => {
    isDragging.current = true

    const itemElement = e.target.closest('.project-item')

    if (!itemElement) return

    // get the id of the item the mouse is over
    const projectId = itemElement.id
    // get index of the item the mouse is over
    const index = sortedOptions.findIndex(({ name }) => name === projectId)

    setCurrentHoveredIndex(index)

    // if the project is already in the list, we are turning it off
    setTurningOn(!values.includes(projectId))

    // change the value of the project
    onChange([projectId])
  }

  const handleMouseUp = () => {
    isDragging.current = false
    setCurrentHoveredIndex(null)
  }

  const handleMouseMove = (e) => {
    if (!isDragging.current) return

    // return is class name is not project-item
    if (!e.target.className.includes('project-item')) return

    // get id of the item the mouse is over
    const projectId = e.target.id
    // get index of the item the mouse is over
    const index = sortedOptions.findIndex(({ name }) => name === projectId)

    // check if the id is already in the list
    if (currentHoveredIndex === index) return

    const projectIdsToChange = []
    // check if the project is the opposite of what we are turning on
    if (values.includes(projectId) !== turningOn) {
      // otherwise we are turning it to turningOn (toggling it)
      projectIdsToChange.push(projectId)
    }

    onChange(projectIdsToChange)

    // set new index
    setCurrentHoveredIndex(index)
  }

  // keyboard selection on item
  const handleItemKeyDown = (e) => {
    // onChange the project using id if enter or space
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleItemMouseDown(e)
    }
  }

  const handleSearchClose = () => {
    setSearchOpen(false)
    setSearch('')
  }

  // search keyboard selection
  const handleSearchKeyDown = (e) => {
    if (!searchOpen) return

    // if escape, close search
    if (e.key === 'Escape') {
      e.preventDefault()
      handleSearchClose()
    }

    // if enter, focus on the first project
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()

      // select the first project
      const firstProject = e.target
        .closest('#user-access-groups-projects')
        ?.querySelector('.project-item')
      // focus on the first project
      if (firstProject) firstProject.focus()

      // only one project from search? select it
      if (filteredOptions.length === 1) {
        onChange([filteredOptions[0].name])
      }
    }
  }

  const handleKeyDown = (e) => {
    // if esc and search is open, close search
    if (e.key === 'Escape' && searchOpen) {
      e.preventDefault()
      handleSearchClose()
    }
  }

  return (
    <Panel
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      onKeyDown={handleKeyDown}
      id="user-access-groups-projects"
    >
      <Styled.Header className={classNames({ searchOpen, disabled: isDisabled })}>
        {searchOpen ? (
          <>
            <InputText
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              placeholder="Search projects..."
              onKeyDown={handleSearchKeyDown}
            />
            <Styled.CloseIcon icon={searchOpen ? 'close' : 'search'} onClick={handleSearchClose} />
          </>
        ) : (
          <>
            <span className="title">Projects</span>
            <Button
              icon={'sort'}
              variant="text"
              data-tooltip="Sort by active projects"
              selected={sortByActive}
              onClick={() => setSortByActive(!sortByActive)}
            />
            <Button
              icon={searchOpen ? 'close' : 'search'}
              variant="text"
              onClick={() => setSearchOpen(true)}
            />
          </>
        )}
      </Styled.Header>
      <Styled.List>
        {projectOptions.map(({ name, active, deleted }) => (
          <Styled.ProjectItem
            key={name}
            className={classNames('project-item', {
              active: values.includes(name),
              disabled: isDisabled,
              dragging: isDragging.current,
            })}
            onMouseDown={handleItemMouseDown}
            onKeyDown={handleItemKeyDown}
            id={name}
            tabIndex={0}
          >
            <span className="name">{name}</span>
            {!active && <span>{deleted ? '(deleted)' : '(archived)'}</span>}
            <Icon
              icon={
                values.includes(name) ? (activeValues.includes(name) ? 'check' : 'remove') : 'add'
              }
            />
          </Styled.ProjectItem>
        ))}
      </Styled.List>
    </Panel>
  )
}

export default UserAccessGroupsProjects
