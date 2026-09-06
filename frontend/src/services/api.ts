const API_BASE = import.meta.env.VITE_API_BASE_URL;

export function uploadExcel(
    file: File,
    onProgress?: (pct: number) => void
): Promise<{ session_id: string; row_count: number }> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const form = new FormData();
        form.append("file", file);

        xhr.open("POST", `${API_BASE}/api/upload`);
        xhr.withCredentials = true; // sends/receives the session cookie

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable && onProgress) {
                const pct = Math.round((event.loaded / event.total) * 100);
                onProgress(pct);
            }
        };

        xhr.onload = () => {
            let body: any = {};
            try { body = JSON.parse(xhr.responseText); } catch { /* non-JSON response */ }

            if (xhr.status >= 200 && xhr.status < 300) {
                resolve(body);
            } else {
                reject(body.detail ?? body ?? { message: "Upload failed" });
            }
        };

        xhr.onerror = () => reject({ message: "Network error during upload" });

        xhr.send(form);
    });
}