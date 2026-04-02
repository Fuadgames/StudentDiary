import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, query, where, getDocs, addDoc, doc, updateDoc } from 'firebase/firestore';
import { updatePassword } from 'firebase/auth';
import { db, auth } from '../firebase';
import { useStore } from '../store';
import { handleFirestoreError, OperationType } from '../lib/utils';
import { User, Moon, Sun, Globe } from 'lucide-react';

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { profile, setProfile, theme, setTheme, language, setLanguage } = useStore();
  
  const [name, setName] = useState(profile?.name || '');
  const [surname, setSurname] = useState(profile?.surname || '');
  const [password, setPassword] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  
  const [avatarRequests, setAvatarRequests] = useState<any[]>([]);

  useEffect(() => {
    if (profile?.role === 'teacher') {
      const fetchRequests = async () => {
        try {
          const q = query(
            collection(db, 'avatarRequests'),
            where('classCode', '==', profile.classCode),
            where('status', '==', 'pending')
          );
          const snap = await getDocs(q);
          setAvatarRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, 'avatarRequests', auth);
        }
      };
      fetchRequests();
    }
  }, [profile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    try {
      const userRef = doc(db, 'users', profile.uid);
      await updateDoc(userRef, { name, surname });
      setProfile({ ...profile, name, surname });
      alert('Profile updated');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'users', auth);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !password) return;
    try {
      await updatePassword(auth.currentUser, password);
      setPassword('');
      alert('Password updated');
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleAvatarRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !avatarUrl) return;
    try {
      await addDoc(collection(db, 'avatarRequests'), {
        studentUid: profile.uid,
        classCode: profile.classCode,
        newAvatarUrl: avatarUrl,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      setAvatarUrl('');
      alert('Avatar request sent to teacher');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'avatarRequests', auth);
    }
  };

  const handleApproveAvatar = async (request: any, approved: boolean) => {
    try {
      const reqRef = doc(db, 'avatarRequests', request.id);
      await updateDoc(reqRef, { status: approved ? 'approved' : 'rejected' });
      
      if (approved) {
        const userRef = doc(db, 'users', request.studentUid);
        await updateDoc(userRef, { avatarUrl: request.newAvatarUrl });
      }
      
      setAvatarRequests(avatarRequests.filter(r => r.id !== request.id));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'avatarRequests/users', auth);
    }
  };

  const toggleTheme = async () => {
    if (!profile) return;
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    try {
      await updateDoc(doc(db, 'users', profile.uid), { theme: newTheme });
    } catch (error) {
      console.error(error);
    }
  };

  const changeLang = async (lng: string) => {
    if (!profile) return;
    i18n.changeLanguage(lng);
    setLanguage(lng);
    try {
      await updateDoc(doc(db, 'users', profile.uid), { language: lng });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('Settings')}</h1>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
          <User className="w-5 h-5" /> Profile
        </h2>
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('Name')}</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('Surname')}</label>
              <input type="text" value={surname} onChange={e => setSurname(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
          </div>
          <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Save Profile</button>
        </form>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">{t('Change Password')}</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>
          <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Update Password</button>
        </form>
      </div>

      {profile?.role === 'student' && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Change Avatar</h2>
          <form onSubmit={handleAvatarRequest} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Avatar Image URL</label>
              <input type="text" value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Request Change</button>
          </form>
        </div>
      )}

      {profile?.role === 'teacher' && avatarRequests.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Avatar Requests</h2>
          <div className="space-y-4">
            {avatarRequests.map(req => (
              <div key={req.id} className="flex items-center justify-between p-4 border border-gray-100 dark:border-gray-700 rounded-xl">
                <div className="flex items-center gap-4">
                  <img src={req.newAvatarUrl} alt="New avatar" className="w-12 h-12 rounded-full object-cover" referrerPolicy="no-referrer" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">Student UID: {req.studentUid}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleApproveAvatar(req, false)} className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg font-medium">Reject</button>
                  <button onClick={() => handleApproveAvatar(req, true)} className="px-4 py-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg font-medium">Approve</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Preferences</h2>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              {theme === 'light' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              <span className="font-medium">{t('Theme')}</span>
            </div>
            <button onClick={toggleTheme} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg font-medium text-gray-900 dark:text-white">
              {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <Globe className="w-5 h-5" />
              <span className="font-medium">{t('Language')}</span>
            </div>
            <select 
              value={language} 
              onChange={(e) => changeLang(e.target.value)}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg font-medium text-gray-900 dark:text-white border-none outline-none"
            >
              <option value="en">English</option>
              <option value="ru">Русский</option>
              <option value="zh">中文</option>
              <option value="ja">日本語</option>
              <option value="az">Azərbaycan</option>
              <option value="tr">Türkçe</option>
              <option value="ar">العربية</option>
              <option value="uk">Українська</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
