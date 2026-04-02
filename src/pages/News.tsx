import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, query, where, getDocs, addDoc, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useStore } from '../store';
import { handleFirestoreError, OperationType } from '../lib/utils';
import { Newspaper } from 'lucide-react';

export default function News() {
  const { t } = useTranslation();
  const { profile } = useStore();
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (!profile) return;

    const fetchNews = async () => {
      try {
        const q = query(
          collection(db, 'news'),
          where('classCode', '==', profile.classCode),
          orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        setNews(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'news', auth);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [profile]);

  const handlePostNews = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newPost = {
        classCode: profile?.classCode,
        teacherUid: profile?.uid,
        title,
        content,
        createdAt: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, 'news'), newPost);
      setNews([{ id: docRef.id, ...newPost }, ...news]);
      setTitle('');
      setContent('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'news', auth);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('News')}</h1>

      {profile?.role === 'teacher' && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 max-w-2xl">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Post News</h2>
          <form onSubmit={handlePostNews} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('Title')}</label>
              <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Content</label>
              <textarea required value={content} onChange={e => setContent(e.target.value)} rows={4} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"></textarea>
            </div>
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Post</button>
          </form>
        </div>
      )}

      <div className="space-y-6">
        {news.map(item => (
          <div key={item.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl">
                <Newspaper className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-bold text-xl text-gray-900 dark:text-white">{item.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(item.createdAt).toLocaleString()}</p>
              </div>
            </div>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{item.content}</p>
          </div>
        ))}
        {news.length === 0 && (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">No news yet.</div>
        )}
      </div>
    </div>
  );
}
