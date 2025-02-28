import { useState, useEffect } from "react";
import { ethers } from "ethers";

export default function Home() {
  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState(null);
  const [txid, setTxid] = useState("");
  const [targetAddress, setTargetAddress] = useState(""); // Target address for FLOP to WFLOP
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState(""); // "success" or "error"
  const [isLoading, setIsLoading] = useState(false);
  const [swapOption, setSwapOption] = useState("FLOP_TO_WFLOP");

  const depositAddress = process.env.NEXT_PUBLIC_FLOP_DEPOSIT_ADDRESS;
  const wfloBurnAddress = process.env.NEXT_PUBLIC_WFLOP_DEPOSIT_ADDRESS;

  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      const prov = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(prov);
    }
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask.");
      return;
    }
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setAccount(accounts[0]);
      setTargetAddress(accounts[0]); // Auto-fill target address when connecting
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!txid) {
      alert("Please enter a transaction ID.");
      return;
    }
    if (!targetAddress) {
      alert("Please enter a valid address for the WFLOP to be sent.");
      return;
    }

    setStatus("Processing transaction...");
    setStatusType("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/bridge-swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionHash: txid,
          userAddress: targetAddress,
          swapOption,
        }),
      });
      const data = await response.json();

      if (response.ok) {
        setStatusType("success");
        setStatus(`Success: ${data.message} ${data.polygonTxHash ? "Polygon TX: " + data.polygonTxHash : ""}`);
      } else {
        setStatusType("error");
        setStatus(`${data.error}.`);
      }
    } catch (error) {
      console.error("Error submitting transaction:", error);
      setStatusType("error");
      setStatus("An unexpected issue occurred. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#212121] flex flex-col items-center justify-center p-4">
      <div className="mb-4 flex space-x-2">
        <button onClick={() => setSwapOption("FLOP_TO_WFLOP")} className={`px-4 py-2 rounded ${swapOption === "FLOP_TO_WFLOP" ? "bg-blue-500 text-white" : "bg-gray-300 text-black"}`}>FLOP to WFLOP</button>
        <button onClick={() => setSwapOption("WFLOP_TO_FLOP")} className={`px-4 py-2 rounded ${swapOption === "WFLOP_TO_FLOP" ? "bg-blue-500 text-white" : "bg-gray-300 text-black"}`}>WFLOP to FLOP</button>
      </div>
      <div className="max-w-xl w-full bg-white shadow-md rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-8 text-center text-[#212121]">{swapOption === "FLOP_TO_WFLOP" ? "FLOP to WFLOP Bridge" : "WFLOP to FLOP Bridge"}</h1>
        {swapOption === "FLOP_TO_WFLOP" ? (
          <>
            <p className="mb-4 text-center text-black">To swap FLOP to WFLOP, please send your FLOP tokens to the following deposit address:</p>
            <p className="font-mono text-blue-600 text-center mb-4">{depositAddress}</p>
            <p className="mb-4 text-center text-black">Once the transfer is confirmed, enter the transaction ID and the address where you’d like to receive your WFLOP tokens.</p>
            <label className="block text-gray-700 mb-2">Enter WFLOP Address to receive tokens:</label>
            <input type="text" value={targetAddress} onChange={(e) => setTargetAddress(e.target.value)} placeholder="Enter WFLOP address" className="w-full text-black p-2 border border-gray-300 rounded mb-4" disabled={isLoading} />
            <button className="bg-blue-500 text-white px-6 py-3 rounded-md mb-4" onClick={connectWallet}>Connect to MetaMask</button>
          </>
        ) : (
          <>
            <p className="mb-4 text-center text-black">To swap WFLOP to FLOP, please send your WFLOP tokens to the designated burn address:</p>
            <p className="font-mono text-blue-600 text-center mb-4">{wfloBurnAddress}</p>
            <p className="mb-4 text-center text-black">Once the transfer is confirmed, enter the transaction ID and the FLOP address where you’d like to receive your tokens.</p>
            <label className="block text-gray-700 mb-2">Enter FLOP Address to receive coins:</label>
            <input type="text" value={targetAddress} onChange={(e) => setTargetAddress(e.target.value)} placeholder="Enter FLOP address" className="w-full text-black p-2 border border-gray-300 rounded mb-4" disabled={isLoading} />
          </>
        )}
        <form onSubmit={handleSubmit}>
          <label className="block text-gray-700 mb-2">Transaction ID:</label>
          <input type="text" value={txid} onChange={(e) => setTxid(e.target.value)} placeholder="Enter TXID" className="w-full p-2 border text-black border-gray-300 rounded mb-4" disabled={isLoading} />
          <button type="submit" className="w-full bg-green-500 text-white px-6 py-3 rounded-md" disabled={isLoading}>{isLoading ? "Processing..." : "Submit Transaction"}</button>
        </form>
        <p className={`mt-4 text-center ${statusType === "success" ? "text-green-500" : statusType === "error" ? "text-red-500" : "text-black"}`}>{status}</p>
      </div>
    </div>
  );
}