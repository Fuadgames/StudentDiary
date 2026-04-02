import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, increment } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useStore } from '../store';
import { handleFirestoreError, OperationType } from '../lib/utils';
import { ShoppingCart, Check, Clock } from 'lucide-react';

export default function Shop() {
  const { t } = useTranslation();
  const { profile, setProfile } = useStore();
  const [items, setItems] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState(50);
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    if (!profile) return;

    const fetchData = async () => {
      try {
        const itemsQ = query(
          collection(db, 'shopItems'),
          where('classCode', '==', profile.classCode)
        );
        const itemsSnap = await getDocs(itemsQ);
        setItems(itemsSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        if (profile.role === 'student') {
          const purchQ = query(
            collection(db, 'purchases'),
            where('classCode', '==', profile.classCode),
            where('studentUid', '==', profile.uid)
          );
          const purchSnap = await getDocs(purchQ);
          setPurchases(purchSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        } else {
          const purchQ = query(
            collection(db, 'purchases'),
            where('classCode', '==', profile.classCode)
          );
          const purchSnap = await getDocs(purchQ);
          setPurchases(purchSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'shopItems/purchases', auth);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profile]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newItem = {
        classCode: profile?.classCode,
        teacherUid: profile?.uid,
        title,
        price,
        imageUrl: imageUrl || `https://picsum.photos/seed/${title}/400/300`,
        createdAt: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, 'shopItems'), newItem);
      setItems([...items, { id: docRef.id, ...newItem }]);
      setTitle('');
      setPrice(50);
      setImageUrl('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'shopItems', auth);
    }
  };

  const handleBuy = async (item: any) => {
    if (!profile || profile.role !== 'student') return;
    if ((profile.points || 0) < item.price) {
      alert('Not enough points!');
      return;
    }

    try {
      // Deduct points
      const userRef = doc(db, 'users', profile.uid);
      await updateDoc(userRef, {
        points: increment(-item.price)
      });
      setProfile({ ...profile, points: (profile.points || 0) - item.price });

      // Create purchase
      const newPurchase = {
        shopItemId: item.id,
        studentUid: profile.uid,
        classCode: profile.classCode,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, 'purchases'), newPurchase);
      setPurchases([...purchases, { id: docRef.id, ...newPurchase }]);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'purchases', auth);
    }
  };

  const handleApprovePurchase = async (purchaseId: string) => {
    try {
      const purchRef = doc(db, 'purchases', purchaseId);
      await updateDoc(purchRef, { status: 'approved' });
      setPurchases(purchases.map(p => p.id === purchaseId ? { ...p, status: 'approved' } : p));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'purchases', auth);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('Shop')}</h1>
        {profile?.role === 'student' && (
          <div className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-4 py-2 rounded-lg font-bold">
            {profile.points || 0} {t('Points')}
          </div>
        )}
      </div>

      {profile?.role === 'teacher' && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 max-w-2xl mb-8">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Add Item</h2>
          <form onSubmit={handleAddItem} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('Title')}</label>
              <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('Price')} (Points)</label>
              <input required type="number" value={price} onChange={e => setPrice(Number(e.target.value))} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Image URL (optional)</label>
              <input type="text" value={imageUrl} onChange={e => setImageUrl(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">{t('Create')}</button>
          </form>
        </div>
      )}

      {profile?.role === 'teacher' && purchases.filter(p => p.status === 'pending').length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 mb-8">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Pending Purchases</h2>
          <div className="space-y-4">
            {purchases.filter(p => p.status === 'pending').map(purch => {
              const item = items.find(i => i.id === purch.shopItemId);
              return (
                <div key={purch.id} className="flex items-center justify-between p-4 border border-gray-100 dark:border-gray-700 rounded-xl">
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">{item?.title || 'Unknown Item'}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Student UID: {purch.studentUid}</p>
                  </div>
                  <button onClick={() => handleApprovePurchase(purch.id)} className="px-4 py-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg font-medium">Approve</button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map(item => {
          const myPurchase = profile?.role === 'student' ? purchases.find(p => p.shopItemId === item.id) : null;
          
          return (
            <div key={item.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
              <img src={item.imageUrl} alt={item.title} className="w-full h-48 object-cover" referrerPolicy="no-referrer" />
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">{item.title}</h3>
                <div className="mt-auto flex items-center justify-between">
                  <span className="font-bold text-purple-600 dark:text-purple-400">{item.price} pts</span>
                  
                  {profile?.role === 'student' && (
                    myPurchase ? (
                      <div className={`flex items-center gap-1 text-sm font-medium ${myPurchase.status === 'approved' ? 'text-green-600' : 'text-yellow-600'}`}>
                        {myPurchase.status === 'approved' ? <Check className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                        {t(myPurchase.status === 'approved' ? 'Bought' : 'Pending')}
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleBuy(item)}
                        disabled={(profile.points || 0) < item.price}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Buy
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {items.length === 0 && (
          <div className="col-span-full p-8 text-center text-gray-500 dark:text-gray-400">No items in the shop yet.</div>
        )}
      </div>
    </div>
  );
}
