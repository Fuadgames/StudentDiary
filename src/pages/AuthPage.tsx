import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { GraduationCap, BookOpen, LogIn } from 'lucide-react';
import { cn, handleFirestoreError, OperationType } from '../lib/utils';

type AuthMode = 'select' | 'student' | 'teacher' | 'login';

export default function AuthPage() {
  const { t, i18n } = useTranslation();
  const [mode, setMode] = useState<AuthMode>('select');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [classCode, setClassCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const generateClassCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        const code = mode === 'teacher' ? generateClassCode() : classCode;
        
        const userData: any = {
          uid: user.uid,
          role: mode,
          name,
          surname,
          email,
          classCode: code,
          theme: 'light',
          language: i18n.language,
          createdAt: new Date().toISOString()
        };

        if (mode === 'student') {
          userData.points = 0;
        }

        try {
          await setDoc(doc(db, 'users', user.uid), userData);
          if (mode === 'teacher') {
            await setDoc(doc(db, 'classes', code), {
              classCode: code,
              teacherUid: user.uid,
              createdAt: new Date().toISOString()
            });
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, 'users/classes', auth);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  if (mode === 'select') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="absolute top-4 right-4 flex gap-2">
          {['en', 'ru', 'zh', 'ja', 'az', 'tr', 'ar', 'uk'].map(lang => (
            <button key={lang} onClick={() => changeLanguage(lang)} className="text-sm px-2 py-1 bg-white dark:bg-gray-800 rounded shadow">
              {lang.toUpperCase()}
            </button>
          ))}
        </div>
        
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">StudentsDiary</h1>
            <p className="text-gray-500 dark:text-gray-400">{t('Who are you?')}</p>
          </div>

          <div className="space-y-4">
            <button onClick={() => setMode('student')} className="w-full flex items-center p-4 border-2 border-blue-100 dark:border-blue-900 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors group">
              <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg group-hover:scale-110 transition-transform">
                <GraduationCap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="ml-4 text-lg font-medium text-gray-900 dark:text-white">{t('Student')}</span>
            </button>

            <button onClick={() => setMode('teacher')} className="w-full flex items-center p-4 border-2 border-purple-100 dark:border-purple-900 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors group">
              <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-lg group-hover:scale-110 transition-transform">
                <BookOpen className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="ml-4 text-lg font-medium text-gray-900 dark:text-white">{t('Teacher')}</span>
            </button>

            <button onClick={() => setMode('login')} className="w-full flex items-center p-4 border-2 border-gray-100 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group">
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg group-hover:scale-110 transition-transform">
                <LogIn className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </div>
              <span className="ml-4 text-lg font-medium text-gray-900 dark:text-white">{t('I already have an account')}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
        <button onClick={() => setMode('select')} className="text-sm text-blue-600 dark:text-blue-400 mb-6 hover:underline">
          &larr; Back
        </button>
        
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          {mode === 'login' ? t('I already have an account') : t(mode === 'student' ? 'Student' : 'Teacher')}
        </h2>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode !== 'login' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('Name')}</label>
                  <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('Surname')}</label>
                  <input required type="text" value={surname} onChange={e => setSurname(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              {mode === 'student' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('Class Code')}</label>
                  <input required type="text" value={classCode} onChange={e => setClassCode(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none uppercase" />
                </div>
              )}
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('Email')}</label>
            <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('Password')}</label>
            <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          <button disabled={loading} type="submit" className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50">
            {loading ? '...' : t('Continue')}
          </button>
        </form>
      </div>
    </div>
  );
}
