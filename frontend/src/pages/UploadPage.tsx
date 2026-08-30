import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { UploadCloud, X, AlertCircle } from "lucide-react";
import { uploadExcel } from "../services/api";

export default function UploadPage() {
    const navigate = useNavigate();
    const [dragOver, setDragOver] = useState(false);
    const mutation = useMutation({
        mutationFn: (file: File) => uploadExcel(file),
        onSuccess: () => navigate("/dashboard/focus"),
    });

    const handleFile = useCallback((file: File) => {
        if (!file.name.endsWith(".xlsx")) {
            mutation.reset();
            // Triggers the same "Upload Failed" banner as a backend rejection,
            // using identical copy for consistency
            mutation.mutate(file); // backend still re-validates and returns the exact error
            return;
        }
        mutation.mutate(file);
    }, [mutation]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[--color-bg]">
            <div className="bg-white rounded-xl border border-[--color-border] p-10 w-[600px]">
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
                <div
                    className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors ${dragOver ? "border-[--color-accent] bg-[--color-accent-light]" : "border-gray-300"}`}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                        e.preventDefault();
                        setDragOver(false);
                        const file = e.dataTransfer.files[0];
                        if (file) handleFile(file);
                    }}
                >
                    <div className="mx-auto w-14 h-14 rounded-full bg-[--color-accent-light] flex items-center justify-center mb-4">
                        <UploadCloud className="text-[--color-accent]" size={26} />
                    </div>
                    <p className="font-medium mb-1">Drag & Drop file here</p>
                    <p className="text-sm text-gray-500 mb-4">Supported formats: .xlsx (Max 50MB)</p>
                    <div className="flex items-center gap-3 mb-4">
                        <hr className="flex-1" /><span className="text-xs text-gray-400">OR</span><hr className="flex-1" />
                    </div>
                    <label className="inline-block bg-[--color-accent] text-white text-sm font-medium px-4 py-2 rounded-md cursor-pointer">
                        Browse file
                        <input
                            type="file"
                            accept=".xlsx"
                            className="hidden"
                            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                        />
                    </label>
                </div>
                {mutation.isPending && (
                    <div className="mt-4 border rounded-lg p-3 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[--color-accent-light] flex items-center justify-center">
                            <UploadCloud className="text-[--color-accent] animate-pulse" size={18} />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium">Processing your file...</p>
                            <div className="h-1.5 bg-gray-200 rounded-full mt-1">
                                <div className="h-1.5 bg-[--color-accent] rounded-full w-1/2 animate-pulse" />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
