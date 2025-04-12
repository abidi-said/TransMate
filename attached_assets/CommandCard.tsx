type CommandOption = {
  name: string;
  description: string;
  tooltip?: string;
};

type CommandCardProps = {
  name: string;
  description: string;
  usage: string;
  options: CommandOption[];
};

export default function CommandCard({ name, description, usage, options }: CommandCardProps) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden h-full">
      <div className="bg-gray-50 p-4 border-b border-gray-200">
        <h3 className="font-semibold text-lg">{name}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      <div className="p-4 space-y-4">
        <div className="bg-[#282a36] p-3 font-mono text-sm overflow-x-auto rounded-md text-gray-100">
          <pre>{usage}</pre>
        </div>
        <div className="text-sm text-gray-600">
          <h4 className="font-medium mb-2">Options:</h4>
          <ul className="list-disc pl-5 space-y-1">
            {options.map((option, index) => (
              <li key={index} className={option.tooltip ? "relative group" : ""}>
                <code className="bg-gray-100 px-1.5 py-0.5 rounded">{option.name}</code>: {option.description}
                {option.tooltip && (
                  <div className="invisible group-hover:visible absolute z-10 w-60 bg-gray-800 text-white text-center py-2 px-3 rounded shadow-lg -mt-1 ml-1 text-xs bottom-full left-1/2 transform -translate-x-1/2">
                    {option.tooltip}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
