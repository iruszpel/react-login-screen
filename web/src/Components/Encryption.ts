

export const hashData = async (text: string, algo: string, iterations: number) => {
    const encoder = new TextEncoder();
    let data = encoder.encode(text);
    for (let i = 0; i < iterations; i++) {
        data = await window.crypto.subtle.digest(algo, data) as Uint8Array;
        
    }
    
    return hexString(data);
}

//Helper functions
function hexString(buffer: Uint8Array | Iterable<number>) {
    return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
}



