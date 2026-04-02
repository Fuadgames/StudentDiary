import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, increment } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useStore } from '../store';
import { handleFirestoreError, OperationType } from '../lib/utils';
import { Check, Clock, X, Star, Award, MessageSquare } from 'lucide-react';

export default function Students() {
  const { t } = useTranslation();
  const { profile } = useStore();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [gradeModalOpen, setGradeModalOpen] = useState(false);
  const [pointsModalOpen, setPointsModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [gradeValue, setGradeValue] = useState<number>(5);
  const [pointsValue, setPointsValue] = useState<number>(10);
  const [reviewText, setReviewText] = useState('');

  useEffect(() => {
    if (!profile || profile.role !== 'teacher') return;

    const fetchStudents = async () => {
      try {
        const q = query(
          collection(db, 'users'),
          where('classCode', '==', profile.classCode),
          where('role', '==', 'student')
        );
        const snap = await getDocs(q);
        setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'users', auth);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [profile]);

  const handleAttendance = async (studentUid: string, status: 'present' | 'late' | 'absent') => {
    try {
      await addDoc(collection(db, 'attendance'), {
        studentUid,
        classCode: profile?.classCode,
        status,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      });
      alert(`Attendance marked as ${status}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'attendance', auth);
    }
  };

  const handleGiveGrade = async () => {
    if (!selectedStudent || !subject) return;
    try {
      await addDoc(collection(db, 'grades'), {
        studentUid: selectedStudent.uid,
        classCode: profile?.classCode,
        teacherUid: profile?.uid,
        value: gradeValue,
        subject,
        createdAt: new Date().toISOString()
      });
      setGradeModalOpen(false);
      setSubject('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'grades', auth);
    }
  };

  const handleGivePoints = async () => {
    if (!selectedStudent) return;
    try {
      const studentRef = doc(db, 'users', selectedStudent.uid);
      await updateDoc(studentRef, {
        points: increment(pointsValue)
      });
      
      // Update local state
      setStudents(students.map(s => 
        s.uid === selectedStudent.uid ? { ...s, points: (s.points || 0) + pointsValue } : s
      ));
      
      setPointsModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'users', auth);
    }
  };

  const handleLeaveReview = async () => {
    if (!selectedStudent || !reviewText) return;
    try {
      await addDoc(collection(db, 'reviews'), {
        studentUid: selectedStudent.uid,
        classCode: profile?.classCode,
        teacherUid: profile?.uid,
        text: reviewText,
        createdAt: new Date().toISOString()
      });
      setReviewModalOpen(false);
      setReviewText('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'reviews', auth);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('Students')}</h1>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {students.map((student) => (
            <div key={student.id} className="p-6 flex flex-col xl:flex-row xl:items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div className="flex items-center gap-4">
                {student.avatarUrl ? (
                  <img src={student.avatarUrl} alt="avatar" className="w-12 h-12 rounded-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 font-bold text-xl">
                    {student.name[0]}
                  </div>
                )}
                <div>
                  <p className="font-bold text-lg text-gray-900 dark:text-white">{student.name} {student.surname}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{student.points || 0} {t('Points')}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => { setSelectedStudent(student); setGradeModalOpen(true); }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 rounded-lg transition-colors font-medium"
                >
                  <Star className="w-4 h-4" />
                  {t('Grade')}
                </button>
                <button
                  onClick={() => { setSelectedStudent(student); setPointsModalOpen(true); }}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:hover:bg-purple-900/50 rounded-lg transition-colors font-medium"
                >
                  <Award className="w-4 h-4" />
                  {t('Give Points')}
                </button>
                <button
                  onClick={() => { setSelectedStudent(student); setReviewModalOpen(true); }}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-100 text-teal-700 hover:bg-teal-200 dark:bg-teal-900/30 dark:text-teal-400 dark:hover:bg-teal-900/50 rounded-lg transition-colors font-medium"
                >
                  <MessageSquare className="w-4 h-4" />
                  {t('Leave Review')}
                </button>
                <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 mx-2 hidden sm:block"></div>
                <button
                  onClick={() => handleAttendance(student.uid, 'present')}
                  className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 rounded-lg transition-colors font-medium"
                >
                  <Check className="w-4 h-4" />
                  {t('Present')}
                </button>
                <button
                  onClick={() => handleAttendance(student.uid, 'late')}
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:hover:bg-yellow-900/50 rounded-lg transition-colors font-medium"
                >
                  <Clock className="w-4 h-4" />
                  {t('Late')}
                </button>
                <button
                  onClick={() => handleAttendance(student.uid, 'absent')}
                  className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 rounded-lg transition-colors font-medium"
                >
                  <X className="w-4 h-4" />
                  {t('Absent')}
                </button>
              </div>
            </div>
          ))}
          {students.length === 0 && (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">No students found in this class.</div>
          )}
        </div>
      </div>

      {/* Grade Modal */}
      {gradeModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">{t('Grade')} - {selectedStudent?.name}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
                <input type="text" value={subject} onChange={e => setSubject(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Grade (1-5)</label>
                <input type="number" min="1" max="5" value={gradeValue} onChange={e => setGradeValue(Number(e.target.value))} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button onClick={() => setGradeModalOpen(false)} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
                <button onClick={handleGiveGrade} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Points Modal */}
      {pointsModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">{t('Give Points')} - {selectedStudent?.name}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Points</label>
                <input type="number" value={pointsValue} onChange={e => setPointsValue(Number(e.target.value))} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button onClick={() => setPointsModalOpen(false)} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
                <button onClick={handleGivePoints} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">{t('Leave Review')} - {selectedStudent?.name}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('Write a review')}</label>
                <textarea rows={4} value={reviewText} onChange={e => setReviewText(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"></textarea>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button onClick={() => setReviewModalOpen(false)} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
                <button onClick={handleLeaveReview} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
