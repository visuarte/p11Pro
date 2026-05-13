# Backend API Developer Skill

## Description

This skill enables the agent to design, implement, and maintain RESTful APIs for backend services. It covers Node.js/Express and Kotlin/Ktor patterns used in the KoliCode project.

## Capabilities

- Design RESTful API endpoints following REST principles
- Implement Express.js middleware and route handlers
- Create Ktor routes and handlers in Kotlin
- Integrate with PostgreSQL using Exposed ORM
- Implement authentication and authorization
- Write API documentation (OpenAPI/Swagger)
- Create comprehensive API tests
- Handle errors gracefully with proper HTTP status codes
- Implement rate limiting and security measures

## When to Activate

Activate this skill when:
- Creating new API endpoints
- Modifying existing API routes
- Implementing backend business logic
- Integrating with databases
- Adding authentication/authorization
- Writing API documentation
- Debugging API issues

## Examples

### Example 1: Express.js REST Endpoint

```typescript
// controllers/project-controller.ts
import { Request, Response } from 'express';
import { ProjectService } from '../services/project-service';

export class ProjectController {
  private projectService: ProjectService;

  constructor() {
    this.projectService = new ProjectService();
  }

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const projects = await this.projectService.findAll();
      res.json(projects);
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch projects',
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const project = await this.projectService.findById(id);
      
      if (!project) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Project not found',
            timestamp: new Date().toISOString()
          }
        });
        return;
      }
      
      res.json(project);
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch project',
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const { name, description } = req.body;
      
      // Validation
      if (!name) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Name is required',
            timestamp: new Date().toISOString()
          }
        });
        return;
      }
      
      const project = await this.projectService.create(name, description);
      res.status(201).json(project);
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create project',
          timestamp: new Date().toISOString()
        }
      });
    }
  }
}

// routes/project-routes.ts
import { Router } from 'express';
import { ProjectController } from '../controllers/project-controller';

const router = Router();
const controller = new ProjectController();

router.get('/projects', (req, res) => controller.getAll(req, res));
router.get('/projects/:id', (req, res) => controller.getById(req, res));
router.post('/projects', (req, res) => controller.create(req, res));

export default router;
```

### Example 2: Ktor REST Endpoint

```kotlin
// routes/ProjectRoutes.kt
fun Route.projectRoutes(projectDAO: ProjectDAO) {
    route("/projects") {
        get {
            val projects = projectDAO.findAll()
            call.respond(HttpStatusCode.OK, projects)
        }
        
        get("/{id}") {
            val id = call.parameters["id"]?.let { UUID.fromString(it) }
                ?: return@get call.respond(
                    HttpStatusCode.BadRequest,
                    ErrorResponse("INVALID_ID", "Invalid project ID")
                )
            
            val project = projectDAO.findById(id)
                ?: return@get call.respond(
                    HttpStatusCode.NotFound,
                    ErrorResponse("NOT_FOUND", "Project not found")
                )
            
            call.respond(HttpStatusCode.OK, project)
        }
        
        post {
            val request = call.receive<CreateProjectRequest>()
            
            if (request.name.isBlank()) {
                return@post call.respond(
                    HttpStatusCode.BadRequest,
                    ErrorResponse("VALIDATION_ERROR", "Name is required")
                )
            }
            
            val projectId = projectDAO.create(request.name, request.description)
            val project = projectDAO.findById(projectId)
            
            call.respond(HttpStatusCode.Created, project)
        }
        
        delete("/{id}") {
            val id = call.parameters["id"]?.let { UUID.fromString(it) }
                ?: return@delete call.respond(
                    HttpStatusCode.BadRequest,
                    ErrorResponse("INVALID_ID", "Invalid project ID")
                )
            
            projectDAO.delete(id)
            call.respond(HttpStatusCode.NoContent)
        }
    }
}
```

### Example 3: Database Service Layer

```typescript
// services/project-service.ts
import { Pool } from 'pg';

export interface Project {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export class ProjectService {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
  }

  async findAll(): Promise<Project[]> {
    const result = await this.pool.query(
      'SELECT * FROM projects ORDER BY created_at DESC'
    );
    return result.rows;
  }

  async findById(id: string): Promise<Project | null> {
    const result = await this.pool.query(
      'SELECT * FROM projects WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async create(name: string, description?: string): Promise<Project> {
    const result = await this.pool.query(
      `INSERT INTO projects (name, description) 
       VALUES ($1, $2) 
       RETURNING *`,
      [name, description]
    );
    return result.rows[0];
  }

  async update(id: string, name: string, description?: string): Promise<Project | null> {
    const result = await this.pool.query(
      `UPDATE projects 
       SET name = $1, description = $2, updated_at = NOW() 
       WHERE id = $3 
       RETURNING *`,
      [name, description, id]
    );
    return result.rows[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM projects WHERE id = $1',
      [id]
    );
    return result.rowCount > 0;
  }
}
```

## Best Practices

1. **RESTful Design**
   - Use proper HTTP methods (GET, POST, PUT, DELETE)
   - Use plural nouns for resources (/projects, not /project)
   - Use HTTP status codes correctly
   - Version your API (/api/v1/)

2. **Error Handling**
   - Always return consistent error format
   - Include error codes for client handling
   - Log errors server-side
   - Don't expose sensitive information in errors

3. **Validation**
   - Validate all input data
   - Use schema validation libraries
   - Return clear validation error messages
   - Sanitize input to prevent injection attacks

4. **Security**
   - Use parameterized queries (prevent SQL injection)
   - Implement authentication/authorization
   - Use HTTPS in production
   - Implement rate limiting
   - Validate content types

5. **Performance**
   - Use connection pooling for databases
   - Implement caching where appropriate
   - Use pagination for large datasets
   - Optimize database queries
   - Use async/await properly

6. **Testing**
   - Write unit tests for services
   - Write integration tests for endpoints
   - Test error cases
   - Test authentication/authorization
   - Use test databases

7. **Documentation**
   - Document all endpoints
   - Include request/response examples
   - Document error codes
   - Keep documentation up to date
   - Use OpenAPI/Swagger

## Common Patterns

### Middleware Pattern
```typescript
// middleware/auth.ts
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'No token provided' }
    });
  }
  
  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      error: { code: 'INVALID_TOKEN', message: 'Invalid token' }
    });
  }
};
```

### Repository Pattern
```typescript
export interface IRepository<T> {
  findAll(): Promise<T[]>;
  findById(id: string): Promise<T | null>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
}
```

### Service Layer Pattern
```typescript
export class Service<T> {
  constructor(private repository: IRepository<T>) {}
  
  async getAll(): Promise<T[]> {
    return this.repository.findAll();
  }
  
  async getById(id: string): Promise<T> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new NotFoundError('Item not found');
    }
    return item;
  }
}
```

## References

- Express.js: https://expressjs.com/
- Ktor: https://ktor.io/
- PostgreSQL: https://www.postgresql.org/
- REST API Design: https://restfulapi.net/
- OpenAPI: https://swagger.io/specification/
