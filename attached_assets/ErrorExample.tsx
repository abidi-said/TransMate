type ErrorExampleProps = {
  title: string;
  command: string;
  errorMessage: string;
  suggestion: string;
  command2: string;
};

export default function ErrorExample({ title, command, errorMessage, suggestion, command2 }: ErrorExampleProps) {
  return (
    <div className="border border-red-100 rounded-lg p-4 bg-red-50">
      <h3 className="font-semibold text-lg text-red-700 mb-3">{title}</h3>
      <div className="bg-[#282a36] p-3 font-mono text-sm overflow-x-auto rounded-md">
        <pre>
          <span className="text-[#ff79c6]">{command}</span>
          <br /><span className="text-red-400">{errorMessage}</span>
          <br /><span className="text-yellow-300">{suggestion}</span>
          <br /><span className="text-white">{command2}</span>
        </pre>
      </div>
    </div>
  );
}
