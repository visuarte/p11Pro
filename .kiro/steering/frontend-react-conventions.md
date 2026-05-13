---
inclusion: fileMatch
fileMatchPattern: "**/frontend/**"
---

# Frontend - React + TypeScript Conventions

## Overview

The frontend is built with React + TypeScript + Vite. It provides:
- **CodeEditor**: Input for prompts and code
- **Canvas**: P10pro visual editor
- **Dashboard**: ThunderKoli overview and audit trail
- **DesignStudio**: Graphics processing interface

## Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── CodeEditor/
│   │   ├── Canvas/
│   │   ├── Dashboard/
│   │   └── DesignStudio/
│   ├── pages/               # Page-level components
│   ├── hooks/               # Custom React hooks
│   ├── utils/               # Utility functions
│   ├── services/            # API services
│   ├── store/               # State management
│   ├── styles/              # Global styles
│   ├── assets/              # Static assets
│   ├── types/               # TypeScript types
│   └── main.tsx             # Entry point
├── public/                  # Public assets
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## Component Patterns

### Functional Components with TypeScript

```typescript
// components/Button/Button.tsx
import { FC, ButtonHTMLAttributes } from 'react';
import './Button.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
}

export const Button: FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled,
  ...props
}) => {
  return (
    <button
      className={`button button--${variant} button--${size}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Spinner /> : children}
    </button>
  );
};
```

### Component File Structure

```
ComponentName/
├── ComponentName.tsx        # Component logic
├── ComponentName.css        # Component styles
├── ComponentName.test.tsx   # Component tests
├── index.ts                 # Export barrel
└── types.ts                 # Component-specific types
```

## Custom Hooks

### API Hook Pattern

```typescript
// hooks/useAPI.ts
import { useState, useEffect } from 'react';

interface UseAPIOptions<T> {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  dependencies?: any[];
}

interface UseAPIResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useAPI<T>({
  url,
  method = 'GET',
  body,
  dependencies = []
}: UseAPIOptions<T>): UseAPIResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:4000${url}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, dependencies);

  return { data, loading, error, refetch: fetchData };
}
```

### Form Hook Pattern

```typescript
// hooks/useForm.ts
import { useState, ChangeEvent, FormEvent } from 'react';

interface UseFormOptions<T> {
  initialValues: T;
  onSubmit: (values: T) => void | Promise<void>;
  validate?: (values: T) => Partial<Record<keyof T, string>>;
}

export function useForm<T extends Record<string, any>>({
  initialValues,
  onSubmit,
  validate
}: UseFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (errors[name as keyof T]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (validate) {
      const validationErrors = validate(values);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
  };

  return {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
    reset
  };
}
```

## State Management

### Context + Reducer Pattern

```typescript
// store/AppContext.tsx
import { createContext, useContext, useReducer, ReactNode } from 'react';

interface AppState {
  user: User | null;
  theme: 'light' | 'dark';
  projects: Project[];
}

type AppAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }
  | { type: 'SET_PROJECTS'; payload: Project[] }
  | { type: 'ADD_PROJECT'; payload: Project };

const initialState: AppState = {
  user: null,
  theme: 'light',
  projects: []
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'SET_PROJECTS':
      return { ...state, projects: action.payload };
    case 'ADD_PROJECT':
      return { ...state, projects: [...state.projects, action.payload] };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
```

## API Service Layer

```typescript
// services/api.ts
const API_BASE_URL = 'http://localhost:4000/api/v1';

class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'APIError';
  }
}

async function request<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new APIError(response.status, error.message);
  }

  return response.json();
}

export const api = {
  // Code generation
  generateCode: (prompt: string, language: string) =>
    request<CodeGenResponse>('/generate/code', {
      method: 'POST',
      body: JSON.stringify({ prompt, language }),
    }),

  // Projects
  getProjects: () => request<Project[]>('/projects'),
  getProject: (id: string) => request<Project>(`/projects/${id}`),
  createProject: (data: CreateProjectData) =>
    request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteProject: (id: string) =>
    request<void>(`/projects/${id}`, { method: 'DELETE' }),

  // Audit trail
  getAuditTrail: (projectId: string) =>
    request<AuditLog[]>(`/audit/timeline/${projectId}`),
};
```

## TypeScript Types

```typescript
// types/index.ts

export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CodeGenResponse {
  code: string;
  explanation: string;
  language: string;
  timestamp: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  timestamp: string;
  status: 'success' | 'error';
}

export type Theme = 'light' | 'dark';
export type Language = 'typescript' | 'javascript' | 'python' | 'kotlin';
```

## Styling Conventions

### CSS Modules

```css
/* Button.module.css */
.button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.button--primary {
  background-color: #007bff;
  color: white;
}

.button--primary:hover {
  background-color: #0056b3;
}

.button--secondary {
  background-color: #6c757d;
  color: white;
}

.button--danger {
  background-color: #dc3545;
  color: white;
}

.button--small {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}

.button--large {
  padding: 0.75rem 1.5rem;
  font-size: 1.125rem;
}
```

## Testing

### Component Tests

```typescript
// Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when loading', () => {
    render(<Button loading>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

## Performance Optimization

### Memoization

```typescript
import { memo, useMemo, useCallback } from 'react';

export const ExpensiveComponent = memo(({ data }: { data: any[] }) => {
  const processedData = useMemo(() => {
    return data.map(item => expensiveOperation(item));
  }, [data]);

  const handleClick = useCallback(() => {
    console.log('Clicked');
  }, []);

  return (
    <div>
      {processedData.map(item => (
        <div key={item.id} onClick={handleClick}>
          {item.name}
        </div>
      ))}
    </div>
  );
});
```

### Code Splitting

```typescript
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const CodeEditor = lazy(() => import('./components/CodeEditor'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/editor" element={<CodeEditor />} />
      </Routes>
    </Suspense>
  );
}
```

## Best Practices

1. **Always use TypeScript** - No `any` types unless absolutely necessary
2. **Functional components** - Use hooks instead of class components
3. **Single responsibility** - One component does one thing well
4. **Props interface** - Always define prop types
5. **Error boundaries** - Wrap components that might fail
6. **Loading states** - Show feedback during async operations
7. **Accessibility** - Use semantic HTML and ARIA attributes
8. **Performance** - Use memo, useMemo, useCallback when needed

## References

- Frontend Source: `frontend/src/`
- React Documentation: https://react.dev/
- TypeScript: https://www.typescriptlang.org/
- Vite: https://vitejs.dev/
