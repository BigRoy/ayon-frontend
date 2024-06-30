import { useState, useMemo, useEffect } from 'react'
import BundleList from './BundleList'
import BundleDetail from './BundleDetail'
import { Button, InputSwitch, Section } from '@ynput/ayon-react-components'
import * as Styled from './Bundles.styled'
import { useGetBundleListQuery } from '@queries/bundles/getBundles'
import { useUpdateBundleMutation } from '@queries/bundles/updateBundles'
import getNewBundleName from './getNewBundleName'
import NewBundle from './NewBundle'
import { useGetInstallerListQuery } from '@queries/installers'
import { useGetAddonListQuery } from '@queries/addons/getAddons'
import { upperFirst } from 'lodash'
import { toast } from 'react-toastify'
import AddonDialog from '@components/AddonDialog/AddonDialog'
import { useGetAddonSettingsQuery } from '@queries/addonSettings'
import getLatestSemver from './getLatestSemver'
import { ayonApi } from '@queries/ayon'
import { useDispatch, useSelector } from 'react-redux'
import useLocalStorage from '@hooks/useLocalStorage'
import { Splitter, SplitterPanel } from 'primereact/splitter'
import { useSearchParams } from 'react-router-dom'
import Shortcuts from '@containers/Shortcuts'

const Bundles = () => {
  const userName = useSelector((state) => state.user.name)
  const developerMode = useSelector((state) => state.user.attrib.developerMode)
  const dispatch = useDispatch()
  // addon upload dialog
  const [uploadOpen, setUploadOpen] = useState(false)

  // table selection
  const [selectedBundles, setSelectedBundles] = useState([])

  // open bundle details
  // set a bundle name to open the new bundle form, plus add any extra data
  const [newBundleOpen, setNewBundleOpen] = useState(null)

  const [showArchived, setShowArchived] = useLocalStorage('bundles-archived', true)

  // REDUX QUERIES
  let {
    data: bundleList = [],
    isLoading,
    isFetching,
    isError,
    error,
  } = useGetBundleListQuery({ archived: true })
  // GET INSTALLERS
  const { data: installerList = [], isLoading: isLoadingInstallers } = useGetInstallerListQuery()
  // GET ADDONS
  const { data: addons = [], isLoading: isLoadingAddons } = useGetAddonListQuery({
    showVersions: true,
  })

  // filter out archived bundles if showArchived is true
  bundleList = useMemo(() => {
    if (!showArchived) {
      return [...bundleList]
        .filter((bundle) => !bundle.isArchived)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    }
    return bundleList
  }, [bundleList, showArchived])

  // filter out isDev bundles if developerMode off
  bundleList = useMemo(() => {
    if (!developerMode) {
      return [...bundleList].filter((bundle) => !bundle.isDev)
    }
    return bundleList
  }, [bundleList, developerMode])

  const getBundleFromQuery = (param) => {
    if (!param) return null

    if (param === 'latest') {
      return bundleList[0]
    } else if (param === 'prod') {
      return bundleList.find((b) => b.isProduction)
    } else if (param) {
      return bundleList.find((b) => b.name === param)
    } else if (developerMode) {
      return bundleList.find((b) => b.isDev && b.activeUser === userName)
    }
  }

  const [searchParams, setSearchParams] = useSearchParams()
  // if there is a url query ?bundle={name} = latest then select the bundle and remove the query
  // if selected = prod then select the production bundle
  useEffect(() => {
    if (isLoading) return
    const bundleParam = searchParams.get('bundle')
    // if bundleParam = latest then select the latest bundle createdAt
    const foundBundle = getBundleFromQuery(bundleParam)

    if (foundBundle) {
      setSelectedBundles([foundBundle.name])
    }

    const duplicateParam = searchParams.get('duplicate')

    if (duplicateParam) {
      const foundDuplicate = getBundleFromQuery(duplicateParam)
      if (foundDuplicate) {
        // setSelectedBundles([foundDuplicate.name])
        handleDuplicateBundle(foundDuplicate.name)
      }
    }

    // delete
    searchParams.delete('bundle')
    searchParams.delete('duplicate')
    setSearchParams(searchParams)
  }, [searchParams, isLoading, bundleList])

  // REDUX MUTATIONS
  const [updateBundle] = useUpdateBundleMutation()

  // get latest core version
  const coreAddonLatestVersion = useMemo(() => {
    const coreAddonVersions = addons.find((addon) => addon.name === 'core')?.versions || {}
    return getLatestSemver(Object.keys(coreAddonVersions))
  }, [addons])

  // get core addon settings for version
  const { data: coreAddonSettings } = useGetAddonSettingsQuery(
    {
      addonName: 'core',
      addonVersion: coreAddonLatestVersion,
    },
    { skip: !coreAddonLatestVersion },
  )

  // get studio name from core addon settings
  const studioName = useMemo(() => {
    return coreAddonSettings?.studio_name
  }, [coreAddonSettings])

  const bundlesData = useMemo(() => {
    if (!(bundleList && selectedBundles.length)) {
      return []
    }
    const result = bundleList.filter((bundle) => selectedBundles.includes(bundle.name))

    return result
  }, [bundleList, selectedBundles])

  // takes an array of installer objects (installerList) and groups them by version.
  // The result is an array of objects, each containing a version number and an array of platforms for that version.
  const installerVersions = useMemo(() => {
    if (!installerList) return []

    const r = {}
    for (const installer of installerList) {
      if (r[installer.version]) {
        r[installer.version].push(installer.platform)
      } else {
        r[installer.version] = [installer.platform]
      }
    }

    return Object.entries(r).map(([version, platforms]) => ({
      platforms: platforms.sort(),
      version,
    }))
  }, [installerList])

  const handleBundleSelect = (names) => {
    setSelectedBundles(names)
    setNewBundleOpen(null)
  }

  const handleNewBundleStart = () => {
    const name = getNewBundleName(studioName, bundleList)
    setNewBundleOpen({ name })
  }

  const handleNewBundleEnd = (name) => {
    setNewBundleOpen(null)
    setSelectedBundles([name])
  }

  const getVersionedName = (name) => {
    let newName
    const versionNumber = parseInt(name.split('-').pop())
    if (!isNaN(versionNumber)) {
      newName = name.replace(/(\d+)$/, () => {
        return (versionNumber + 1).toString().padStart(2, '0')
      })
    } else {
      newName = `${name}-01`
    }

    // if there is no xx at the end, add 01
    if (newName === name) {
      newName += '-01'
    }

    return newName
  }

  const handleDuplicateBundle = (name) => {
    // get the bundle data
    const bundle = bundleList.find((b) => b.name === name)
    if (!bundle) return

    let newName = getVersionedName(name)

    const bundleNames = bundleList.map((b) => b.name)
    // make sure the new name doesn't already exist
    while (bundleNames.includes(newName)) {
      newName = getVersionedName(newName)
    }

    const duplicatedAddons = { ...bundle.addons }
    const installedAddonNames = new Set(addons.map((a) => a.name))
    // ensure that all addons are installed and delete the ones that are not
    for (const addonName in duplicatedAddons) {
      if (!installedAddonNames.has(addonName)) {
        delete duplicatedAddons[addonName]
      }
    }

    setNewBundleOpen({
      name: newName,
      addons: duplicatedAddons,
      installerVersion: bundle.installerVersion,
      dependencyPackages: bundle.dependencyPackages,
      isArchived: false,
      isStaging: false,
      isProduction: false,
    })
    setSelectedBundles([])
  }

  const toggleBundleStatus = async (status, activeBundle) => {
    const statusKey = `is${upperFirst(status)}`
    const bundle = bundleList.find((b) => b.name === activeBundle)
    if (!bundle) return

    const { name, [statusKey]: isActive } = bundle
    const newActive = !isActive

    const message = `bundle ${name} ${newActive ? 'set' : 'unset'} ${status}`
    let patchResult

    if (newActive) {
      // try and find an old bundle with the same status and unset it
      const oldBundle = bundleList.find((b) => b.name !== name && b[statusKey])
      if (oldBundle) {
        // optimistically update old bundle to remove status
        try {
          const patch = { ...oldBundle, [statusKey]: false }
          patchResult = dispatch(
            ayonApi.util.updateQueryData('getBundleList', { archived: true }, (draft) => {
              const bundleIndex = draft.findIndex((bundle) => bundle.name === oldBundle.name)
              draft[bundleIndex] = patch
            }),
          )
        } catch (error) {
          console.error(error)
        }
      }
    }

    try {
      const patch = { ...bundle, [statusKey]: newActive }
      await updateBundle({ name, data: { [statusKey]: newActive }, patch }).unwrap()
      toast.success(upperFirst(message))
    } catch (error) {
      toast.error(`Error setting ${message}`)
      // revert optimistic update if failed to set new bundle
      patchResult?.undo()
    }
  }

  let uploadHeader = ''
  switch (uploadOpen) {
    case 'addon':
      uploadHeader = 'Upload Addons'
      break
    case 'installer':
      uploadHeader = 'Upload Launcher'
      break
    case 'package':
      uploadHeader = 'Upload Dependency Package'
      break
    default:
      break
  }

  // SHORTCUTS
  const shortcuts = [
    {
      key: 'n',
      action: () => handleNewBundleStart(),
    },
    {
      key: 'a',
      action: () => setUploadOpen('addon'),
    },
    {
      key: 'l',
      action: () => setUploadOpen('installer'),
    },
    {
      key: 'p',
      action: () => setUploadOpen('package'),
    },
    {
      key: 'S',
      action: () => toggleBundleStatus('staging', selectedBundles[0]),
      disabled: selectedBundles.length !== 1,
    },
    {
      key: 'P',
      action: () => toggleBundleStatus('production', selectedBundles[0]),
      disabled: selectedBundles.length !== 1,
    },
    {
      key: 'D',
      action: () => handleDuplicateBundle(selectedBundles[0]),
      disabled: selectedBundles.length !== 1 && !newBundleOpen,
    },
  ]

  const prodBundle = useMemo(() => bundlesData.find((b) => b.isProduction), [bundlesData])
  const stageBundle = useMemo(() => bundlesData.find((b) => b.isStaging), [bundlesData])

  return (
    <>
      <Shortcuts
        shortcuts={shortcuts}
        deps={[selectedBundles, newBundleOpen, prodBundle, stageBundle]}
      />
      <AddonDialog
        uploadOpen={uploadOpen}
        setUploadOpen={setUploadOpen}
        uploadHeader={uploadHeader}
      />
      <main style={{ overflow: 'hidden' }}>
        <Splitter style={{ width: '100%' }} stateStorage="local" stateKey="bundles-splitter">
          <SplitterPanel style={{ minWidth: 200, width: 400, maxWidth: 800, zIndex: 10 }} size={30}>
            <Section style={{ height: '100%' }}>
              <Styled.MainToolbar>
                <Button
                  icon="add"
                  onClick={handleNewBundleStart}
                  data-tooltip="Add new bundle"
                  data-shortcut="N"
                >
                  <span>Add Bundle</span>
                </Button>
                <Button
                  icon="upload"
                  onClick={() => setUploadOpen('addon')}
                  data-tooltip="Upload addon zip files"
                  data-shortcut="A"
                >
                  <span className="large">Upload addons</span>
                  <span className="small">Addons</span>
                </Button>
                <Button
                  icon="upload"
                  onClick={() => setUploadOpen('installer')}
                  data-tooltip="Upload launchers for download"
                  data-shortcut="L"
                >
                  <span className="large">Upload Launcher</span>
                  <span className="small">Launcher</span>
                </Button>
                <Button
                  icon="upload"
                  onClick={() => setUploadOpen('package')}
                  data-tooltip="Upload dependency packages"
                  data-shortcut="P"
                >
                  <span className="large">Upload Dependency Package</span>
                  <span className="small">Package</span>
                </Button>
                <span style={{ whiteSpace: 'nowrap' }} className="large">
                  Show Archived
                </span>
                <span className="small">Archived</span>
                <InputSwitch
                  checked={showArchived}
                  onChange={(e) => setShowArchived(e.target.checked)}
                />
              </Styled.MainToolbar>
              <BundleList
                selectedBundles={selectedBundles}
                onBundleSelect={handleBundleSelect}
                bundleList={bundleList}
                isLoading={isLoading}
                onDuplicate={handleDuplicateBundle}
                toggleBundleStatus={toggleBundleStatus}
                errorMessage={!isFetching && isError && error?.data?.traceback}
                developerMode={developerMode}
              />
            </Section>
          </SplitterPanel>
          <SplitterPanel size={70} style={{ overflow: 'hidden' }}>
            <Section style={{ height: '100%' }}>
              {newBundleOpen ? (
                <NewBundle
                  initBundle={newBundleOpen}
                  onSave={handleNewBundleEnd}
                  isLoading={isLoadingInstallers || isFetching}
                  installers={installerVersions}
                  addons={addons}
                  developerMode={developerMode}
                />
              ) : (
                !!bundlesData.length &&
                (bundlesData.length === 1 && bundlesData[0].isDev ? (
                  <NewBundle
                    initBundle={bundlesData[0]}
                    isLoading={isLoadingInstallers || isFetching}
                    installers={installerVersions}
                    addons={addons}
                    isDev
                  />
                ) : (
                  <BundleDetail
                    bundles={bundlesData}
                    onDuplicate={handleDuplicateBundle}
                    isLoading={isLoadingInstallers || isLoadingAddons || isFetching}
                    installers={installerVersions}
                    toggleBundleStatus={toggleBundleStatus}
                    addons={addons}
                    developerMode={developerMode}
                  />
                ))
              )}
            </Section>
          </SplitterPanel>
        </Splitter>
      </main>
    </>
  )
}

export default Bundles
