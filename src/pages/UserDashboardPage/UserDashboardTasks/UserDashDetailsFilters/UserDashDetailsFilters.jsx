import * as Styled from './UserDashDetailsFilters.styled'
import { useDispatch, useSelector } from 'react-redux'
import { onAttribsOpenChange, onFeedFilterChange } from '/src/features/dashboard'
import { Spacer } from '@ynput/ayon-react-components'

const UserDashDetailsFilters = ({ isSlideOut }) => {
  const dispatch = useDispatch()
  const setFeedFilter = (value) => dispatch(onFeedFilterChange({ value, isSlideOut }))
  const toggleAttribsOpen = () => dispatch(onAttribsOpenChange({ isSlideOut }))

  const filtersStateLocation = isSlideOut ? 'slideOut' : 'details'

  const selectedFilter = useSelector((state) => state.dashboard[filtersStateLocation].filter)
  const attribsOpen = useSelector((state) => state.dashboard[filtersStateLocation].attributesOpen)

  const filtersLeft = [
    {
      id: 'activity',
      label: 'All activity',
      icon: 'forum',
    },
    {
      id: 'comments',
      label: 'Comments',
      icon: 'chat',
    },
    // {
    //   id: 'versions',
    //   label: 'Versions',
    //   icon: 'layers',
    // },
    {
      id: 'checklists',
      label: 'Checklists',
      icon: 'checklist',
    },
  ]

  return (
    <Styled.FiltersToolbar>
      {filtersLeft.map((filter) => (
        <Styled.FilterButton
          key={filter.id}
          selected={filter.id === selectedFilter && !attribsOpen}
          onClick={() => setFeedFilter(filter.id)}
          // label={filter.label}
          icon={filter.icon}
          data-tooltip={filter.label}
          data-tooltip-delay={0}
        />
      ))}
      <Spacer />
      <Styled.FilterButton
        icon="segment"
        onClick={toggleAttribsOpen}
        selected={attribsOpen}
        data-tooltip="Attributes"
        data-tooltip-delay={0}
      />
    </Styled.FiltersToolbar>
  )
}

export default UserDashDetailsFilters