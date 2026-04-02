import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useStore } from '../store';
import { Trophy, Star, BookOpen, Award, AlertCircle, MessageSquare, FileText } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../lib/utils';
import { auth } from '../firebase';

export default function Home() {
  const { t } = useTranslation();
  const { profile } = useStore();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [absences, setAbsences] = useState(0);
  const [completedAssignments, setCompletedAssignments] = useState<any[]>([]);
  const [assignmentsList, setAssignmentsList] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;

    const fetchData = async () => {
      try {
        // Fetch Leaderboard (Students in the same class)
        const usersQ = query(
          collection(db, 'users'),
          where('classCode', '==', profile.classCode),
          where('role', '==', 'student')
        );
        const usersSnap = await getDocs(usersQ);
        const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        users.sort((a: any, b: any) => (b.points || 0) - (a.points || 0));
        setLeaderboard(users);

        // Fetch Grades and other student-specific data
        if (profile.role === 'student') {
          const gradesQ = query(
            collection(db, 'grades'),
            where('classCode', '==', profile.classCode),
            where('studentUid', '==', profile.uid),
            orderBy('createdAt', 'desc')
          );
          const gradesSnap = await getDocs(gradesQ);
          setGrades(gradesSnap.docs.map(d => ({ id: d.id, ...d.data() })));

          const attQ = query(
            collection(db, 'attendance'),
            where('classCode', '==', profile.classCode),
            where('studentUid', '==', profile.uid),
            where('status', '==', 'absent')
          );
          const attSnap = await getDocs(attQ);
          setAbsences(attSnap.docs.length);

          const subQ = query(
            collection(db, 'submissions'),
            where('classCode', '==', profile.classCode),
            where('studentUid', '==', profile.uid),
            where('status', '==', 'completed')
          );
          const subSnap = await getDocs(subQ);
          setCompletedAssignments(subSnap.docs.map(d => ({ id: d.id, ...d.data() })));

          const assignQ = query(
            collection(db, 'assignments'),
            where('classCode', '==', profile.classCode)
          );
          const assignSnap = await getDocs(assignQ);
          setAssignmentsList(assignSnap.docs.map(d => ({ id: d.id, ...d.data() })));

          const revQ = query(
            collection(db, 'reviews'),
            where('classCode', '==', profile.classCode),
            where('studentUid', '==', profile.uid),
            orderBy('createdAt', 'desc')
          );
          const revSnap = await getDocs(revQ);
          setReviews(revSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'users/grades', auth);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profile]);

  if (loading) return <div>Loading...</div>;

  const highestGrade = grades.length > 0 ? Math.max(...grades.map(g => g.value)) : 0;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('Home')}</h1>

      {profile?.role === 'student' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
            <div className="bg-yellow-100 dark:bg-yellow-900/30 p-4 rounded-xl">
              <Star className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('Highest Grade')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{highestGrade || '-'}</p>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-xl">
              <Award className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('Points')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{profile.points || 0}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
            <div className="bg-purple-100 dark:bg-purple-900/30 p-4 rounded-xl">
              <BookOpen className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('Total Grades')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{grades.length}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
            <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-xl">
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('Absences')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{absences}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Leaderboard */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('Leaderboard')}</h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {leaderboard.map((student, index) => (
              <div key={student.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="w-8 text-center font-bold text-gray-400 dark:text-gray-500">#{index + 1}</div>
                {student.avatarUrl ? (
                  <img src={student.avatarUrl} alt="avatar" className="w-10 h-10 rounded-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 font-bold">
                    {student.name[0]}
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">{student.name} {student.surname}</p>
                </div>
                <div className="font-bold text-blue-600 dark:text-blue-400">{student.points || 0} pts</div>
              </div>
            ))}
            {leaderboard.length === 0 && (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">No students found</div>
            )}
          </div>
        </div>

        {/* Grades (Student Only) */}
        {profile?.role === 'student' && (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('Grades')}</h2>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {grades.map((grade) => (
                  <div key={grade.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{grade.subject}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(grade.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-lg">
                      {grade.value}
                    </div>
                  </div>
                ))}
                {grades.length === 0 && (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">No grades yet</div>
                )}
              </div>
            </div>

            {/* Assignments & Grades */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
                <FileText className="w-6 h-6 text-indigo-500" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('Assignments')}</h2>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {completedAssignments.map((sub) => {
                  const assignment = assignmentsList.find(a => a.id === sub.assignmentId);
                  return (
                    <div key={sub.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{assignment?.title || 'Unknown'}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">+{sub.pointsAwarded} {t('Points')}</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 font-bold text-lg">
                        {sub.grade}
                      </div>
                    </div>
                  );
                })}
                {completedAssignments.length === 0 && (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">No completed assignments yet</div>
                )}
              </div>
            </div>

            {/* Reviews */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
                <MessageSquare className="w-6 h-6 text-teal-500" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('Reviews')}</h2>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {reviews.map((review) => (
                  <div key={review.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{review.text}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{new Date(review.createdAt).toLocaleDateString()}</p>
                  </div>
                ))}
                {reviews.length === 0 && (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">No reviews yet</div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
