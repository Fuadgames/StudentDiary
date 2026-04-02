import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, query, where, getDocs, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useStore } from '../store';
import { handleFirestoreError, OperationType } from '../lib/utils';
import { FileText, CheckCircle, Clock } from 'lucide-react';

export default function ExtraWork() {
  const { t } = useTranslation();
  const { profile } = useStore();
  const [activeTab, setActiveTab] = useState(profile?.role === 'teacher' ? 'give' : 'todo');
  
  // Data state
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [points, setPoints] = useState(10);

  useEffect(() => {
    if (!profile) return;

    const fetchData = async () => {
      try {
        const assignmentsQ = query(
          collection(db, 'assignments'),
          where('classCode', '==', profile.classCode)
        );
        const assignmentsSnap = await getDocs(assignmentsQ);
        const assigns = assignmentsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setAssignments(assigns);

        if (profile.role === 'student') {
          const submissionsQ = query(
            collection(db, 'submissions'),
            where('classCode', '==', profile.classCode),
            where('studentUid', '==', profile.uid)
          );
          const submissionsSnap = await getDocs(submissionsQ);
          setSubmissions(submissionsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        } else {
          const submissionsQ = query(
            collection(db, 'submissions'),
            where('classCode', '==', profile.classCode)
          );
          const submissionsSnap = await getDocs(submissionsQ);
          setSubmissions(submissionsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'assignments/submissions', auth);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profile]);

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newAssignment = {
        classCode: profile?.classCode,
        teacherUid: profile?.uid,
        title,
        description,
        points,
        createdAt: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, 'assignments'), newAssignment);
      setAssignments([...assignments, { id: docRef.id, ...newAssignment }]);
      setTitle('');
      setDescription('');
      setPoints(10);
      alert('Assignment created!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'assignments', auth);
    }
  };

  const handleSubmitAssignment = async (assignmentId: string) => {
    try {
      const newSubmission = {
        assignmentId,
        studentUid: profile?.uid,
        classCode: profile?.classCode,
        status: 'review',
        content: 'Submitted work', // Simplified for now
        createdAt: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, 'submissions'), newSubmission);
      setSubmissions([...submissions, { id: docRef.id, ...newSubmission }]);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'submissions', auth);
    }
  };

  const handleGradeSubmission = async (submissionId: string, grade: number, pointsAwarded: number) => {
    try {
      const subRef = doc(db, 'submissions', submissionId);
      await updateDoc(subRef, {
        status: 'completed',
        grade,
        pointsAwarded
      });
      setSubmissions(submissions.map(s => s.id === submissionId ? { ...s, status: 'completed', grade, pointsAwarded } : s));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'submissions', auth);
    }
  };

  if (loading) return <div>Loading...</div>;

  const studentTabs = [
    { id: 'todo', label: 'To Do' },
    { id: 'review', label: 'In Review' },
    { id: 'completed', label: 'Completed' }
  ];

  const teacherTabs = [
    { id: 'give', label: 'Give Assignment' },
    { id: 'review', label: 'Review Assignments' }
  ];

  const tabs = profile?.role === 'teacher' ? teacherTabs : studentTabs;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('Extra Work')}</h1>

      <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto pb-px scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            {t(tab.label)}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {/* Teacher: Give Assignment */}
        {profile?.role === 'teacher' && activeTab === 'give' && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 max-w-2xl">
            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('Title')}</label>
                <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('Description')}</label>
                <textarea required value={description} onChange={e => setDescription(e.target.value)} rows={4} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('Points')}</label>
                <input required type="number" value={points} onChange={e => setPoints(Number(e.target.value))} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
              <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">{t('Create')}</button>
            </form>
          </div>
        )}

        {/* Teacher: Review Assignments */}
        {profile?.role === 'teacher' && activeTab === 'review' && (
          <div className="space-y-4">
            {submissions.filter(s => s.status === 'review').map(sub => {
              const assignment = assignments.find(a => a.id === sub.assignmentId);
              return (
                <div key={sub.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">{assignment?.title || 'Unknown'}</h3>
                    <p className="text-gray-500 dark:text-gray-400">Student UID: {sub.studentUid}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleGradeSubmission(sub.id, 5, assignment?.points || 10)} className="px-4 py-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg font-medium">Approve & Grade</button>
                  </div>
                </div>
              );
            })}
            {submissions.filter(s => s.status === 'review').length === 0 && <p className="text-gray-500 dark:text-gray-400">No submissions to review.</p>}
          </div>
        )}

        {/* Student: To Do */}
        {profile?.role === 'student' && activeTab === 'todo' && (
          <div className="space-y-4">
            {assignments.filter(a => !submissions.some(s => s.assignmentId === a.id)).map(assignment => (
              <div key={assignment.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-500" />
                    {assignment.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mt-2">{assignment.description}</p>
                  <p className="text-sm text-purple-600 dark:text-purple-400 font-medium mt-2">+{assignment.points} {t('Points')}</p>
                </div>
                <div className="flex items-center">
                  <button onClick={() => handleSubmitAssignment(assignment.id)} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium whitespace-nowrap">Submit</button>
                </div>
              </div>
            ))}
            {assignments.filter(a => !submissions.some(s => s.assignmentId === a.id)).length === 0 && <p className="text-gray-500 dark:text-gray-400">No assignments to do.</p>}
          </div>
        )}

        {/* Student: In Review */}
        {profile?.role === 'student' && activeTab === 'review' && (
          <div className="space-y-4">
            {submissions.filter(s => s.status === 'review').map(sub => {
              const assignment = assignments.find(a => a.id === sub.assignmentId);
              return (
                <div key={sub.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4 opacity-75">
                  <Clock className="w-6 h-6 text-yellow-500" />
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">{assignment?.title || 'Unknown'}</h3>
                    <p className="text-gray-500 dark:text-gray-400">Waiting for teacher review...</p>
                  </div>
                </div>
              );
            })}
            {submissions.filter(s => s.status === 'review').length === 0 && <p className="text-gray-500 dark:text-gray-400">No assignments in review.</p>}
          </div>
        )}

        {/* Student: Completed */}
        {profile?.role === 'student' && activeTab === 'completed' && (
          <div className="space-y-4">
            {submissions.filter(s => s.status === 'completed').map(sub => {
              const assignment = assignments.find(a => a.id === sub.assignmentId);
              return (
                <div key={sub.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <CheckCircle className="w-6 h-6 text-green-500" />
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white">{assignment?.title || 'Unknown'}</h3>
                      <p className="text-gray-500 dark:text-gray-400">Grade: {sub.grade} | Points: +{sub.pointsAwarded}</p>
                    </div>
                  </div>
                </div>
              );
            })}
            {submissions.filter(s => s.status === 'completed').length === 0 && <p className="text-gray-500 dark:text-gray-400">No completed assignments.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
