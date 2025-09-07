import {useState, useEffect, useRef} from "react";
import {useMutation} from "@tanstack/react-query";
import {apiClient} from "~/globals";
import {SignInButton, UserButton, useAuth} from "@clerk/react-router";
import {Link} from "react-router";

export function Welcome() {
    const { isSignedIn } = useAuth();
    const [prompt, setPrompt] = useState("")
    const [message, setMessage] = useState("")
    const [status, setStatus] = useState<"info" | "success" | "error">("info");
    const [showExamples, setShowExamples] = useState(false);
    const promptRef = useRef<HTMLTextAreaElement>(null);

    // Auto-focus on the prompt input when the component mounts
    useEffect(() => {
        if (promptRef.current) {
            promptRef.current.focus();
        }

        // Clean up function
        return () => {
            const styleElement = document.getElementById('traicker-custom-styles');
            if (styleElement) {
                styleElement.remove();
            }
        };
    }, []);


    const {mutate} = useMutation({
        mutationFn: async (prompt: string) => {
            // Backend validation - don't process empty prompts
            if (!prompt.trim()) {
                throw new Error("Zadejte prosím text pro odeslání");
            }
            const res = await apiClient.api.store.$post({
                json: { prompt: prompt.trim() }
            })
            if (res.ok) {
                return await res.json()
            }
            throw await res.json()
        },
        onMutate: async (prompt:string) => {
            setStatus("info");
            setMessage("Odesílám...")
        },
        onSuccess: (data) => {
            setPrompt("")
            setStatus("success");
            setMessage("Záznam byl uložen.")
        },
        onError: (error) => {
            setStatus("error");
            setMessage("Bohužel, něco se pokazilo: " + error)
        }
    })

    const getMessageBgColor = () => {
        switch (status) {
            case "success":
                return "bg-green-500/80";
            case "error":
                return "bg-red-500/80";
            default:
                return "bg-blue-500/80";
        }
    }

    return (
        <main className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
            <div className="relative w-full max-w-xl mx-auto">
                <div className="w-full max-w-xl p-6 space-y-4">
                    {isSignedIn ? (
                        <>
                            <div className="flex justify-center mb-4">
                                <Link
                                    to="/reports"
                                    className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-700 hover:border-gray-600"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    <span>Přejít na Analýzu</span>
                                </Link>
                            </div>
                            {/* Main input area - the focal point */}
                            <form
                                className="flex flex-col space-y-2"
                                onSubmit={e => {
                                    e.preventDefault();
                                    if (prompt.trim()) {
                                        mutate(prompt);
                                    } else {
                                        setStatus("error");
                                        setMessage("Zadejte prosím text pro odeslání");
                                    }
                                }}>
                                <textarea
                                    ref={promptRef}
                                    name={"prompt"}
                                    rows={3}
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            if (prompt.trim()) {
                                                mutate(prompt);
                                            }
                                        }
                                    }}
                                    className="p-4 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:ring-1 focus:ring-white/30 focus:border-transparent shadow-inner resize-none text-lg transition-all"
                                    placeholder="Stručně popiš příjem nebo výdej (částka, za co, kdy)"
                                />

                                {/* Quick examples and submit button in a single row */}
                                <div className="flex items-center justify-between gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowExamples(!showExamples)}
                                        className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                                    >
                                        <span>Příklady</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${showExamples ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    <div className="flex items-center gap-2">
                                        <UserButton />
                                        <button
                                            type={"submit"}
                                            disabled={!prompt.trim()}
                                            className={`px-4 py-2 text-sm font-medium text-white ${!prompt.trim() ? 'bg-gray-500 cursor-not-allowed' : 'bg-gray-700 hover:bg-gray-600'} rounded-lg focus:outline-none focus:ring-1 focus:ring-white/30 transition-colors`}
                                        >
                                            Odeslat
                                        </button>
                                    </div>
                                </div>
                            </form>

                            {/* Status message */}
                            {message && (
                                <div className="relative">
                                    <p className={`py-2 px-3 text-sm text-white ${getMessageBgColor()} rounded-lg opacity-90`}>
                                        {message}
                                    </p>
                                </div>
                            )}

                            {/* Collapsible examples panel */}
                            {showExamples && (
                                <div className="mt-2 p-4 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 animate-fadeIn">
                                    <h3 className="font-medium mb-2 text-white/80">Jak použít Traicker:</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="font-medium text-white/70">Záznam výdaje:</p>
                                            <p className="ml-4">40 kafe = výdej 40 Kč (kafe)</p>
                                        </div>
                                        <div>
                                            <p className="font-medium text-white/70">Záznam příjmu:</p>
                                            <p className="ml-4">20,000 mzda = příjem 20,000 Kč (výplata)</p>
                                        </div>
                                        <div>
                                            <p className="font-medium text-white/70">Další formáty:</p>
                                            <p className="ml-4">150 oběd v restauraci</p>
                                            <p className="ml-4">-150 oběd (zápis výdaje pomocí minusu)</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center space-y-4 p-8">
                            <textarea
                                disabled
                                className="p-4 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 shadow-inner resize-none text-lg transition-all w-full opacity-50"
                                rows={3}
                                placeholder="Stručně popiš příjem nebo výdej (částka, za co, kdy)"
                            />
                            <div className="flex justify-end w-full">
                                <SignInButton mode="modal">
                                    <button className="px-4 py-2 text-sm font-medium text-white bg-gray-700 hover:bg-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-white/30 transition-colors flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                        </svg>
                                        Přihlásit se
                                    </button>
                                </SignInButton>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
