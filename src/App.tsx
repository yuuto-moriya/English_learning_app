import { lazy } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { Layout } from './components/Layout'

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
const Interpreter = lazy(() => import('./pages/Interpreter'))

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

export function App() {
  return <RouterProvider router={router} />
}
