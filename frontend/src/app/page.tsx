// src/app/page.tsx
// This is the main page of our frontend application, built with Next.js and React.
"use client"; // This directive is necessary in Next.js 13+ to mark this as a client-side component, allowing us to use state and effects.

// --- Imports ---
// We import 'useState' and 'useEffect' from React.
// useEffect allows us to perform side effects, like fetching data, when the component loads.
import { useState, useEffect } from "react";

// --- Type Definition for History ---
// Defining a type for our history objects makes the code safer and easier to understand.
interface HistoryItem {
	id: number;
	code: string;
	language: string;
	explanation: string;
	suggestions: string[];
	bugs: string[];
	created_at: string;
}

// --- Main Component ---
export default function HomePage() {
	// --- State Management ---
	const [code, setCode] = useState<string>(
		'function greet(name) {\n  return "Hello, " + name;\n}'
	);
	const [language, setLanguage] = useState<string>("javascript");
	const [result, setResult] = useState<any>(null);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	// New state to store the list of past analyses.
	const [history, setHistory] = useState<HistoryItem[]>([]);

	// --- Data Fetching Function ---
	// We've created a dedicated function to fetch history to avoid repeating code.
	const fetchHistory = async () => {
		try {
			const response = await fetch("http://127.0.0.1:8000/api/history");
			if (!response.ok) {
				const errorData = await response.json().catch(() => null); // Gracefully handle non-JSON responses
				throw new Error(
					errorData?.detail ||
						`Failed to fetch history. Server responded with status: ${response.status}`
				);
			}
			const data = await response.json();
			setHistory(data);
		} catch (err: any) {
			// This catch block is hit for network errors (e.g., server is down)
			console.error("Error fetching history:", err.message);
			// Set a user-friendly error message to guide the user.
			setError(
				"Could not connect to the server to fetch history. Please ensure the backend server is running and try refreshing the page."
			);
		}
	};

	// --- useEffect Hook ---
	// This hook runs once when the component first loads, thanks to the empty dependency array [].
	// It's the perfect place to fetch the initial data.
	useEffect(() => {
		fetchHistory();
	}, []);

	// --- Event Handler ---
	const handleAnalyze = async () => {
		setResult(null);
		setError(null);
		setIsLoading(true);

		try {
			const response = await fetch("http://127.0.0.1:8000/api/analyze", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ code, language }),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => null);
				throw new Error(
					errorData?.detail?.error ||
						`An error occurred. Server responded with status: ${response.status}`
				);
			}

			const data = await response.json();
			setResult(data);
			// After a successful analysis, we re-fetch the history to update the list.
			fetchHistory();
		} catch (err: any) {
			// If any error occurs during the fetch process, we catch it here.
			// We check for the generic "Failed to fetch" to provide a more helpful message.
			const userFriendlyError = err.message.includes("Failed to fetch")
				? "Could not connect to the server. Please ensure the backend server is running on http://127.0.0.1:8000."
				: err.message;
			setError(userFriendlyError);
		} finally {
			setIsLoading(false);
		}
	};

	// --- JSX (Component's HTML Structure) ---
	return (
		<main className="flex min-h-screen flex-col items-center bg-gray-50 p-4 sm:p-12">
			<div className="w-full max-w-4xl">
				<header className="text-center mb-10">
					<h1 className="text-4xl sm:text-5xl font-bold text-gray-800">
						AI Code Reviewer
					</h1>
					<p className="mt-2 text-lg text-gray-600">
						Get instant feedback and documentation for your code.
					</p>
				</header>

				<div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
					{/* Input form remains the same */}
					<div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
						<div className="sm:col-span-3">
							<label
								htmlFor="code-input"
								className="block text-sm font-medium text-gray-700 mb-1"
							>
								Your Code
							</label>
							<textarea
								id="code-input"
								value={code}
								onChange={(e) => setCode(e.target.value)}
								className="w-full h-64 p-3 font-mono text-sm bg-gray-900 text-white rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
								placeholder="Paste your code here..."
							/>
						</div>
						<div>
							<label
								htmlFor="language-select"
								className="block text-sm font-medium text-gray-700 mb-1"
							>
								Language
							</label>
							<select
								id="language-select"
								value={language}
								onChange={(e) => setLanguage(e.target.value)}
								className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
							>
								<option value="python">Python</option>
								<option value="javascript">JavaScript</option>
								<option value="typescript">TypeScript</option>
								<option value="java">Java</option>
								<option value="c++">C++</option>
							</select>
						</div>
					</div>
					<div className="mt-4 text-right">
						<button
							onClick={handleAnalyze}
							disabled={isLoading}
							className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
						>
							{isLoading ? "Analyzing..." : "Analyze Code"}
						</button>
					</div>
				</div>

				{error && (
					<div className="mt-8 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
						<p className="font-bold">Error:</p>
						<p>{error}</p>
					</div>
				)}

				{result && (
					<div className="mt-8 bg-white p-6 rounded-xl shadow-md border border-gray-200 animate-fade-in">
						{/* Results section remains the same */}
						<h2 className="text-2xl font-bold text-gray-800 mb-4">
							Analysis Results
						</h2>
						<div className="mb-6">
							<h3 className="text-xl font-semibold text-gray-700 border-b pb-2 mb-3">
								Explanation
							</h3>
							<p className="text-gray-600 whitespace-pre-wrap">
								{result.explanation}
							</p>
						</div>
						<div className="mb-6">
							<h3 className="text-xl font-semibold text-gray-700 border-b pb-2 mb-3">
								Suggestions
							</h3>
							{result.suggestions && result.suggestions.length > 0 ? (
								<ul className="list-disc list-inside space-y-2 text-gray-600">
									{result.suggestions.map(
										(suggestion: string, index: number) => (
											<li key={index}>{suggestion}</li>
										)
									)}
								</ul>
							) : (
								<p className="text-gray-500">
									No suggestions found. The code looks good!
								</p>
							)}
						</div>
						<div>
							<h3 className="text-xl font-semibold text-gray-700 border-b pb-2 mb-3">
								Potential Bugs
							</h3>
							{result.bugs && result.bugs.length > 0 ? (
								<ul className="list-disc list-inside space-y-2 text-gray-600">
									{result.bugs.map((bug: string, index: number) => (
										<li key={index}>{bug}</li>
									))}
								</ul>
							) : (
								<p className="text-gray-500">
									No potential bugs were detected.
								</p>
							)}
						</div>
					</div>
				)}

				{/* NEW: History Section */}
				<div className="mt-12">
					<h2 className="text-2xl font-bold text-gray-800 mb-4">
						Analysis History
					</h2>
					<div className="space-y-4">
						{history.length > 0
							? history.map((item) => (
									<div
										key={item.id}
										className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
									>
										<div className="flex justify-between items-center">
											<span className="font-mono text-sm text-blue-700 bg-blue-100 px-2 py-1 rounded">
												{item.language}
											</span>
											<span className="text-xs text-gray-500">
												{new Date(item.created_at).toLocaleString()}
											</span>
										</div>
										<pre className="mt-3 bg-gray-100 p-3 rounded text-sm text-gray-800 overflow-x-auto">
											<code>{item.code}</code>
										</pre>
									</div>
							  ))
							: // Hide the "No history yet" message if there was an error fetching it.
							  !error && (
									<div className="text-center py-8 bg-white rounded-lg border border-gray-200">
										<p className="text-gray-500">
											No history yet. Run an analysis to get started!
										</p>
									</div>
							  )}
					</div>
				</div>
			</div>
		</main>
	);
}
