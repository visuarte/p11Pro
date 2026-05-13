# Frontend React Developer Skill

## Description

Enables the agent to build modern React applications with TypeScript, implementing components, hooks, state management, and API integration for the KoliCode frontend.

## Capabilities

- Create functional React components with TypeScript
- Implement custom hooks for reusable logic
- Manage application state (Context API, reducers)
- Integrate with REST APIs
- Handle forms and validation
- Implement routing and navigation
- Optimize performance (memo, useMemo, useCallback)
- Write component tests
- Implement responsive designs
- Handle loading and error states

## When to Activate

- Creating new UI components
- Implementing user interactions
- Managing application state
- Integrating with backend APIs
- Optimizing frontend performance
- Writing component tests
- Implementing responsive layouts

## Key Patterns

### Component with TypeScript
```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary';
  onClick: () => void;
  children: React.ReactNode;
}

export const Button: FC<ButtonProps> = ({ variant, onClick, children }) => {
  return (
    <button className={`btn btn-${variant}`} onClick={onClick}>
      {children}
    </button>
  );
};
```

### Custom Hook
```typescript
function useAPI<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [url]);

  return { data, loading, error };
}
```

### State Management
```typescript
const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}
```

## Best Practices

1. Use TypeScript for type safety
2. Keep components small and focused
3. Extract reusable logic into custom hooks
4. Use memo/useMemo/useCallback for optimization
5. Handle loading and error states
6. Write tests for components
7. Follow accessibility guidelines
8. Use semantic HTML

## References

- React: https://react.dev/
- TypeScript: https://www.typescriptlang.org/
- Testing Library: https://testing-library.com/
