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
  updateDoc, // Import updateDoc for editing
} from 'firebase/firestore';

import { auth, db } from './firebase';
import ProjectForm from './components/ProjectForm';
import ProjectSelector from './components/ProjectSelector';
import ExpenseForm from './components/ExpenseForm';
import PaymentForm from './components/PaymentForm';
import TransactionList from './components/TransactionList';
import ProjectSummary from './components/ProjectSummary';
import type { Transaction } from './types'; // 從共享檔案導入 Transaction 介面

const appId = 'wilmington-7-caef';

function App() {
  const [userId, setUserId] = useState<string | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('transactions');
  const [loading, setLoading] = useState(true);

  // New state for editing project
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [editProjectName, setEditProjectName] = useState('');
  const [editProjectBudget, setEditProjectBudget] = useState<number>(0);

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
      setError(null);
    }, (err) => {
      console.error("Error fetching projects:", err);
      setError("Failed to load projects. Please try again.");
    });
    return () => unsub();
  }, [userId, selectedProjectId]);

  // Fetch transactions
  useEffect(() => {
    if (!selectedProjectId) {
      console.log("Fetch transactions: No project selected yet.");
      setTransactions([]);
      return;
    }

    console.log("DEBUG: Current selectedProjectId (from useEffect dependency):", selectedProjectId);

    const expensesRef = collection(db, `artifacts/${appId}/public/data/projects/${selectedProjectId}/expenses`);
    const paymentsRef = collection(db, `artifacts/${appId}/public/data/projects/${selectedProjectId}/payments`);

    const unsubscribes: (() => void)[] = [];

    let allFetchedTransactions: {
      expenses: Transaction[];
      payments: Transaction[];
    } = {
      expenses: [],
      payments: [],
    };

    const updateAllTransactions = () => {
      const combinedTransactions: Transaction[] = [
        ...allFetchedTransactions.expenses,
        ...allFetchedTransactions.payments,
      ].sort((a, b) => (b.timestamp?.toDate()?.getTime() || 0) - (a.timestamp?.toDate()?.getTime() || 0));

      setTransactions(combinedTransactions);
      console.log("DEBUG: Combined and sorted transactions:", combinedTransactions);
      setError(null);
    };

    unsubscribes.push(onSnapshot(expensesRef, (snapshot) => {
      allFetchedTransactions.expenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'expense' } as Transaction));
      console.log(`Fetched expenses data for project ${selectedProjectId}:`, allFetchedTransactions.expenses);
      updateAllTransactions();
    }, (err) => {
      console.error(`Error fetching expenses for project ${selectedProjectId}:`, err);
      setError(`Failed to load expenses. Please try again.`);
    }));

    unsubscribes.push(onSnapshot(paymentsRef, (snapshot) => {
      allFetchedTransactions.payments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'payment' } as Transaction));
      console.log(`Fetched payments data for project ${selectedProjectId}:`, allFetchedTransactions.payments);
      updateAllTransactions();
    }, (err) => {
      console.error(`Error fetching payments for project ${selectedProjectId}:`, err);
      setError(`Failed to load payments. Please try again.`);
    }));

    return () => unsubscribes.forEach(unsub => unsub());
  }, [selectedProjectId]);

  // Add project
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

  // Update Project function
  const updateProject = useCallback(async () => {
    if (!selectedProjectId) {
      setError("No project selected for update.");
      return;
    }
    try {
      const projectRef = doc(db, `artifacts/${appId}/public/data/projects/${selectedProjectId}`);
      await updateDoc(projectRef, {
        name: editProjectName,
        budget: editProjectBudget,
      });
      setError(null);
      setIsEditingProject(false); // Exit editing mode
    } catch (e) {
      console.error("Error updating project:", e);
      setError("Failed to update project.");
    }
  }, [db, selectedProjectId, editProjectName, editProjectBudget]);

  // Delete Project function
  const deleteProject = useCallback(async () => {
    if (!selectedProjectId) {
      setError("No project selected for deletion.");
      return;
    }
    if (window.confirm("Are you sure you want to delete this project and all its transactions? This action cannot be undone.")) {
      try {
        // Delete all transactions first (expenses and payments)
        const deleteCollection = async (collectionRef: any) => {
          const snapshot = await onSnapshot(collectionRef);
          const batch = db.batch(); // Firebase provides batch operations for multiple writes
          snapshot.forEach((doc) => {
            batch.delete(doc.ref);
          });
          await batch.commit();
        };

        const expensesRef = collection(db, `artifacts/${appId}/public/data/projects/${selectedProjectId}/expenses`);
        const paymentsRef = collection(db, `artifacts/${appId}/public/data/projects/${selectedProjectId}/payments`);

        await deleteCollection(expensesRef);
        await deleteCollection(paymentsRef);

        // Then delete the project itself
        const projectRef = doc(db, `artifacts/${appId}/public/data/projects/${selectedProjectId}`);
        await deleteDoc(projectRef);

        setSelectedProjectId(null); // Clear selected project after deletion
        setError(null);
      } catch (e) {
        console.error("Error deleting project:", e);
        setError("Failed to delete project.");
      }
    }
  }, [db, selectedProjectId]);


  // Add transaction
  const addTransaction = useCallback(async (
    type: 'expense' | 'payment' | 'salary',
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
      const actualType = (type === 'salary') ? 'expense' : type;
      const actualCategory = (type === 'salary') ? 'Salary' : category;

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

  // Delete transaction
  const deleteTransaction = useCallback(async (id: string, type: string) => {
    if (!selectedProjectId) {
      setError("Please select a project before deleting a transaction.");
      return;
    }
    try {
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

  const totalExpenses = transactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
  const totalPayments = transactions.filter((t) => t.type === 'payment').reduce((sum, t) => sum + Number(t.amount), 0);

  const totalSalaries = transactions.filter((t) => t.type === 'expense' && t.category === 'Salary').reduce((sum, t) => sum + Number(t.amount), 0);

  const net = totalPayments - totalExpenses;
  const remain = budget - totalExpenses;

  console.log("Current totalSalaries (for rendering):", totalSalaries);
  console.log("Current transactions array (for rendering):", transactions);

  // Effect to set editing form values when a project is selected
  useEffect(() => {
    if (isEditingProject && selectedProjectId) {
      const projectToEdit = projects.find(p => p.id === selectedProjectId);
      if (projectToEdit) {
        setEditProjectName(projectToEdit.name);
        setEditProjectBudget(projectToEdit.budget);
      }
    }
  }, [isEditingProject, selectedProjectId, projects]);


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
            {/* New: Edit and Delete Project Buttons/Form */}
            {selectedProjectId && (
              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                {!isEditingProject ? (
                  <>
                    <button
                      className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors"
                      onClick={() => setIsEditingProject(true)}
                    >
                      Edit Selected Project
                    </button>
                    <button
                      className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                      onClick={deleteProject}
                    >
                      Delete Selected Project
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2 w-full">
                    <h3 className="text-xl font-semibold text-gray-700 mt-2">Edit Project Details</h3>
                    <input
                      type="text"
                      className="p-2 border border-gray-300 rounded-md w-full"
                      placeholder="Project Name"
                      value={editProjectName}
                      onChange={(e) => setEditProjectName(e.target.value)}
                    />
                    <input
                      type="number"
                      className="p-2 border border-gray-300 rounded-md w-full"
                      placeholder="Budget"
                      value={editProjectBudget}
                      onChange={(e) => setEditProjectBudget(parseFloat(e.target.value))}
                    />
                    <div className="flex gap-2">
                      <button
                        className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                        onClick={updateProject}
                      >
                        Save Changes
                      </button>
                      <button
                        className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors"
                        onClick={() => setIsEditingProject(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
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
                  totalSalaries={totalSalaries}
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