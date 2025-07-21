import { useEffect, useState, useCallback } from 'react';
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

import { auth, db } from './firebase'; // <-- 修正這裡：將 '=' 改為 'from'
import ProjectForm from './components/ProjectForm';
import ProjectSelector from './components/ProjectSelector';
import ExpenseForm from './components/ExpenseForm';
import PaymentForm from './components/PaymentForm';
// SalaryForm 不再需要獨立導入
// import SalaryForm from './components/SalaryForm';
import TransactionList from './components/TransactionList';
import ProjectSummary from './components/ProjectSummary';
import type { Transaction } from './types'; // 從共享檔案導入 Transaction 介面

const appId = 'wilmington-7-caef'; // 確保這是您正確的 Firebase 專案 ID

function App() {
  const [userId, setUserId] = useState<string | null>(null);
  const [projects, setProjects] = useState<any[]>([]); // projects 類型可以根據實際數據結構細化
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]); // 使用 Transaction 介面
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
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProjects(data);
      if (!selectedProjectId && data.length > 0) {
        setSelectedProjectId(data[0].id);
      }
      setError(null); // 清除錯誤訊息
    }, (err) => { // 添加錯誤處理
        console.error("Error fetching projects:", err);
        setError("Failed to load projects. Please try again.");
    });
    return () => unsub();
  }, [userId, selectedProjectId]);

  // Fetch transactions
  useEffect(() => {
    if (!selectedProjectId) {
      console.log("Fetch transactions: No project selected yet.");
      setTransactions([]); // Clear transactions if no project is selected
      return;
    }

    console.log("DEBUG: Current selectedProjectId (from useEffect dependency):", selectedProjectId);

    const expensesRef = collection(db, `artifacts/${appId}/public/data/projects/${selectedProjectId}/expenses`);
    const paymentsRef = collection(db, `artifacts/${appId}/public/data/projects/${selectedProjectId}/payments`);
    // salariesRef 不再需要單獨監聽
    // const salariesRef = collection(db, `artifacts/${appId}/public/data/projects/${selectedProjectId}/salaries`);

    // 只需要監聽 expenses 和 payments
    const unsubscribes: (() => void)[] = []; 
    
    let allFetchedTransactions: {
      expenses: Transaction[];
      payments: Transaction[];
      // salaries 不再單獨儲存
    } = {
      expenses: [],
      payments: [],
    };

    const updateAllTransactions = () => {
      const combinedTransactions: Transaction[] = [
        ...allFetchedTransactions.expenses,
        ...allFetchedTransactions.payments,
        // ...allFetchedTransactions.salaries // salaries 不再單獨合併
      ].sort((a, b) => (b.timestamp?.toDate()?.getTime() || 0) - (a.timestamp?.toDate()?.getTime() || 0));
      
      setTransactions(combinedTransactions);
      console.log("DEBUG: Combined and sorted transactions:", combinedTransactions);
      setError(null);
    };

    // Listen for expenses (現在包含薪資費用)
    unsubscribes.push(onSnapshot(expensesRef, (snapshot) => {
      allFetchedTransactions.expenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'expense' } as Transaction));
      console.log(`Fetched expenses data for project ${selectedProjectId}:`, allFetchedTransactions.expenses);
      updateAllTransactions();
    }, (err) => {
      console.error(`Error fetching expenses for project ${selectedProjectId}:`, err);
      setError(`Failed to load expenses. Please try again.`);
    }));

    // Listen for payments
    unsubscribes.push(onSnapshot(paymentsRef, (snapshot) => {
      allFetchedTransactions.payments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'payment' } as Transaction));
      console.log(`Fetched payments data for project ${selectedProjectId}:`, allFetchedTransactions.payments);
      updateAllTransactions();
    }, (err) => {
      console.error(`Error fetching payments for project ${selectedProjectId}:`, err);
      setError(`Failed to load payments. Please try again.`);
    }));

    // salariesRef 的監聽器已移除

    return () => unsubscribes.forEach(unsub => unsub());
  }, [selectedProjectId]);

  // Add project (使用 useCallback 進行性能優化，如果 App 組件頻繁重新渲染)
  const addProject = useCallback(async (name: string, budget: number) => {
    try {
      const ref = collection(db, `artifacts/${appId}/public/data/projects`);
      const docRef = await addDoc(ref, {
        name,
        budget,
        userId,
        createdAt: serverTimestamp(),
      });
      setSelectedProjectId(docRef.id);
      setError(null);
    } catch (e) {
      console.error(e);
      setError('Failed to create project.');
    }
  }, [db, userId]);

  // Add transaction (現在 'salary' 類型會作為 'expense' 類型處理)
  const addTransaction = useCallback(async (
    type: 'expense' | 'payment' | 'salary', // 這裡仍然接受 'salary'，但在內部會轉換為 'expense'
    name: string,
    amount: number,
    category: string | null = null
  ) => {
    console.log(`App: addTransaction called for type: ${type}, name: ${name}, amount: ${amount}, category: ${category}`);
    if (!selectedProjectId) {
        setError("Please select a project before adding a transaction.");
        console.log("App: No project selected for transaction.");
        return;
    }
    try {
      // 如果是 'salary' 類型，則將其視為 'expense' 類型，並設置 category
      const actualType = (type === 'salary') ? 'expense' : type;
      const actualCategory = (type === 'salary') ? 'Salary' : category; // 薪資強制為 'Salary' 類別

      const ref = collection(
        db,
        `artifacts/${appId}/public/data/projects/${selectedProjectId}/${actualType}s`
      );
      await addDoc(ref, {
        name,
        amount,
        category: actualCategory,
        timestamp: serverTimestamp(),
      });
      setError(null);
    } catch (e) {
      console.error(e);
      setError(`Failed to add ${type}.`);
    }
  }, [db, selectedProjectId]);

  // Delete transaction (現在 'salary' 類型會作為 'expense' 類型處理)
  const deleteTransaction = useCallback(async (id: string, type: string) => {
    if (!selectedProjectId) {
        setError("Please select a project before deleting a transaction.");
        return;
    }
    try {
      // 如果是 'salary' 類型，則將其視為 'expense' 類型
      const actualType = (type === 'salary') ? 'expense' : type;
      const ref = doc(
        db,
        `artifacts/${appId}/public/data/projects/${selectedProjectId}/${actualType}s/${id}`
      );
      await deleteDoc(ref);
      setError(null);
    } catch (e) {
      console.error(e);
      setError(`Failed to delete ${type}.`);
    }
  }, [db, selectedProjectId]);

  const current = projects.find((p) => p.id === selectedProjectId);
  const budget = current?.budget || 0;
  
  // 確保 amount 始終被解析為數字
  const totalExpenses = transactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
  const totalPayments = transactions.filter((t) => t.type === 'payment').reduce((sum, t) => sum + Number(t.amount), 0);
  
  // 計算總薪資：篩選出類型為 'expense' 且類別為 'Salary' 的交易
  const totalSalaries = transactions.filter((t) => t.type === 'expense' && t.category === 'Salary').reduce((sum, t) => sum + Number(t.amount), 0);
  
  const net = totalPayments - totalExpenses; // 淨餘額現在只考慮 payments 和 expenses
  const remain = budget - totalExpenses; // 剩餘預算現在只考慮 expenses

  console.log("Current totalSalaries (for rendering):", totalSalaries);
  console.log("Current transactions array (for rendering):", transactions);

  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="text-xl font-semibold text-gray-700">Loading application...</div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6 font-inter text-gray-800">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        <header className="bg-indigo-600 text-white p-6 rounded-t-2xl">
          <h1 className="text-3xl font-bold text-center mb-2">Multi-Project Budget Tracker</h1>
          {userId && (
              <p className="text-sm text-center opacity-90">
                  User ID: <span className="font-mono bg-indigo-700 px-2 py-1 rounded-md text-xs">{userId}</span>
              </p>
          )}
        </header>

        {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md m-4" role="alert">
                <strong className="font-bold">Error!</strong>
                <span className="block sm:inline"> {error}</span>
            </div>
        )}

        <div className="p-6">
          {/* Project Management */}
          <div className="mb-8 p-6 bg-purple-50 rounded-xl shadow-inner">
              <h2 className="text-2xl font-semibold text-purple-700 mb-4">Manage Projects</h2>
              <ProjectForm addProject={addProject} />
              <ProjectSelector
                  projects={projects}
                  selectedProjectId={selectedProjectId}
                  setSelectedProjectId={setSelectedProjectId}
              />
          </div>

          {/* Conditional rendering based on selected project */}
          {selectedProjectId ? (
              <>
                  <h2 className="text-2xl font-bold text-center text-indigo-800 mb-6">
                      Project: {current ? current.name : 'N/A'}
                  </h2>
                  {/* Tab Navigation */}
                  <div className="flex justify-center mb-6 border-b border-gray-200">
                      <button
                          className={`px-6 py-3 text-lg font-medium rounded-t-lg transition-all duration-200 ${
                              activeTab === 'transactions'
                                  ? 'bg-indigo-100 text-indigo-700 border-b-2 border-indigo-500'
                                  : 'text-gray-600 hover:bg-gray-50'
                          }`}
                          onClick={() => setActiveTab('transactions')}
                      >
                          Transactions
                      </button>
                      <button
                          className={`px-6 py-3 text-lg font-medium rounded-t-lg transition-all duration-200 ${
                              activeTab === 'budget'
                                  ? 'bg-indigo-100 text-indigo-700 border-b-2 border-indigo-500'
                                  : 'text-gray-600 hover:bg-gray-50'
                          }`}
                          onClick={() => setActiveTab('budget')}
                      >
                          Project Summary
                      </button>
                  </div>

                  {activeTab === 'transactions' && (
                      <>
                          {/* Expense Form (現在包含薪資類別) */}
                          <div className="mb-8 p-6 bg-blue-50 rounded-xl shadow-inner">
                              <h2 className="text-2xl font-semibold text-indigo-700 mb-4">Add New Expense</h2>
                              <ExpenseForm addTransaction={addTransaction} />
                          </div>

                          {/* Payment Form */}
                          <div className="mb-8 p-6 bg-green-50 rounded-xl shadow-inner">
                              <h2 className="text-2xl font-semibold text-green-700 mb-4">Add New Payment</h2>
                              <PaymentForm addTransaction={addTransaction} />
                          </div>

                          {/* Salary Form 已移除 */}
                          {/* <div className="mb-8 p-6 bg-orange-50 rounded-xl shadow-inner">
                              <h2 className="text-2xl font-semibold text-orange-700 mb-4">Add New Salary</h2>
                              <SalaryForm addTransaction={addTransaction} />
                          </div> */}

                          {/* Transaction List */}
                          <div className="p-6 bg-gray-50 rounded-xl shadow-inner">
                              <h2 className="text-2xl font-semibold text-gray-700 mb-4">All Project Transactions</h2>
                              <TransactionList transactions={transactions} deleteTransaction={deleteTransaction} />
                          </div>
                      </>
                  )}

                  {activeTab === 'budget' && (
                      <ProjectSummary
                          projectBudget={budget}
                          totalExpenses={totalExpenses}
                          totalPayments={totalPayments}
                          totalSalaries={totalSalaries} // 現在傳遞計算出的薪資總額
                          netBalance={net}
                          remainingBudget={remain}
                      />
                  )}
              </>
          ) : (
              <div className="text-center text-gray-600 p-8">
                  <p className="text-xl font-medium mb-4">No project selected.</p>
                  <p>Please create a new project or select an existing one to manage its finances.</p>
              </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
