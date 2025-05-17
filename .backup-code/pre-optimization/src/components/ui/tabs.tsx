import React from 'react';

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  onValueChange: (value: string) => void;
}

// 创建上下文以在组件树中传递value
interface TabsContextType {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextType | null>(null);

export function Tabs({ value, onValueChange, className = '', ...props }: TabsProps) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
    <div className={`space-y-4 ${className}`} {...props} />
    </TabsContext.Provider>
  );
}

interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {}

export function TabsList({ className = '', ...props }: TabsListProps) {
  return (
    <div
      className={`inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground ${className}`}
      {...props}
    />
  );
}

interface TabsTriggerProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'value'> {
  value: string;
}

export function TabsTrigger({ value, className = '', ...props }: TabsTriggerProps) {
  // 获取父Tabs的value
  const context = React.useContext(TabsContext);
  
  if (!context) {
    console.error('TabsTrigger must be used within a Tabs component');
    return null;
  }
  
  const isActive = context.value === value;
  
  return (
    <button
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
        isActive
          ? 'bg-background text-foreground shadow-sm'
          : 'hover:bg-background/50 hover:text-foreground/80'
      } ${className}`}
      onClick={() => context.onValueChange(value)}
      {...props}
    />
  );
}

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export function TabsContent({ value, className = '', ...props }: TabsContentProps) {
  // 获取父Tabs的value
  const context = React.useContext(TabsContext);
  
  if (!context) {
    console.error('TabsContent must be used within a Tabs component');
    return null;
  }
  
  if (context.value !== value) {
    return null;
  }
  
  return (
    <div
      className={`mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className}`}
      {...props}
    />
  );
}