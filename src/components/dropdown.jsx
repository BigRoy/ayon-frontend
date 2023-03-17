import PropTypes from 'prop-types'
import { useEffect } from 'react'
import { useState } from 'react'
import { useRef } from 'react'
import styled, { css, keyframes } from 'styled-components'
import { InputText } from '@ynput/ayon-react-components'
import { isEqual, isNull } from 'lodash'
import { useMemo } from 'react'

// background acts as a blocker
const BackdropStyled = styled.div`
  position: fixed;
  inset: 0;
  background-color: unset;
  z-index: 11;
`

const dropdownMenuAnimation = keyframes`
  0% {
    transform: scale(.95);
    opacity: .6;
}
100% {
    transform: scale(1);
    opacity: 1;
}
`

const ButtonStyled = styled.button`
  /* remove defaults */
  background: none;
  color: inherit;
  border: none;
  padding: 0;
  font: inherit;
  cursor: pointer;
  &:not(:focus) {
    outline: inherit;
  }

  &:hover {
    background-color: var(--color-grey-02);
  }

  border-radius: var(--border-radius);
`

const DropdownStyled = styled.div`
  position: relative;
  height: ${({ height }) => `${height}px`};
  /* width: 100%; */
  display: inline-block;

  & > * {
    width: 100%;
  }
`

const ContainerStyled = styled.form`
  width: 100%;
  position: relative;
  height: ${({ height }) => `${height}px`};
  width: auto;
  display: inline-block;

  position: fixed;
  z-index: 60;

  transform-origin: top;

  ${({ startAnimation }) =>
    startAnimation
      ? css`
          animation: ${dropdownMenuAnimation} 0.03s ease-in forwards;
        `
      : css`
          opacity: 0;
        `}

  /* position: fixed; */

  /* show warning when changing multiple entities */
  ${({ isOpen, message }) =>
    isOpen &&
    message &&
    css`
      &::before {
        content: '${message}';
        top: 0;
        translate: 0 -100%;
        position: absolute;
        background-color: var(--color-grey-00);
        border-radius: var(--border-radius) var(--border-radius) 0 0;
        z-index: 10;
        display: flex;
        align-items: center;
        padding: 4px 0;
        right: 0;
        left: 0;
        outline: 1px solid #383838;
        justify-content: center;
      }
    `}
`

const OptionsStyled = styled.ul`
  width: auto;
  list-style-type: none;
  padding: unset;

  display: flex;
  flex-direction: column;

  margin: 0px;
  /* same border used as primereact dropdowns */
  outline: 1px solid #383838;
  background-color: var(--color-grey-00);
  z-index: 20;
  border-radius: ${({ message }) =>
    message ? '0 0 var(--border-radius) var(--border-radius)' : 'var(--border-radius)'};
  overflow: clip;

  transition: max-height 0.15s;

  /* scrolling */
  max-height: 300px;
  overflow-y: scroll;

  ::-webkit-scrollbar {
    display: none;
  }
`

const ListItemStyled = styled.li`
  ${({ usingKeyboard }) =>
    !usingKeyboard &&
    css`
      &:hover {
        background-color: var(--color-grey-02);
      }
    `}

  /* focused */
  outline-offset: -1px;
  ${({ focused }) =>
    focused &&
    css`
      background-color: var(--color-grey-02);

      & > * {
        outline: solid #93cbf9 1px;
        outline-offset: -1px;
      }
    `}
`

const SearchStyled = styled.div`
  /* put to top of list */
  order: -2;
  position: relative;
  height: 29px;
  width: 100%;

  /* search icon */
  span {
    position: absolute;
    left: 4px;
    top: 50%;
    translate: 0 -50%;
    z-index: 10;
  }

  /* input */
  input {
    width: calc(100% + 2px);
    position: relative;
    left: -1px;
    height: 100%;
    text-indent: 24px;

    border-radius: var(--border-radius) var(--border-radius) 0 0;

    &:focus {
      outline: unset;
    }
  }
`

