export function ConnectButton({
  isConnected,
  connect,
}: {
  isConnected: boolean;
  connect: () => void;
}) {
  const buttonClass =
    "inline-flex items-center justify-center rounded-xl bg-black px-4 py-4 font-semibold text-white shadow-sm " +
    "transition-colors duration-200 hover:bg-blue-700 active:bg-blue-800 " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 " +
    "disabled:opacity-50 disabled:pointer-events-none";

  return (
    <div className="mx-auto">
      <button className={buttonClass} disabled={isConnected} onClick={connect}>
        <span className="text-4xl p-6">Connect to MetaMask</span>
      </button>
    </div>
  );
}
