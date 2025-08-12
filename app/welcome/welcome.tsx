
import {useState} from "react";
import {useMutation} from "@tanstack/react-query";
import {apiClient} from "~/globals";
import {SignedIn} from "@clerk/react-router";

export function Welcome() {
    const [prompt, setPrompt] = useState("")
    const [message, setMessage] = useState("")
    const [status, setStatus] = useState<"info" | "success" | "error">("info");


    const {mutate} = useMutation({
        mutationFn: async (prompt: string) => {
            return await apiClient.api.store.$post({
                json: {
                    prompt
                }
            })
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
        <main className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-green-900">
        <SignedIn>
            <div className="w-full max-w-2xl p-8 space-y-8 bg-white/10 rounded-2xl shadow-2xl backdrop-blur-lg border border-white/20">
                <div className="text-center">
                    <h1 className="text-5xl font-bold text-white" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.4)'}}>Traicker</h1>
                    <p className="text-gray-300">Snadno zadejte svůj příjem nebo výdej</p>
                </div>

                {message && <p className={`p-3 text-center text-white ${getMessageBgColor()} rounded-xl shadow-lg`}>{message}</p>}

                <form
                    className="flex flex-col space-y-6"
                    onSubmit={e => {
                    mutate(prompt)
                    e.preventDefault();
                }}>
                    <textarea
                        name={"prompt"}
                        rows={5}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="p-4 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:ring-2 focus:ring-yellow-400 focus:border-transparent shadow-inner"
                        placeholder="Zadejte svůj záznam..."
                    />
                    <button
                        type={"submit"}
                        className="px-8 py-4 font-bold text-lg text-white bg-green-600 rounded-lg focus:outline-none border-2 border-transparent hover:bg-green-500 hover:border-yellow-400 transition-colors duration-300 cursor-pointer"
                    >
                        Odeslat
                    </button>
                </form>

                <div className="p-5 border-l-4 border-yellow-400 bg-yellow-400/10 rounded-lg">
                    <p className="text-sm text-gray-200"><span className="font-bold">např.</span> 40 kafe = výdej 40 Kč (kafe)</p>
                    <p className="text-sm text-gray-200"><span className="font-bold">např.</span> 20,000 mzda = příjem 20,000 Kč (výplata)</p>
                </div>
            </div>
        </SignedIn>
        </main>
    );
}
