import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { UploadCloud, X, AlertCircle } from "lucide-react";
import { uploadExcel } from "../services/api";

export default function UploadPage() {
    const navigate = useNavigate();
    const [dragOver, setDragOver] = useState(false);
    const [progress, setProgress] = useState(0);

    const mutation = useMutation({
        mutationFn: (file: File) => uploadExcel(file),
        onSuccess: () => navigate("/dashboard/focus"),
        onError: () => setProgress(0),
    });

    const handleFile = useCallback((file: File) => {
        setProgress(0);
        mutation.mutate(file);
    }, [mutation]);

    return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-bg)" }}>
            <div className="bg-white rounded-xl border p-10 w-[600px]" style={{ borderColor: "var(--color-border)" }}>
                <h1 className="text-2xl font-semibold text-center mb-2">
                    Upload your service call report to get started
                </h1>
                <p className="text-center text-gray-500 mb-6">
                    Drag and drop your Excel (.xlsx) file containing the quarterly or
                    employee analytics data.
                </p>

                {mutation.isError && (
                    <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4">
                        <AlertCircle size={18} className="mt-0.5 shrink-0" />
                        <div className="flex-1">
                            <p className="font-medium text-sm">Upload Failed</p>
                            <p className="text-sm">{(mutation.error as any)?.message}</p>
                        </div>
                        <button onClick={() => mutation.reset()}><X size={16} /></button>
                    </div>
                )}

                {!mutation.isPending && (
                    <div
                        className="border-2 border-dashed rounded-lg p-10 text-center transition-colors"
                        style={{
                            borderColor: dragOver ? "var(--color-accent)" : "#d1d5db",
                            background: dragOver ? "var(--color-accent-light)" : "transparent",
                        }}
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={(e) => {
                            e.preventDefault(); setDragOver(false);
                            const file = e.dataTransfer.files[0];
                            if (file) handleFile(file);
                        }}
                    >
                        <div
                            className="mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-4"
                            style={{ background: "var(--color-accent-light)" }}
                        >
                            <UploadCloud style={{ color: "var(--color-accent)" }} size={26} />
                        </div>
                        <p className="font-medium mb-1">Drag & Drop file here</p>
                        <p className="text-sm text-gray-500 mb-4">Supported formats: .xlsx (Max 50MB)</p>
                        <div className="flex items-center gap-3 mb-4">
                            <hr className="flex-1" /><span className="text-xs text-gray-400">OR</span><hr className="flex-1" />
                        </div>
                        <label
                            className="inline-block text-white text-sm font-medium px-4 py-2 rounded-md cursor-pointer"
                            style={{ background: "var(--color-accent)" }}
                        >
                            Browse file
                            <input
                                type="file" accept=".xlsx" className="hidden"
                                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                            />
                        </label>
                    </div>
                )}

                {mutation.isPending && (
                    <div className="mt-4 border rounded-lg p-3 flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                            style={{ background: "var(--color-accent-light)" }}
                        >
                            <UploadCloud style={{ color: "var(--color-accent)" }} size={18} />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium">
                                {progress < 100 ? "Uploading…" : "Processing your file…"}
                            </p>
                            <div className="h-1.5 bg-gray-200 rounded-full mt-1.5 overflow-hidden">
                                <div
                                    className="h-1.5 rounded-full transition-all duration-200 ease-out"
                                    style={{ width: `${progress}%`, background: "var(--color-accent)" }}
                                />
                            </div>
                        </div>
                        <span className="text-xs text-gray-500 shrink-0">{progress}%</span>
                    </div>
                )}
            </div>
        </div>
    );
}