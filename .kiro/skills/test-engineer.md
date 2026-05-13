# Test Engineer Skill

## Description

Enables the agent to write comprehensive tests including unit tests, integration tests, and end-to-end tests for the KoliCode project.

## Capabilities

- Write unit tests with Jest
- Create integration tests for APIs
- Implement E2E tests with Playwright
- Test React components with Testing Library
- Mock dependencies and external services
- Test error scenarios
- Measure code coverage
- Write property-based tests
- Test async operations
- Configure CI/CD pipelines

## When to Activate

- Writing tests for new features
- Adding test coverage to existing code
- Debugging failing tests
- Setting up test infrastructure
- Implementing CI/CD
- Testing edge cases
- Refactoring code

## Test Patterns

### Unit Test (Jest)
```typescript
describe('ProjectService', () => {
  let service: ProjectService;

  beforeEach(() => {
    service = new ProjectService();
  });

  it('should create a project', async () => {
    const project = await service.create('Test Project', 'Description');
    
    expect(project).toBeDefined();
    expect(project.name).toBe('Test Project');
    expect(project.description).toBe('Description');
  });

  it('should throw error for invalid name', async () => {
    await expect(service.create('', 'Description'))
      .rejects
      .toThrow('Name is required');
  });
});
```

### Integration Test (API)
```typescript
describe('POST /api/v1/projects', () => {
  it('should create a new project', async () => {
    const response = await request(app)
      .post('/api/v1/projects')
      .send({ name: 'Test Project', description: 'Test' })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('Test Project');
  });

  it('should return 400 for missing name', async () => {
    const response = await request(app)
      .post('/api/v1/projects')
      .send({ description: 'Test' })
      .expect(400);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});
```

### Component Test (React)
```typescript
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

### E2E Test (Playwright)
```typescript
test('user can create a project', async ({ page }) => {
  await page.goto('http://localhost:5173');
  
  await page.click('text=New Project');
  await page.fill('input[name="name"]', 'Test Project');
  await page.fill('textarea[name="description"]', 'Test Description');
  await page.click('button[type="submit"]');
  
  await expect(page.locator('text=Test Project')).toBeVisible();
});
```

### Mock Pattern
```typescript
jest.mock('../services/project-service');

const mockProjectService = ProjectService as jest.MockedClass<typeof ProjectService>;

beforeEach(() => {
  mockProjectService.prototype.findAll.mockResolvedValue([
    { id: '1', name: 'Project 1' }
  ]);
});
```

## Best Practices

1. **Test Pyramid**: More unit tests, fewer E2E tests
2. **AAA Pattern**: Arrange, Act, Assert
3. **Test Isolation**: Each test should be independent
4. **Mock External Dependencies**: Don't call real APIs in tests
5. **Test Edge Cases**: Test error scenarios, empty inputs, etc.
6. **Descriptive Names**: Test names should describe what they test
7. **Fast Tests**: Keep tests fast to encourage running them often
8. **Coverage**: Aim for 80%+ code coverage
9. **CI Integration**: Run tests on every commit
10. **Test Data**: Use factories or fixtures for test data

## Test Coverage Goals

- Unit Tests: 80%+ coverage
- Integration Tests: Critical paths covered
- E2E Tests: Main user flows covered
- Edge Cases: Error scenarios tested
- Performance: Load testing for critical endpoints

## References

- Jest: https://jestjs.io/
- Testing Library: https://testing-library.com/
- Playwright: https://playwright.dev/
- Supertest: https://github.com/visionmedia/supertest
