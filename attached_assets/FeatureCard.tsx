import { 
  Clipboard, Code, BarChart3, Code2, Download, Settings
} from 'lucide-react';

type FeatureCardProps = {
  title: string;
  description: string;
  icon: string;
};

export default function FeatureCard({ title, description, icon }: FeatureCardProps) {
  const getIcon = () => {
    switch (icon) {
      case 'clipboard':
        return <Clipboard className="h-6 w-6 text-primary-600" />;
      case 'code':
        return <Code className="h-6 w-6 text-primary-600" />;
      case 'chart':
        return <BarChart3 className="h-6 w-6 text-primary-600" />;
      case 'code-2':
        return <Code2 className="h-6 w-6 text-primary-600" />;
      case 'download':
        return <Download className="h-6 w-6 text-primary-600" />;
      case 'settings':
        return <Settings className="h-6 w-6 text-primary-600" />;
      default:
        return <Clipboard className="h-6 w-6 text-primary-600" />;
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
      <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center mb-4">
        {getIcon()}
      </div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
