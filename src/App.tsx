import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { useStore } from './store';
import './i18n';

// Pages
import AuthPage from './pages/AuthPage';
import Layout from './components/Layout';
import Home from './pages/Home';
import ExtraWork from './pages/ExtraWork';
import Shop from './pages/Shop';
import Settings from './pages/Settings';
import News from './pages/News';
import Timetable from './pages/Timetable';
import Students from './pages/Students';

export default function App() {
  const { setUser, setProfile, setAuthReady, isAuthReady, user, profile, setTheme, setLanguage } = useStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const docRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data() as any;
            setProfile(data);
            if (data.theme) setTheme(data.theme);
            if (data.language) setLanguage(data.language);
          } else {
            setProfile(null);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      } else {
        setProfile(null);
      }
      setAuthReady(true);
    });

    return () => unsubscribe();
  }, [setUser, setProfile, setAuthReady, setTheme, setLanguage]);

  if (!isAuthReady) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">Loading...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        {!user || !profile ? (
          <Route path="*" element={<AuthPage />} />
        ) : (
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            {profile.role === 'teacher' && <Route path="students" element={<Students />} />}
            <Route path="extra-work" element={<ExtraWork />} />
            <Route path="shop" element={<Shop />} />
            <Route path="news" element={<News />} />
            <Route path="timetable" element={<Timetable />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        )}
      </Routes>
    </BrowserRouter>
  );
}
