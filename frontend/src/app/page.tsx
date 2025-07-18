// src/app/page.tsx
// This is the main page of our frontend application, built with Next.js and React.
"use client"; // This directive is necessary in Next.js 13+ to mark this as a client-side component, allowing us to use state and effects.

// --- Imports ---
// We import 'useState' from React to manage the state of our component,
// such as the input code, the selected language, the analysis result, and loading status.
import { useState } from "react";

// --- Main Component ---
export default function HomePage() {
	// --- State Management ---
	// 'code' stores the text from the textarea.
	const [code, setCode] = useState<string>(
		'function greet(name) {\n  return "Hello, " + name;\n}'
	);
	// 'language' stores the value from the dropdown.
	const [language, setLanguage] = useState<string>("javascript");
	// 'result' will store the JSON object we get back from our backend API.
	const [result, setResult] = useState<any>(null);
	// 'isLoading' will be true while we are waiting for the API response.
	const [isLoading, setIsLoading] = useState<boolean>(false);
	// 'error' will store any error messages.
	const [error, setError] = useState<string | null>(null);

	// --- Event Handler ---
	// This function is called when the "Analyze Code" button is clicked.
	const handleAnalyze = async () => {
		// Reset previous results and errors, and set loading to true.
		setResult(null);
		setError(null);
		setIsLoading(true);

		try {
			// Make a POST request to our backend API endpoint.
			const response = await fetch("http://127.0.0.1:8000/api/analyze", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				// The body of the request is a JSON string containing the code and language.
				body: JSON.stringify({ code, language }),
			});

			// If the response from the server is not 'OK' (e.g., a 4xx or 5xx error),
			// we process it as an error.
			if (!response.ok) {
				const errorData = await response.json();
				// We construct a helpful error message from the server's response.
				throw new Error(
					errorData.detail || "An error occurred while analyzing the code."
				);
			}

			// If the response is successful, we parse the JSON body and store it in our state.
			const data = await response.json();
			setResult(data);
		} catch (err: any) {
			// If any error occurs during the fetch process, we catch it here.
			setError(err.message);
		} finally {
			// This block always runs, regardless of success or failure.
			// We set loading back to false.
			setIsLoading(false);
		}
	};

	// --- JSX (Component's HTML Structure) ---
	return (
		<main className="flex min-h-screen flex-col items-center bg-gray-50 p-4 sm:p-12">
			<div className="w-full max-w-4xl">
				{/* Header */}
				<header className="text-center mb-10">
					<h1 className="text-4xl sm:text-5xl font-bold text-gray-800">
						AI Code Reviewer
					</h1>
					<p className="mt-2 text-lg text-gray-600">
						Get instant feedback and documentation for your code.
					</p>
				</header>

				{/* Input Section */}
				<div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
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

				{/* Results Section */}
				{error && (
					<div className="mt-8 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
						<p className="font-bold">Error:</p>
						<p>{error}</p>
					</div>
				)}

				{result && (
					<div className="mt-8 bg-white p-6 rounded-xl shadow-md border border-gray-200 animate-fade-in">
						<h2 className="text-2xl font-bold text-gray-800 mb-4">
							Analysis Results
						</h2>

						{/* Explanation */}
						<div className="mb-6">
							<h3 className="text-xl font-semibold text-gray-700 border-b pb-2 mb-3">
								Explanation
							</h3>
							<p className="text-gray-600 whitespace-pre-wrap">
								{result.explanation}
							</p>
						</div>

						{/* Suggestions */}
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

						{/* Bugs */}
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
			</div>
		</main>
	);
}
