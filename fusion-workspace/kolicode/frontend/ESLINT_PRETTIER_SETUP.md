# ESLint & Prettier Setup - Documentación

## Descripción

Este directorio está configurado con **ESLint 10.3.0** para linting de código TypeScript/JavaScript y **Prettier 3.8.3** para formateo automático.

## Configuración

### ESLint

**Archivo:** `eslint.config.js`

- **Versión:** ESLint 10.3.0 (nuevo formato de configuración flat config)
- **Plugins:** typescript-eslint
- **Soporta:** .js, .ts, .tsx, .jsx
- **Reglas principales:**
  - ESLint recommended rules
  - TypeScript recommended rules
  - Advertencias para variables no utilizadas (patrón: ignora `_*`)

### Prettier

**Archivo:** `.prettierrc`

- **Versión:** 3.8.3
- **Configuración:**
  - Indentación: 2 espacios
  - Largo de línea: 100 caracteres
  - Punto y coma: sí
  - Comillas simples
  - Trailing comma: es5

**Archivos ignorados:** `.prettierignore`

## Scripts Disponibles

### Linting

```bash
# Verificar código sin cambios
npm run lint

# Reparar errores de linting automáticamente
npm run lint:fix
```

### Formateo

```bash
# Formatear código
npm run format

# Verificar formato sin cambios
npm run format:check
```

## Pre-commit Hooks (Husky)

**Archivo:** `.husky/pre-commit`

Los hooks se ejecutan automáticamente antes de cada commit:

1. **lint-staged**: Ejecuta ESLint y Prettier solo en archivos modificados
2. **Auto-fix**: Aplica reparaciones automáticas
3. **Auto-format**: Aplica formateo automático

## Configuración en IDE

### VS Code

Instala estas extensiones:
- **ESLint** (microsoft.vscode-eslint)
- **Prettier** (esbenp.prettier-vscode)

**Archivo recomendado:** `.vscode/settings.json`

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  }
}
```

## Solución de Problemas

### Error: "Cannot find package '@eslint/js'"

Este es un error de instalación. Ejecuta:

```bash
npm install --legacy-peer-deps
```

### Advertencia: ".eslintignore file is no longer supported"

Esto es normal en ESLint 10. Los archivos ignorados se definen en `eslint.config.js`. Puedes remover `.eslintignore` de forma segura (ya removido).

### Los hooks de Husky no funcionan

Asegúrate de estar en un repositorio Git:

```bash
cd /Volumes/PROYECTOSAP/p11pro/fusion-workspace/kolicode/frontend
chmod +x .husky/pre-commit
npx husky install
```

## Integración CI/CD

En los workflows de GitHub Actions, ejecuta:

```bash
npm run lint --legacy-peer-deps
npm run format:check --legacy-peer-deps
```

## Referencias

- [ESLint 10 Migration Guide](https://eslint.org/docs/latest/use/configure/migration-guide)
- [TypeScript ESLint](https://typescript-eslint.io/)
- [Prettier Documentation](https://prettier.io/docs/en/index.html)
- [Husky Documentation](https://typicode.github.io/husky/)

## Dependencias Instaladas

```json
{
  "@eslint/js": "^10.1.0",
  "@typescript-eslint/eslint-plugin": "^8.59.3",
  "@typescript-eslint/parser": "^8.59.3",
  "eslint": "^10.3.0",
  "eslint-config-prettier": "^10.1.8",
  "eslint-plugin-react": "^7.37.5",
  "globals": "^17.6.0",
  "husky": "^9.1.7",
  "lint-staged": "^17.0.4",
  "prettier": "^3.8.3",
  "typescript-eslint": "^8.59.3"
}
```

**Nota:** El flag `--legacy-peer-deps` se usa durante `npm install` para resolver el conflicto de compatibilidad entre ESLint 10 y eslint-plugin-react 7.x.