const Dropdown = ({
  value = [],
  valueItem,
  valueField = 'value',
  options = [],
  optionsItem,
  style,
  searchFields = ['value'],
  message,
  onClose,
  onChange,
  onOpen,
  widthExpand,
  align = 'left',
  multiSelect,
  search,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  // Style states
  const [pos, setPos] = useState({ x: null, y: null })
  const [startAnimation, setStartAnimation] = useState(false)
  const [minWidth, setMinWidth] = useState()
  // search
  const [searchForm, setSearchForm] = useState('')
  // selection
  const [selected, setSelected] = useState([])
  // keyboard states
  const [activeIndex, setActiveIndex] = useState(null)
  const [usingKeyboard, setUsingKeyboard] = useState(false)

  // REFS
  const valueRef = useRef(null)
  const optionsRef = useRef(null)

  // USE EFFECTS
  // sets the correct position and height
  useEffect(() => {
    if (isOpen && valueRef.current && optionsRef.current) {
      const valueRec = valueRef.current.getBoundingClientRect()
      const valueWidth = valueRec.width

      const optionsRec = optionsRef.current.getBoundingClientRect()
      const optionsWidth = optionsRec.width
      const optionsheight = optionsRec.height

      let x = valueRec.x
      let y = valueRec.y

      if (align === 'right') {
        x = x + valueWidth - optionsWidth
      }

      // check it's not vertically off screen
      if (optionsheight + y > window.innerHeight) {
        y = window.innerHeight - optionsheight
      }

      // first set position
      setPos({ x, y })
      if (widthExpand) setMinWidth(valueWidth)

      // then start animation
      setStartAnimation(true)
    } else {
      setStartAnimation(false)
    }
  }, [isOpen, valueRef, optionsRef, setMinWidth, setStartAnimation, setPos])

  // set initial selected from value
  useEffect(() => {
    setSelected(value)
  }, [value, setSelected])

  // keyboard support
  useEffect(() => {
    // focus element
    if (usingKeyboard) {
      optionsRef.current?.childNodes[activeIndex]?.scrollIntoView(false)
    }
  }, [activeIndex, options, usingKeyboard, optionsRef])

  if (search && searchForm) {
    // filter out search matches
    options = options.filter((o) =>
      searchFields.some((key) => o[key]?.toLowerCase()?.includes(searchForm)),
    )
  }

  // reorder options to put active at the top
  options = useMemo(
    () => [...options].sort((a, b) => value.indexOf(b[valueField]) - value.indexOf(a[valueField])),
    [value, options],
  )

  // HANDLERS

  const handleClose = (e, changeValue) => {
    // changeValue is used on single select
    changeValue = changeValue || selected

    e?.stopPropagation()

    // close dropdown
    setIsOpen(false)

    // reset keyboard
    setActiveIndex(null)

    // callback
    onClose && onClose()

    // reset search
    setSearchForm('')

    // check for difs
    if (isEqual(changeValue, value)) return
    // commit changes
    onChange && onChange(changeValue)
    //   reset selected
    setSelected([])
  }

  const handleChange = (e, value) => {
    e?.stopPropagation()

    let newSelected = [...selected]

    if (!multiSelect) {
      // replace current value with new one
      newSelected = [value]
    } else {
      // add/remove from selected
      if (newSelected.includes(value)) {
        // remove
        newSelected.splice(newSelected.indexOf(value), 1)
      } else {
        // add
        newSelected.push(value)
      }
    }
    // update state
    setSelected(newSelected)
    // if not multi, close
    if (!multiSelect) handleClose(undefined, newSelected)
  }

  const handleOpen = (e) => {
    e.stopPropagation()
    setIsOpen(true)

    onOpen && onOpen()
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
  }

  // KEY BOARD CONTROL
  const handleKeyPress = (e) => {
    // NAVIGATE DOWN
    if (e.code === 'ArrowDown') {
      if (activeIndex === null || activeIndex >= options.length - 1) {
        // got to top
        setActiveIndex(0)
      } else {
        // go down one
        setActiveIndex((isNull(activeIndex) ? -1 : activeIndex) + 1)
      }
    }

    // NAVIGATE UP
    if (e.code === 'ArrowUp') {
      if (!activeIndex || activeIndex <= 0) {
        // go to bottom
        setActiveIndex(options.length - 1)
      } else {
        // go one up
        setActiveIndex(activeIndex - 1)
      }
    }

    const selected = options[activeIndex][valueField]

    if (e.code === 'ArrowDown' || e.code === 'ArrowUp') {
      e.preventDefault()
      if (isOpen) {
        if (!usingKeyboard) setUsingKeyboard(true)
      } else if (!multiSelect) {
        // flick through options without opening
        onChange && onChange([selected])
      }
    }

    // SUBMIT WITH ENTER
    if (e.code === 'Enter') {
      // prevent reloads
      e.preventDefault()

      // open
      if (!isOpen) return setIsOpen(true)

      if (multiSelect) {
        handleChange(undefined, selected)
      } else {
        handleClose(undefined, [selected])
      }
    }

    // CLOSE WITH ESC or TAB
    if (e.code === 'Escape' || (e.code === 'Tab' && isOpen)) {
      if (e.code === 'Escape') {
        // focus back on button
        valueRef.current.focus()
      }
      handleClose()
    }
  }

  return (
    <DropdownStyled
      onKeyDown={handleKeyPress}
      onMouseMove={() => usingKeyboard && setUsingKeyboard(false)}
    >
      {value && (
        <ButtonStyled ref={valueRef} onClick={handleOpen}>
          {valueItem()}
        </ButtonStyled>
      )}
      {isOpen && <BackdropStyled onClick={handleClose} />}
      {isOpen && options && (
        <ContainerStyled
          style={{ left: pos?.x, top: pos?.y, ...style }}
          message={message}
          isOpen={true}
          startAnimation={startAnimation}
          onSubmit={handleSearchSubmit}
        >
          {search && (
            <SearchStyled>
              <span className="material-symbols-outlined">search</span>
              <InputText
                label="search"
                value={searchForm}
                onChange={(e) => setSearchForm(e.target.value)}
                autoFocus
                tabindex={0}
              />
            </SearchStyled>
          )}
          <OptionsStyled isOpen={isOpen} message={message} ref={optionsRef} style={{ minWidth }}>
            {options.map((option, i) => (
              <ListItemStyled
                key={option[valueField]}
                onClick={(e) => handleChange(e, option[valueField])}
                focused={usingKeyboard && activeIndex === i}
                usingKeyboard={usingKeyboard}
              >
                {optionsItem(option, value.includes(option.name), selected.includes(option.name))}
              </ListItemStyled>
            ))}
          </OptionsStyled>
        </ContainerStyled>
      )}
    </DropdownStyled>
  )
}

Dropdown.propTypes = {
  message: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
  style: PropTypes.object,
  onOpen: PropTypes.func,
  onClose: PropTypes.func,
  value: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
  valueItem: PropTypes.func,
  valueField: PropTypes.string,
  options: PropTypes.array.isRequired,
  optionsItem: PropTypes.func,
  align: PropTypes.oneOf(['left', 'right']),
  multiSelect: PropTypes.bool,
  search: PropTypes.bool,
}

export default Dropdown
