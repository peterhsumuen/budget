import { useEffect, useState } from 'react';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import {
  collection,
  onSnapshot,
  query,
  serverTimestamp,
  addDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';

import { auth, db } from './firebase';
import ProjectForm from './components/ProjectForm';
import ProjectSelector from './components/ProjectSelector';
import ExpenseForm from './components/ExpenseForm';
import PaymentForm from './components/PaymentForm';
import SalaryForm from './components/SalaryForm';
import TransactionList from './components/TransactionList';
import ProjectSummary from './components/ProjectSummary';

const appId = 'default-app-id';

function App() {
  const [userId, setUserId] = useState<string | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('transactions');
  const [loading, setLoading] = useState(true);

  // Firebase auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        await signInAnonymously(auth);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch projects
  useEffect(() => {
    if (!userId) return;
    const ref = collection(db, `artifacts/${appId}/public/data/projects`);
    const q = query(ref);
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setProjects(data);
      if (!selectedProjectId && data.length > 0) {
        setSelectedProjectId(data[0].id);
      }
    });
    return () => unsub();
  }, [userId]);

  // Fetch transactions
  useEffect(() => {
    if (!selectedProjectId) return;

    const types = ['expenses', 'payments', 'salaries'];
    const unsubList = types.map((type) => {
      const ref = collection(db, `artifacts/${appId}/public/data/projects/${selectedProjectId}/${type}`);
      return onSnapshot(ref, (snap) => {
        const fetched = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          type: type.slice(0, -1), // remove 's'
        }));
        setTransactions((prev) => {
          const others = prev.filter((t) => t.type !== type.slice(0, -1));
          return [...others, ...fetched].sort((a, b) =>
            (b.timestamp?.toDate() ?? 0) - (a.timestamp?.toDate() ?? 0)
          );
        });
      });
    });

    return () => unsubList.forEach((unsub) => unsub());
  }, [selectedProjectId]);

  // Add project
  const addProject = async (name: string, budget: number) => {
    try {
      const ref = collection(db, `artifacts/${appId}/public/data/projects`);
      const docRef = await addDoc(ref, {
        name,
        budget,
        userId,
        createdAt: serverTimestamp(),
      });
      setSelectedProjectId(docRef.id);
    } catch (e) {
      console.error(e);
      setError('Failed to create project.');
    }
  };

  const addTransaction = async (
    type: 'expense' | 'payment' | 'salary',
    name: string,
    amount: number,
    category: string | null = null
  ) => {
    try {
      const ref = collection(
        db,
        `artifacts/${appId}/public/data/projects/${selectedProjectId}/${type}s`
      );
      await addDoc(ref, {
        name,
        amount,
        category,
        timestamp: serverTimestamp(),
      });
    } catch (e) {
      console.error(e);
      setError(`Failed to add ${type}.`);
    }
  };

  const deleteTransaction = async (id: string, type: string) => {
    try {
      const ref = doc(
        db,
        `artifacts/${appId}/public/data/projects/${selectedProjectId}/${type}s/${id}`
      );
      await deleteDoc(ref);
    } catch (e) {
      console.error(e);
      setError(`Failed to delete ${type}.`);
    }
  };

  const current = projects.find((p) => p.id === selectedProjectId);
  const budget = current?.budget || 0;
  const totalExpenses = transactions.filter((t) => t.type === 'expense').reduce((a, b) => a + b.amount, 0);
  const totalPayments = transactions.filter((t) => t.type === 'payment').reduce((a, b) => a + b.amount, 0);
  const totalSalaries = transactions.filter((t) => t.type === 'salary').reduce((a, b) => a + b.amount, 0);
  const net = totalPayments - totalExpenses - totalSalaries;
  const remain = budget - totalExpenses - totalSalaries;

  if (loading) {
    return <div className="text-center mt-20">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 font-sans">
      <header className="text-center py-6 bg-indigo-600 text-white rounded-lg shadow mb-6">
        <h1 className="text-3xl font-bold">Multi-Project Budget Tracker</h1>
        {userId && <p className="text-xs mt-1">User ID: {userId}</p>}
      </header>

      {error && <div className="bg-red-100 text-red-800 p-4 rounded mb-4">{error}</div>}

      <ProjectForm addProject={addProject} />
      <ProjectSelector
        projects={projects}
        selectedProjectId={selectedProjectId}
        setSelectedProjectId={setSelectedProjectId}
      />

      {selectedProjectId && (
        <>
          <div className="flex justify-center mt-6 gap-4">
            <button
              className={`px-4 py-2 rounded ${
                activeTab === 'transactions'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
              onClick={() => setActiveTab('transactions')}
            >
              Transactions
            </button>
            <button
              className={`px-4 py-2 rounded ${
                activeTab === 'budget'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
              onClick={() => setActiveTab('budget')}
            >
              Project Summary
            </button>
          </div>

          {activeTab === 'transactions' && (
            <>
              <ExpenseForm addTransaction={addTransaction} />
              <PaymentForm addTransaction={addTransaction} />
              <SalaryForm addTransaction={addTransaction} />
              <TransactionList
                transactions={transactions}
                deleteTransaction={deleteTransaction}
              />
            </>
          )}

          {activeTab === 'budget' && (
            <ProjectSummary
              projectBudget={budget}
              totalExpenses={totalExpenses}
              totalPayments={totalPayments}
              totalSalaries={totalSalaries}
              netBalance={net}
              remainingBudget={remain}
            />
          )}
        </>
      )}
    </div>
  );
}

export default App;
