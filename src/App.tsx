import { lazy, useCallback, useEffect, useState } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { Layout } from './components/Layout'
import { Opening } from './components/Opening'
import { applyTheme, getSettings } from './lib/settings'

const Home = lazy(() => import('./pages/Home'))
const Words = lazy(() => import('./pages/Words'))
const WordDetail = lazy(() => import('./pages/WordDetail'))
const Study = lazy(() => import('./pages/Study'))
const Practice = lazy(() => import('./pages/Practice'))
const Listening = lazy(() => import('./pages/Listening'))
const Dictation = lazy(() => import('./pages/Dictation'))
const Speaking = lazy(() => import('./pages/Speaking'))
const Scenes = lazy(() => import('./pages/Scenes'))
const SceneDetail = lazy(() => import('./pages/SceneDetail'))
const Translate = lazy(() => import('./pages/Translate'))
const Settings = lazy(() => import('./pages/Settings'))
const Research = lazy(() => import('./pages/Research'))
const Welcome = lazy(() => import('./pages/Welcome'))
const Stats = lazy(() => import('./pages/Stats'))
const Sounds = lazy(() => import('./pages/Sounds'))
const Compose = lazy(() => import('./pages/Compose'))
const AudioReview = lazy(() => import('./pages/AudioReview'))
const Handsfree = lazy(() => import('./pages/Handsfree'))
const Interpreter = lazy(() => import('./pages/Interpreter'))
const Usage = lazy(() => import('./pages/Usage'))

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'words', element: <Words /> },
      { path: 'words/:id', element: <WordDetail /> },
      { path: 'study', element: <Study /> },
      { path: 'practice', element: <Practice /> },
      { path: 'practice/listening', element: <Listening /> },
      { path: 'practice/dictation', element: <Dictation /> },
      { path: 'practice/speaking', element: <Speaking /> },
      { path: 'practice/sounds', element: <Sounds /> },
      { path: 'practice/compose', element: <Compose /> },
      { path: 'practice/audio', element: <AudioReview /> },
      { path: 'practice/handsfree', element: <Handsfree /> },
      { path: 'practice/usage', element: <Usage /> },
      { path: 'scenes', element: <Scenes /> },
      { path: 'scenes/:id', element: <SceneDetail /> },
      { path: 'translate', element: <Translate /> },
      { path: 'translate/live', element: <Interpreter /> },
      { path: 'settings', element: <Settings /> },
      { path: 'research', element: <Research /> },
      { path: 'welcome', element: <Welcome /> },
      { path: 'stats', element: <Stats /> },
      { path: '*', element: <Home /> },
    ],
  },
])

/**
 * 起動時のオープニングを出すか。アプリを開くたび（読み込みのたび）に1回。
 * 設定でオフにできる。自動テスト（webdriver）では出さない（?opening を付けたときだけ出す）
 */
function wantsOpening(): boolean {
  if (typeof window === 'undefined') return false
  if (new URLSearchParams(location.search).has('opening')) return true
  if (navigator.webdriver) return false
  return getSettings().opening
}

export function App() {
  const [opening, setOpening] = useState(wantsOpening)
  const close = useCallback(() => setOpening(false), [])
  // オープニングを出さないときは、index.html の幕を外す
  useEffect(() => {
    if (opening || !document.getElementById('boot')) return
    document.getElementById('boot')?.remove()
    applyTheme(getSettings().theme)
  }, [opening])
  return (
    <>
      <RouterProvider router={router} />
      {opening && <Opening onDone={close} />}
    </>
  )
}
