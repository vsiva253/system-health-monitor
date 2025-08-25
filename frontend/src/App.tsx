import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import MachinesPage from "./pages/MachinesPage";

export default function App() {
  return (
    <Router>
      <div className="flex h-screen">
        <aside className="w-64 bg-gray-800 text-white flex flex-col p-4">
          <h1 className="text-xl font-bold mb-4">System Dashboard</h1>
          <nav className="flex flex-col space-y-2">
            <Link to="/" className="hover:bg-gray-700 p-2 rounded">Machines</Link>
          </nav>
        </aside>
        <main className="flex-1 bg-gray-100 p-6 overflow-auto">
          <Routes>
            <Route path="/" element={<MachinesPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
