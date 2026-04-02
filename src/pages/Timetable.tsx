import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, query, where, getDocs, addDoc, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useStore } from '../store';
import { handleFirestoreError, OperationType } from '../lib/utils';
import { Calendar } from 'lucide-react';

export default function Timetable() {
  const { t } = useTranslation();
  const { profile } = useStore();
  const [timetable, setTimetable] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [day, setDay] = useState('Monday');
  const [subject, setSubject] = useState('');
  const [time, setTime] = useState('');

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    if (!profile) return;

    const fetchTimetable = async () => {
      try {
        const q = query(
          collection(db, 'timetable'),
          where('classCode', '==', profile.classCode)
        );
        const snap = await getDocs(q);
        setTimetable(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'timetable', auth);
      } finally {
        setLoading(false);
      }
    };

    fetchTimetable();
  }, [profile]);

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newEntry = {
        classCode: profile?.classCode,
        teacherUid: profile?.uid,
        day,
        subject,
        time,
        createdAt: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, 'timetable'), newEntry);
      setTimetable([...timetable, { id: docRef.id, ...newEntry }]);
      setSubject('');
      setTime('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'timetable', auth);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('Timetable')}</h1>

      {profile?.role === 'teacher' && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 max-w-2xl">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Add Entry</h2>
          <form onSubmit={handleAddEntry} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Day</label>
                <select value={day} onChange={e => setDay(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                  {days.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time</label>
                <input required type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
                <input required type="text" value={subject} onChange={e => setSubject(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
            </div>
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Add</button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {days.map(d => {
          const dayEntries = timetable.filter(t => t.day === d).sort((a, b) => a.time.localeCompare(b.time));
          if (dayEntries.length === 0) return null;

          return (
            <div key={d} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">{d}</h3>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {dayEntries.map(entry => (
                  <div key={entry.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <span className="font-medium text-gray-900 dark:text-white">{entry.subject}</span>
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{entry.time}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {timetable.length === 0 && (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">Timetable is empty.</div>
      )}
    </div>
  );
}
